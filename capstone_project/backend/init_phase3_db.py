import os
import pymysql
from dotenv import load_dotenv

backend_env = os.path.join(os.path.abspath(os.path.dirname(__file__)), '.env')
root_env = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), '.env')
if os.path.exists(backend_env):
    load_dotenv(backend_env)
elif os.path.exists(root_env):
    load_dotenv(root_env)

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'learnlink_db')

TRIGGER_SQL = """
CREATE TRIGGER trg_enforce_faculty_capacity
BEFORE INSERT ON mentor_allocations
FOR EACH ROW
BEGIN
    DECLARE v_active_count INT DEFAULT 0;
    DECLARE v_max_capacity INT DEFAULT 0;

    IF NEW.status = 'ACTIVE' THEN
        SELECT max_project_capacity INTO v_max_capacity
        FROM faculty_profiles
        WHERE faculty_id = NEW.faculty_id;

        SELECT COUNT(*) INTO v_active_count
        FROM mentor_allocations
        WHERE faculty_id = NEW.faculty_id
          AND status = 'ACTIVE';

        IF v_active_count >= v_max_capacity THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Allocation rejected: Faculty member has reached maximum project supervision capacity.';
        END IF;
    END IF;
END;
"""

PROCEDURE_SQL = """
CREATE PROCEDURE sp_allocate_mentor_transaction(
    IN p_proposal_id INT,
    IN p_faculty_id INT,
    IN p_admin_id INT,
    IN p_cycle_id INT,
    IN p_reason TEXT,
    OUT p_allocation_id INT,
    OUT p_status_code INT,
    OUT p_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_max_capacity INT DEFAULT 0;
    DECLARE v_current_active INT DEFAULT 0;
    DECLARE v_proposal_status VARCHAR(50);
    DECLARE v_existing_alloc INT DEFAULT 0;
    DECLARE v_team_id INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_code = 500;
        SET p_message = 'Database error occurred during mentor allocation transaction. Transaction rolled back.';
    END;

    START TRANSACTION;

    SELECT status, team_id INTO v_proposal_status, v_team_id
    FROM project_proposals
    WHERE proposal_id = p_proposal_id;

    IF v_proposal_status IS NULL THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_code = 404;
        SET p_message = 'Proposal not found.';
        LEAVE proc_label;
    END IF;

    IF v_proposal_status = 'ALLOCATED' THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_code = 409;
        SET p_message = 'Proposal is already allocated to a faculty mentor.';
        LEAVE proc_label;
    END IF;

    SELECT max_project_capacity INTO v_max_capacity
    FROM faculty_profiles
    WHERE faculty_id = p_faculty_id
    FOR UPDATE;

    IF v_max_capacity IS NULL THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_code = 404;
        SET p_message = 'Faculty profile not found.';
        LEAVE proc_label;
    END IF;

    SELECT COUNT(*) INTO v_current_active
    FROM mentor_allocations
    WHERE faculty_id = p_faculty_id
      AND status = 'ACTIVE';

    IF v_current_active >= v_max_capacity THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_code = 400;
        SET p_message = 'Selected faculty mentor has reached maximum project capacity.';
        LEAVE proc_label;
    END IF;

    INSERT INTO mentor_allocations (proposal_id, faculty_id, cycle_id, status, allocated_by)
    VALUES (p_proposal_id, p_faculty_id, p_cycle_id, 'ACTIVE', p_admin_id);

    SET p_allocation_id = LAST_INSERT_ID();

    INSERT INTO allocation_audit_logs (allocation_id, action, performed_by, reason)
    VALUES (p_allocation_id, 'ASSIGNED', p_admin_id, p_reason);

    UPDATE project_proposals
    SET status = 'ALLOCATED'
    WHERE proposal_id = p_proposal_id;

    IF v_team_id > 0 THEN
        UPDATE project_teams
        SET status = 'ALLOCATED'
        WHERE team_id = v_team_id;
    END IF;

    COMMIT;

    SET p_status_code = 200;
    SET p_message = 'Faculty mentor allocated successfully via atomic transaction.';
END;
"""

def initialize_phase3_database():
    print(f"Connecting to MySQL server at {DB_HOST}:{DB_PORT}...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=True,
        charset='utf8mb4'
    )

    schema_path = os.path.join(os.path.dirname(__file__), 'sql', '03_phase3_schema.sql')
    print(f"Applying Phase 3 DDL from {schema_path}...")
    with open(schema_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into standard SQL part before DELIMITER //
    standard_part = content.split("DELIMITER //")[0]
    
    with conn.cursor() as cursor:
        statements = [stmt.strip() for stmt in standard_part.split(';') if stmt.strip()]
        for stmt in statements:
            if stmt.upper().startswith("USE "):
                continue
            try:
                cursor.execute(stmt)
            except Exception as e:
                if "already exists" not in str(e).lower():
                    print(f"Notice on statement: {e}")

        # Drop and create Trigger
        cursor.execute("DROP TRIGGER IF EXISTS trg_enforce_faculty_capacity;")
        cursor.execute(TRIGGER_SQL)
        print("Database Trigger 'trg_enforce_faculty_capacity' created successfully!")

        # Drop and create Stored Procedure
        cursor.execute("DROP PROCEDURE IF EXISTS sp_allocate_mentor_transaction;")
        cursor.execute(PROCEDURE_SQL)
        print("Stored Procedure 'sp_allocate_mentor_transaction' created successfully!")

        # Verification
        print("\n=== VERIFIED PHASE 3 OBJECTS ===")
        cursor.execute("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE';")
        tables = [t[0] for t in cursor.fetchall()]
        print("Tables in learnlink_db:", len(tables), "tables")

        cursor.execute("SHOW FULL TABLES WHERE Table_type = 'VIEW';")
        views = [t[0] for t in cursor.fetchall()]
        print("Views:", views)

        cursor.execute("SHOW TRIGGERS WHERE `Table` = 'mentor_allocations';")
        triggers = [tr[0] for tr in cursor.fetchall()]
        print("Triggers on mentor_allocations:", triggers)

        cursor.execute("SHOW PROCEDURE STATUS WHERE Db = %s;", (DB_NAME,))
        procs = [p[1] for p in cursor.fetchall()]
        print("Stored Procedures:", procs)

    conn.close()
    print("\nPhase 3 database initialization finished successfully!")

if __name__ == '__main__':
    initialize_phase3_database()

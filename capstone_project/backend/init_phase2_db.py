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

FN_SQL = """
CREATE FUNCTION fn_get_team_skill_gap_count(p_team_id INT, p_idea_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE missing_count INT DEFAULT 0;

    SELECT COUNT(*) INTO missing_count
    FROM project_skill_requirements psr
    WHERE psr.idea_id = p_idea_id
      AND psr.importance_level = 'REQUIRED'
      AND psr.skill_id NOT IN (
          SELECT us.skill_id
          FROM team_members tm
          JOIN user_skills us 
            ON tm.student_id = us.student_id
          WHERE tm.team_id = p_team_id
            AND tm.status = 'ACTIVE'
            AND us.skill_type = 'OFFERED'
      );

    RETURN missing_count;
END
"""

def initialize_phase2_database():
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

    schema_path = os.path.join(os.path.dirname(__file__), 'sql', '02_phase2_schema.sql')
    print(f"Applying Phase 2 DDL from {schema_path}...")
    with open(schema_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into standard SQL part before DELIMITER
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

        # Recreate function reliably
        cursor.execute("DROP FUNCTION IF EXISTS fn_get_team_skill_gap_count;")
        cursor.execute(FN_SQL)
        print("Stored Function 'fn_get_team_skill_gap_count' created successfully!")

        # Verification
        print("\n=== VERIFIED PHASE 2 OBJECTS ===")
        cursor.execute("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE';")
        tables = [t[0] for t in cursor.fetchall()]
        print("Tables:", tables)

        cursor.execute("SHOW FULL TABLES WHERE Table_type = 'VIEW';")
        views = [t[0] for t in cursor.fetchall()]
        print("Views:", views)

        cursor.execute("SELECT fn_get_team_skill_gap_count(1, 1);")
        print("Verified fn_get_team_skill_gap_count test call: OK")

    conn.close()
    print("\nPhase 2 database initialization completed successfully!")

if __name__ == '__main__':
    initialize_phase2_database()

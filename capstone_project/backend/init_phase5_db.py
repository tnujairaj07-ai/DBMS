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

TABLES_SQL = [
    """
    CREATE TABLE IF NOT EXISTS availability_slots (
        slot_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        day_of_week ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_slot_time CHECK (end_time > start_time),
        CONSTRAINT fk_slot_user FOREIGN KEY (user_id) 
            REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
    """,
    """
    CREATE TABLE IF NOT EXISTS peer_requests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        requester_id INT NOT NULL,
        peer_mentor_id INT NOT NULL,
        skill_id INT NOT NULL,
        message TEXT NULL,
        status ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_peer_not_self CHECK (requester_id != peer_mentor_id),
        CONSTRAINT fk_preq_requester FOREIGN KEY (requester_id) 
            REFERENCES student_profiles(student_id) ON DELETE CASCADE,
        CONSTRAINT fk_preq_mentor FOREIGN KEY (peer_mentor_id) 
            REFERENCES student_profiles(student_id) ON DELETE CASCADE,
        CONSTRAINT fk_preq_skill FOREIGN KEY (skill_id) 
            REFERENCES skills(skill_id) ON DELETE RESTRICT
    ) ENGINE=InnoDB;
    """,
    """
    CREATE TABLE IF NOT EXISTS peer_sessions (
        session_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL UNIQUE,
        scheduled_at DATETIME NOT NULL,
        meeting_link VARCHAR(255) NULL,
        status ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_psess_request FOREIGN KEY (request_id) 
            REFERENCES peer_requests(request_id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
    """,
    """
    CREATE TABLE IF NOT EXISTS session_reviews (
        review_id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL UNIQUE,
        reviewer_id INT NOT NULL,
        rating INT NOT NULL,
        feedback TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
        CONSTRAINT fk_srev_session FOREIGN KEY (session_id) 
            REFERENCES peer_sessions(session_id) ON DELETE CASCADE,
        CONSTRAINT fk_srev_reviewer FOREIGN KEY (reviewer_id) 
            REFERENCES student_profiles(student_id) ON DELETE RESTRICT
    ) ENGINE=InnoDB;
    """,
    """
    CREATE TABLE IF NOT EXISTS consultation_meetings (
        meeting_id INT AUTO_INCREMENT PRIMARY KEY,
        allocation_id INT NOT NULL,
        scheduled_at DATETIME NOT NULL,
        mode ENUM('OFFLINE', 'ONLINE') NOT NULL DEFAULT 'OFFLINE',
        location_or_link VARCHAR(255) NULL,
        status ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
        agenda TEXT NOT NULL,
        minutes_of_meeting TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_cmeet_alloc FOREIGN KEY (allocation_id) 
            REFERENCES mentor_allocations(allocation_id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
    """,
    """
    CREATE TABLE IF NOT EXISTS notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_notif_user FOREIGN KEY (user_id) 
            REFERENCES users(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
    """
]

TRIGGER_RECALCULATE_RATING = """
CREATE TRIGGER trg_recalculate_peer_rating
AFTER INSERT ON session_reviews
FOR EACH ROW
BEGIN
    DECLARE v_mentor_id INT;

    SELECT pr.peer_mentor_id INTO v_mentor_id
    FROM peer_requests pr
    JOIN peer_sessions ps ON pr.request_id = ps.request_id
    WHERE ps.session_id = NEW.session_id;

    IF v_mentor_id IS NOT NULL THEN
        UPDATE peer_sessions
        SET status = 'COMPLETED'
        WHERE session_id = NEW.session_id;

        UPDATE student_profiles
        SET avg_peer_rating = (
            SELECT COALESCE(ROUND(AVG(sr.rating), 2), 0.00)
            FROM session_reviews sr
            JOIN peer_sessions ps ON sr.session_id = ps.session_id
            JOIN peer_requests pr ON ps.request_id = pr.request_id
            WHERE pr.peer_mentor_id = v_mentor_id
        )
        WHERE student_id = v_mentor_id;
    END IF;
END;
"""

VIEW_PEER_RANKINGS = """
CREATE OR REPLACE VIEW vw_peer_mentor_rankings AS
SELECT 
    sp.student_id,
    sp.full_name,
    sp.roll_no,
    d.name AS department_name,
    sp.semester,
    sp.avg_peer_rating,
    COUNT(DISTINCT ps.session_id) AS total_sessions_completed,
    COUNT(DISTINCT sr.review_id) AS total_reviews,
    (
        SELECT GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ')
        FROM user_skills us
        JOIN skills s ON us.skill_id = s.skill_id
        WHERE us.student_id = sp.student_id AND us.skill_type = 'OFFERED'
    ) AS offered_skills
FROM student_profiles sp
JOIN departments d ON sp.department_id = d.department_id
LEFT JOIN peer_requests pr ON sp.student_id = pr.peer_mentor_id AND pr.status = 'ACCEPTED'
LEFT JOIN peer_sessions ps ON pr.request_id = ps.request_id AND ps.status = 'COMPLETED'
LEFT JOIN session_reviews sr ON ps.session_id = sr.session_id
WHERE EXISTS (
    SELECT 1 FROM user_skills us2 
    WHERE us2.student_id = sp.student_id AND us2.skill_type = 'OFFERED'
)
GROUP BY sp.student_id, sp.full_name, sp.roll_no, d.name, sp.semester, sp.avg_peer_rating
ORDER BY sp.avg_peer_rating DESC, total_sessions_completed DESC;
"""

VIEW_DEPARTMENT_ANALYTICS = """
CREATE OR REPLACE VIEW vw_department_analytics AS
SELECT 
    d.department_id,
    d.name AS department_name,
    d.code AS department_code,
    COUNT(DISTINCT sp.student_id) AS total_students,
    COUNT(DISTINCT fp.faculty_id) AS total_faculty,
    COUNT(DISTINCT pp.proposal_id) AS total_proposals,
    COUNT(DISTINCT ma.allocation_id) AS allocated_proposals,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT pp.proposal_id) > 0 
            THEN (COUNT(DISTINCT ma.allocation_id) / COUNT(DISTINCT pp.proposal_id)) * 100 
            ELSE 0.00 
        END, 2
    ) AS allocation_rate_percent,
    COUNT(DISTINCT ps.session_id) AS total_peer_sessions,
    COALESCE(ROUND(AVG(mp.progress_percent), 2), 0.00) AS avg_milestone_progress
FROM departments d
LEFT JOIN student_profiles sp ON d.department_id = sp.department_id
LEFT JOIN faculty_profiles fp ON d.department_id = fp.department_id
LEFT JOIN project_teams pt ON sp.student_id = pt.leader_id
LEFT JOIN project_proposals pp ON pt.team_id = pp.team_id
LEFT JOIN mentor_allocations ma ON pp.proposal_id = ma.proposal_id AND ma.status = 'ACTIVE'
LEFT JOIN peer_requests pr ON sp.student_id = pr.requester_id
LEFT JOIN peer_sessions ps ON pr.request_id = ps.request_id AND ps.status = 'COMPLETED'
LEFT JOIN vw_project_milestone_progress mp ON pp.proposal_id = mp.proposal_id
GROUP BY d.department_id, d.name, d.code;
"""


def init_phase5_db():
    print(f"Connecting to MySQL at {DB_HOST}:{DB_PORT} as {DB_USER}...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=False
    )
    cursor = conn.cursor()

    try:
        # 1. Execute Tables DDL
        print("Creating Phase 5 tables...")
        for sql in TABLES_SQL:
            cursor.execute(sql)
        print("Phase 5 tables created successfully.")

        # 2. Create Trigger
        print("Creating Phase 5 trigger...")
        cursor.execute("DROP TRIGGER IF EXISTS trg_recalculate_peer_rating;")
        cursor.execute(TRIGGER_RECALCULATE_RATING)
        print("Trigger trg_recalculate_peer_rating created successfully.")

        # 3. Create Views
        print("Creating Phase 5 analytical views...")
        cursor.execute(VIEW_PEER_RANKINGS)
        cursor.execute(VIEW_DEPARTMENT_ANALYTICS)
        print("Views vw_peer_mentor_rankings and vw_department_analytics created successfully.")

        conn.commit()
        print("SUCCESS: Phase 5 database initialization completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"FAILED: Error during Phase 5 DB initialization: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    init_phase5_db()

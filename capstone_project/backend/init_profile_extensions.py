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


def initialize_profile_extensions():
    print(f"Connecting to MySQL server at {DB_HOST}:{DB_PORT} ({DB_NAME})...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=True,
        charset='utf8mb4'
    )

    columns_to_add = [
        ("headline", "VARCHAR(150) NULL"),
        ("github_url", "VARCHAR(255) NULL"),
        ("linkedin_url", "VARCHAR(255) NULL"),
        ("portfolio_url", "VARCHAR(255) NULL"),
        ("open_to_mentor", "BOOLEAN NOT NULL DEFAULT TRUE"),
        ("open_to_collaborate", "BOOLEAN NOT NULL DEFAULT TRUE"),
    ]

    with conn.cursor() as cursor:
        for col_name, col_def in columns_to_add:
            cursor.execute(
                """
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'student_profiles' AND COLUMN_NAME = %s
                """,
                (DB_NAME, col_name)
            )
            exists = cursor.fetchone()[0] > 0
            if not exists:
                print(f"Adding column '{col_name}' to student_profiles...")
                cursor.execute(f"ALTER TABLE student_profiles ADD COLUMN {col_name} {col_def};")
            else:
                print(f"Column '{col_name}' already exists in student_profiles.")

        print("Creating table 'student_projects' if not exists...")
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS student_projects (
                project_id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                title VARCHAR(150) NOT NULL,
                description TEXT NOT NULL,
                tech_stack VARCHAR(255) NULL,
                github_url VARCHAR(255) NOT NULL,
                live_demo_url VARCHAR(255) NULL,
                project_type ENUM('PERSONAL', 'ACADEMIC', 'HACKATHON', 'OPEN_SOURCE') NOT NULL DEFAULT 'PERSONAL',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_stu_proj_student FOREIGN KEY (student_id)
                    REFERENCES student_profiles(student_id) ON DELETE CASCADE,
                INDEX idx_stu_proj_student (student_id)
            ) ENGINE=InnoDB;
            """
        )

    conn.close()
    print("Profile extensions applied successfully!")


if __name__ == '__main__':
    initialize_profile_extensions()

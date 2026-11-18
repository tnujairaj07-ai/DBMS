import os
import pymysql
from dotenv import load_dotenv

# Load .env variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'learnlink_db')

def initialize_database():
    print(f"Connecting to MySQL server at {DB_HOST}:{DB_PORT} as '{DB_USER}'...")
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            autocommit=True,
            charset='utf8mb4'
        )
    except Exception as e:
        print(f"FAILED TO CONNECT TO MYSQL: {e}")
        return False

    with conn.cursor() as cursor:
        print(f"Creating database '{DB_NAME}' if not exists...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute(f"USE `{DB_NAME}`;")

        # Read and run schema DDL
        schema_path = os.path.join(os.path.dirname(__file__), 'sql', '01_phase1_schema.sql')
        print(f"Executing Phase 1 DDL from {schema_path}...")
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()

        # Split commands by semicolon while respecting comments
        statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
        for stmt in statements:
            try:
                cursor.execute(stmt)
            except Exception as e:
                # Ignore duplicate index or warnings
                if "already exists" not in str(e).lower():
                    print(f"Notice on statement: {e}")

        # Read and run seed script
        seed_path = os.path.join(os.path.dirname(__file__), 'sql', '06_phase1_seed.sql')
        print(f"Executing Phase 1 Seed Data from {seed_path}...")
        with open(seed_path, 'r', encoding='utf-8') as f:
            seed_sql = f.read()

        seed_statements = [stmt.strip() for stmt in seed_sql.split(';') if stmt.strip()]
        for stmt in seed_statements:
            try:
                cursor.execute(stmt)
            except Exception as e:
                print(f"Notice on seed: {e}")

        # Verification check
        cursor.execute("SHOW TABLES;")
        tables = [t[0] for t in cursor.fetchall()]
        print("\n=== VERIFIED TABLES IN DATABASE ===")
        for t in tables:
            cursor.execute(f"SELECT COUNT(*) FROM `{t}`;")
            count = cursor.fetchone()[0]
            print(f" - {t}: {count} rows")

    conn.close()
    print("\nDatabase initialization completed successfully!")
    return True

if __name__ == '__main__':
    initialize_database()

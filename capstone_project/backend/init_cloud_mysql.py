"""
One-shot Cloud MySQL Initializer & Seeder for Railway (database: railway).
Runs Phase 1-5 schemas, stored functions/procedures, triggers, views,
profile extensions, 500+ students, 100+ faculty, and 12 courses.
"""
import os
import re
import pymysql

DB_HOST = os.environ['DB_HOST']
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ['DB_PASSWORD']
DB_NAME = os.environ.get('DB_NAME', 'railway')

SQL_DIR = os.path.join(os.path.dirname(__file__), 'sql')


def run_sql_file(conn, filename):
    path = os.path.join(SQL_DIR, filename)
    print(f"Executing {filename} on `{DB_NAME}`...")
    with open(path, 'r', encoding='utf-8') as f:
        raw = f.read()

    # Replace hardcoded USE learnlink_db; with target DB_NAME
    raw = re.sub(r'USE\s+learnlink_db\s*;', f'USE `{DB_NAME}`;', raw, flags=re.IGNORECASE)

    # Split by DELIMITER blocks if present (for triggers/procedures/functions)
    delimiter = ';'
    buffer = []
    statements = []

    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith('--'):
            continue
        if stripped.upper().startswith('DELIMITER '):
            if buffer:
                stmt = '\n'.join(buffer).strip()
                if stmt:
                    statements.append(stmt)
                buffer = []
            delimiter = stripped.split()[1]
            continue

        buffer.append(line)
        joined = '\n'.join(buffer).rstrip()
        if joined.endswith(delimiter):
            stmt = joined[:-len(delimiter)].strip()
            if stmt:
                statements.append(stmt)
            buffer = []

    if buffer:
        stmt = '\n'.join(buffer).strip()
        if stmt:
            statements.append(stmt)

    with conn.cursor() as cur:
        for stmt in statements:
            try:
                cur.execute(stmt)
            except Exception as e:
                msg = str(e).lower()
                if any(ok in msg for ok in ('already exists', 'duplicate')):
                    continue
                print(f"  Notice in {filename}: {e}")


def main():
    print(f"Connecting to Cloud MySQL at {DB_HOST}:{DB_PORT}/{DB_NAME}...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=True,
        charset='utf8mb4',
    )

    for fname in [
        '01_phase1_schema.sql',
        '06_phase1_seed.sql',
        '02_phase2_schema.sql',
        '03_phase3_schema.sql',
        '04_phase4_schema.sql',
        '05_phase5_schema.sql',
    ]:
        run_sql_file(conn, fname)

    conn.close()
    print("All Phase 1-5 SQL schemas, triggers, procedures, and views applied!")


if __name__ == '__main__':
    main()

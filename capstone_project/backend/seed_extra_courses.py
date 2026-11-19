"""
Idempotent script to add 6 additional specialized courses (research_domains)
and link existing faculty supervisors to them.
"""
import os
import random
import pymysql
from dotenv import load_dotenv

random.seed(2026)

backend_env = os.path.join(os.path.abspath(os.path.dirname(__file__)), '.env')
if os.path.exists(backend_env):
    load_dotenv(backend_env)

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'learnlink_db')

NEW_DOMAINS = [
    (
        "Database Systems & Query Optimization",
        "Relational modeling, 3NF normalization, B-Tree indexing, ACID transactions, and distributed SQL engines."
    ),
    (
        "Generative AI & Large Language Models",
        "Prompt engineering, retrieval-augmented generation (RAG), transformer fine-tuning, and agentic AI workflows."
    ),
    (
        "Blockchain & Decentralized Systems",
        "Smart contracts, consensus mechanisms, cryptographic ledgers, and decentralized Web3 applications."
    ),
    (
        "Computer Vision & Robotics",
        "Object detection, image segmentation, OpenCV pipelines, SLAM, and autonomous embedded systems."
    ),
    (
        "DevOps, CI/CD & Site Reliability Engineering",
        "Automated testing pipelines, container orchestration, observability, and resilient cloud deployments."
    ),
    (
        "UI/UX Engineering & Human-Computer Interaction",
        "Design systems, accessible interfaces, wireframing, prototyping, and usability testing."
    ),
]


def seed_courses():
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=False,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    cur = conn.cursor()
    try:
        new_domain_ids = []
        for name, desc in NEW_DOMAINS:
            cur.execute("SELECT domain_id FROM research_domains WHERE name = %s", (name,))
            row = cur.fetchone()
            if row:
                new_domain_ids.append(row['domain_id'])
            else:
                cur.execute(
                    "INSERT INTO research_domains (name, description) VALUES (%s, %s)",
                    (name, desc)
                )
                new_domain_ids.append(cur.lastrowid)

        # Assign 18-24 existing faculty members to each new domain
        cur.execute("SELECT faculty_id FROM faculty_profiles")
        all_fac_ids = [r['faculty_id'] for r in cur.fetchall()]

        for dom_id in new_domain_ids:
            chosen = random.sample(all_fac_ids, min(20, len(all_fac_ids)))
            for fid in chosen:
                cur.execute(
                    "INSERT IGNORE INTO faculty_expertise (faculty_id, domain_id, expertise_level) VALUES (%s, %s, %s)",
                    (fid, dom_id, random.randint(3, 5))
                )

        conn.commit()
        cur.execute("SELECT COUNT(*) AS cnt FROM research_domains")
        total = cur.fetchone()['cnt']
        print(f"Successfully ensured {total} total courses/research domains in learnlink_db!")
    except Exception as e:
        conn.rollback()
        print(f"Error seeding extra courses: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == '__main__':
    seed_courses()

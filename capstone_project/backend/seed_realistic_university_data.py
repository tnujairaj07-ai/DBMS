"""
Bulk Realistic University Seed Script for LearnLink
Seeds:
- 500 Students (Indian names, profiles, GitHub/LinkedIn, skills, portfolio projects)
- 100 Faculty Teachers (Indian names, designations, domain & skill expertise)
- 65 Project Ideas with skill requirements
- 120 Project Teams with members & join requests
- Allocation Cycle, 90 Project Proposals, Mentor Preferences, and 60 Active Allocations
- Milestone Submissions & Faculty Feedback
- Peer Mentorship Requests, Sessions, Reviews (triggering avg_peer_rating), & Consultations

All seeded accounts share password: Password@123
"""

import os
import sys
import random
from datetime import datetime, timedelta, time
import pymysql
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

# Ensure deterministic reproducibility with rich variety
random.seed(2026)

backend_env = os.path.join(os.path.abspath(os.path.dirname(__file__)), '.env')
if os.path.exists(backend_env):
    load_dotenv(backend_env)

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'learnlink_db')

# =====================================================================
# INDIAN NAMES & ACADEMIC CORPUS
# =====================================================================
FIRST_NAMES_MALE = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
    "Krishna", "Ishaan", "Shaurya", "Atharv", "Pranav", "Rohan", "Karthik",
    "Siddharth", "Rahul", "Vikram", "Nikhil", "Aniket", "Harsh", "Yash",
    "Kunal", "Dev", "Manav", "Tushar", "Gaurav", "Abhishek", "Varun", "Rishabh",
    "Tanuj", "Samarth", "Parth", "Dhruv", "Kabir", "Lakshay", "Mayank", "Piyush",
    "Shubham", "Utkarsh", "Chirag", "Deepak", "Mohit", "Naveen", "Omkar", "Prateek"
]

FIRST_NAMES_FEMALE = [
    "Aanya", "Diya", "Saanvi", "Ananya", "Pari", "Myra", "Aadhya", "Ira",
    "Kavya", "Riya", "Sneha", "Pooja", "Neha", "Shreya", "Tanvi", "Ishita",
    "Aditi", "Nandini", "Meera", "Priya", "Kritika", "Simran", "Muskan", "Khushi",
    "Sakshi", "Anjali", "Divya", "Bhavna", "Garima", "Harshita", "Jhanvi", "Komal",
    "Lavanya", "Mansi", "Niharika", "Pallavi", "Rashmi", "Swati", "Trisha", "Vaishnavi"
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Patel", "Singh", "Kumar", "Iyer", "Nair",
    "Reddy", "Rao", "Kulkarni", "Deshmukh", "Joshi", "Mehta", "Malhotra", "Kapoor",
    "Agarwal", "Bansal", "Chopra", "Bhatia", "Chatterjee", "Banerjee", "Mukherjee",
    "Das", "Bose", "Sen", "Mishra", "Tiwari", "Pandey", "Dubey", "Shukla",
    "Chauhan", "Rathore", "Yadav", "Thakur", "Saxena", "Srivastava", "Sinha",
    "Menon", "Pillai", "Subramanian", "Krishnan", "Venkatesh", "Gowda", "Hegde",
    "Shetty", "Jain", "Khanna", "Sethi", "Ahluwalia", "Gill", "Sandhu", "Bhatt"
]

HEADLINES = [
    "Full-Stack Web Developer & Open Source Contributor",
    "AI/ML Researcher • Deep Learning & Computer Vision",
    "Backend Systems & Distributed Databases Enthusiast",
    "Cloud Native & DevOps Engineer (Docker / Kubernetes)",
    "Cybersecurity & Network Defense Specialist",
    "Data Engineer & Analytics Pipeline Builder",
    "React & TypeScript Frontend Architect",
    "Embedded IoT & Edge Computing Developer",
    "NLP & Generative AI Application Builder",
    "Competitive Programmer & System Design Learner"
]

BIOS = [
    "Passionate about building scalable full-stack web applications and mentoring juniors in modern JavaScript and relational database design.",
    "Focused on machine learning, computer vision, and practical AI deployments. Active hackathon participant and peer tutor.",
    "Interested in backend engineering, REST APIs, query optimization, and fault-tolerant distributed systems.",
    "Exploring cloud infrastructure, CI/CD automation, and containerized microservices for high-availability applications.",
    "Dedicated to building clean, accessible user interfaces and helping teammates bridge frontend-backend integration gaps."
]

FACULTY_DESIGNATIONS = [
    "Professor", "Associate Professor", "Assistant Professor",
    "Senior Lecturer", "Professor & Research Lead"
]

PROJECT_IDEA_TOPICS = [
    ("Smart Campus Attendance via Face Recognition", "Automated classroom attendance pipeline using OpenCV, deep metric embeddings, and MySQL reporting."),
    ("AI-Powered Academic Doubt & Peer Matchmaker", "Intelligent recommendation engine matching students with qualified peer mentors using skill graphs."),
    ("Distributed Microservices Telemetry Dashboard", "Real-time observability dashboard tracking API latency, error budgets, and container health."),
    ("Blockchain-Verified University Credential Vault", "Tamper-proof academic transcript and certificate verification using cryptographic hashes."),
    ("Automated SQL Query Plan Optimizer & Visualizer", "Educational tool analyzing MySQL EXPLAIN trees and suggesting composite B-Tree indexes."),
    ("IoT Smart Hostel Energy & Water Monitor", "Sensor-driven utility analytics platform for real-time anomaly detection and conservation."),
    ("Multilingual Voice Assistant for Campus Services", "NLP-based conversational assistant supporting Hindi, English, and regional campus queries."),
    ("Real-Time Collaborative Code Review Platform", "WebSocket-powered peer code review workspace with automated linting and rubric scoring."),
    ("Predictive Student Dropout & Performance Early Warning", "ML classification pipeline identifying at-risk learners from attendance and milestone velocity."),
    ("Zero-Trust API Gateway for University Portals", "Role-based JWT gateway with rate limiting, audit logging, and anomaly alerts."),
    ("Smart Library Seat & Book Availability Tracker", "Computer vision and RFID-integrated occupancy tracking system for university libraries."),
    ("Automated Resume & Skill-Gap Analyzer", "NLP parser extracting competencies and recommending targeted peer learning tracks."),
    ("Crop Disease Detection Mobile App for Agri-Tech", "Lightweight CNN model deployed for offline leaf disease diagnosis and treatment guidance."),
    ("Hospital Queue & OPD Triage Optimizer", "Priority scheduling and wait-time prediction engine for university medical centers."),
    ("FinTech Expense & Mess Billing Ledger", "ACID-compliant campus wallet and mess billing reconciliation platform.")
]

PORTFOLIO_PROJECTS = [
    ("CampusConnect REST API", "Modular Flask & MySQL backend handling role-based auth, notifications, and analytics.", "Python, Flask, MySQL, JWT", "ACADEMIC"),
    ("VisionAttend OpenCV", "Real-time facial recognition attendance logger with anti-spoofing liveness checks.", "Python, OpenCV, PyTorch, SQLite", "HACKATHON"),
    ("DevFlow Kanban Board", "Drag-and-drop project tracker built with React 19, Tailwind CSS, and optimistic UI updates.", "React.js, TypeScript, Tailwind CSS", "PERSONAL"),
    ("QueryLens Profiler", "CLI and web visualizer for inspecting MySQL execution plans and slow query logs.", "Python, MySQL, FastAPI, React.js", "OPEN_SOURCE"),
    ("CloudDeploy Automator", "Zero-downtime Docker Compose & GitHub Actions deployment pipeline.", "Docker, CI/CD, Linux, Nginx", "PERSONAL"),
    ("SecureVault Auth Service", "Stateless JWT + refresh token rotation service with bcrypt and audit logging.", "Node.js, Express, PostgreSQL, Redis", "ACADEMIC"),
    ("AgroSense IoT Dashboard", "Live telemetry dashboard visualizing soil moisture and temperature sensor streams.", "Python, MQTT, MongoDB, React.js", "HACKATHON"),
    ("DocuSummarize NLP", "Transformer-based research paper summarizer and citation extractor.", "Python, NLP, PyTorch, FastAPI", "PERSONAL")
]

REVIEW_COMMENTS = [
    "Extremely clear explanation! Helped me debug my SQL joins and understand indexing in 30 minutes.",
    "Very patient mentor. Walked through the code step-by-step and shared great GitHub resources.",
    "Awesome session! My team was stuck on authentication and they helped us resolve it cleanly.",
    "Great conceptual clarity and practical examples. Highly recommend booking a session with them.",
    "Helpful debugging guidance and clear architecture tips for our capstone project.",
    "Well-prepared with examples and very responsive to questions."
]


def get_conn():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=False,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )


def seed_all():
    conn = get_conn()
    cur = conn.cursor()

    try:
        # Check if already seeded with 500+ students
        cur.execute("SELECT COUNT(*) AS cnt FROM student_profiles")
        existing_students = cur.fetchone()['cnt']
        if existing_students >= 500:
            print(f"Database already has {existing_students} students. Skipping duplicate bulk seed.")
            return

        print("Starting bulk realistic Indian university data seeding...")
        shared_pw_hash = generate_password_hash("Password@123")

        # -------------------------------------------------------------
        # 1. Load Master Reference Tables (Departments, Domains, Skills)
        # -------------------------------------------------------------
        cur.execute("SELECT department_id, code FROM departments")
        depts = cur.fetchall()
        dept_ids = [d['department_id'] for d in depts]

        cur.execute("SELECT domain_id, name FROM research_domains")
        domains = cur.fetchall()
        domain_ids = [d['domain_id'] for d in domains]

        cur.execute("SELECT skill_id, name FROM skills")
        skills = cur.fetchall()
        skill_ids = [s['skill_id'] for s in skills]

        # Ensure Admin exists
        cur.execute("SELECT user_id FROM users WHERE role = 'ADMIN' LIMIT 1")
        admin_row = cur.fetchone()
        if not admin_row:
            cur.execute(
                "INSERT INTO users (email, password_hash, role, is_active) VALUES (%s, %s, 'ADMIN', 1)",
                ("admin@university.edu", shared_pw_hash)
            )
            admin_user_id = cur.lastrowid
        else:
            admin_user_id = admin_row['user_id']

        # -------------------------------------------------------------
        # 2. Seed 100 Faculty Teachers (Indian Names)
        # -------------------------------------------------------------
        print("Seeding 100 Faculty Teachers...")
        faculty_records = []  # list of (faculty_id, user_id, dept_id, full_name)
        used_emails = set()
        cur.execute("SELECT email FROM users")
        for r in cur.fetchall():
            used_emails.add(r['email'])

        for i in range(1, 101):
            is_female = (i % 2 == 0)
            fname = random.choice(FIRST_NAMES_FEMALE if is_female else FIRST_NAMES_MALE)
            lname = random.choice(LAST_NAMES)
            prefix = "Dr." if i % 3 != 0 else "Prof."
            full_name = f"{prefix} {fname} {lname}"
            email = f"{fname.lower()}.{lname.lower()}.fac{i}@university.edu"
            emp_code = f"FAC-2026-{i:03d}"
            dept_id = dept_ids[i % len(dept_ids)]
            designation = random.choice(FACULTY_DESIGNATIONS)
            max_cap = random.randint(3, 6)

            if email in used_emails:
                continue
            used_emails.add(email)

            cur.execute(
                "INSERT INTO users (email, password_hash, role, is_active) VALUES (%s, %s, 'FACULTY', 1)",
                (email, shared_pw_hash)
            )
            uid = cur.lastrowid

            cur.execute(
                """INSERT INTO faculty_profiles
                   (user_id, employee_code, department_id, full_name, designation, max_project_capacity)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (uid, emp_code, dept_id, full_name, designation, max_cap)
            )
            fid = cur.lastrowid
            faculty_records.append((fid, uid, dept_id, full_name, max_cap))

            # Assign 1-2 research domain expertise
            chosen_domains = random.sample(domain_ids, random.randint(1, 2))
            for dom_id in chosen_domains:
                cur.execute(
                    "INSERT IGNORE INTO faculty_expertise (faculty_id, domain_id, expertise_level) VALUES (%s, %s, %s)",
                    (fid, dom_id, random.randint(3, 5))
                )

            # Assign 3-5 skill expertise
            chosen_skills = random.sample(skill_ids, random.randint(3, 5))
            for sk_id in chosen_skills:
                cur.execute(
                    "INSERT IGNORE INTO faculty_skill_expertise (faculty_id, skill_id, proficiency_level) VALUES (%s, %s, %s)",
                    (fid, sk_id, random.randint(3, 5))
                )

            # Add 2 availability slots for faculty
            for day in random.sample(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'], 2):
                cur.execute(
                    "INSERT INTO availability_slots (user_id, day_of_week, start_time, end_time) VALUES (%s, %s, %s, %s)",
                    (uid, day, time(14, 0), time(16, 0))
                )

        # -------------------------------------------------------------
        # 3. Seed 500 Students (Indian Names, Profiles, GitHub Projects, Skills)
        # -------------------------------------------------------------
        print("Seeding 500 Students with Skills & GitHub Portfolio Projects...")
        student_records = []  # list of (student_id, user_id, dept_id, full_name)

        for i in range(1, 501):
            is_female = (i % 2 == 0)
            fname = random.choice(FIRST_NAMES_FEMALE if is_female else FIRST_NAMES_MALE)
            lname = random.choice(LAST_NAMES)
            full_name = f"{fname} {lname}"
            email = f"{fname.lower()}.{lname.lower()}.{i}@university.edu"
            roll_no = f"2024-LL-{i:04d}"
            dept_id = dept_ids[i % len(dept_ids)]
            semester = random.choice([3, 4, 5, 6, 7, 8])
            cgpa = round(random.uniform(6.8, 9.85), 2)
            headline = random.choice(HEADLINES)
            bio = random.choice(BIOS)
            slug = f"{fname.lower()}-{lname.lower()}-{i}"
            github_url = f"https://github.com/{slug}"
            linkedin_url = f"https://linkedin.com/in/{slug}"
            portfolio_url = f"https://{slug}.dev" if i % 3 == 0 else None
            open_to_mentor = 1 if i % 5 != 0 else 0
            open_to_collab = 1 if i % 6 != 0 else 0

            if email in used_emails:
                continue
            used_emails.add(email)

            cur.execute(
                "INSERT INTO users (email, password_hash, role, is_active) VALUES (%s, %s, 'STUDENT', 1)",
                (email, shared_pw_hash)
            )
            uid = cur.lastrowid

            cur.execute(
                """INSERT INTO student_profiles
                   (user_id, roll_no, department_id, full_name, semester, cgpa, bio,
                    headline, github_url, linkedin_url, portfolio_url, open_to_mentor, open_to_collaborate)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (uid, roll_no, dept_id, full_name, semester, cgpa, bio,
                 headline, github_url, linkedin_url, portfolio_url, open_to_mentor, open_to_collab)
            )
            sid = cur.lastrowid
            student_records.append((sid, uid, dept_id, full_name))

            # Assign 2-4 OFFERED skills & 1-3 WANTED skills (disjoint)
            sample_skills = random.sample(skill_ids, random.randint(4, 6))
            split_idx = max(2, len(sample_skills) // 2)
            for sk_id in sample_skills[:split_idx]:
                cur.execute(
                    "INSERT IGNORE INTO user_skills (student_id, skill_id, skill_type, proficiency_level) VALUES (%s, %s, 'OFFERED', %s)",
                    (sid, sk_id, random.randint(3, 5))
                )
            for sk_id in sample_skills[split_idx:]:
                cur.execute(
                    "INSERT IGNORE INTO user_skills (student_id, skill_id, skill_type, proficiency_level) VALUES (%s, %s, 'WANTED', %s)",
                    (sid, sk_id, random.randint(1, 3))
                )

            # Add 1-2 GitHub portfolio projects for 70% of students
            if i % 10 < 7:
                num_proj = 2 if i % 3 == 0 else 1
                chosen_projs = random.sample(PORTFOLIO_PROJECTS, num_proj)
                for p_title, p_desc, p_stack, p_type in chosen_projs:
                    repo_slug = p_title.lower().replace(' ', '-')
                    cur.execute(
                        """INSERT INTO student_projects
                           (student_id, title, description, tech_stack, github_url, live_demo_url, project_type)
                           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                        (sid, p_title, p_desc, p_stack,
                         f"https://github.com/{slug}/{repo_slug}",
                         f"https://{repo_slug}-{i}.vercel.app" if i % 2 == 0 else None,
                         p_type)
                    )

            # Add availability slot for peer mentors
            if open_to_mentor and i % 3 == 0:
                day = random.choice(['TUESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])
                cur.execute(
                    "INSERT INTO availability_slots (user_id, day_of_week, start_time, end_time) VALUES (%s, %s, %s, %s)",
                    (uid, day, time(17, 0), time(19, 0))
                )

        # -------------------------------------------------------------
        # 4. Seed 65 Project Ideas & Skill Requirements
        # -------------------------------------------------------------
        print("Seeding 65 Project Ideas with Skill Requirements...")
        idea_ids = []
        for idx in range(65):
            base_title, base_abs = PROJECT_IDEA_TOPICS[idx % len(PROJECT_IDEA_TOPICS)]
            title = f"{base_title} (Batch {idx + 1})" if idx >= len(PROJECT_IDEA_TOPICS) else base_title
            # Mix faculty and student idea creators
            creator_uid = faculty_records[idx % len(faculty_records)][1] if idx % 2 == 0 else student_records[idx % len(student_records)][1]
            dom_id = domain_ids[idx % len(domain_ids)]
            diff = random.choice(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
            status = 'OPEN_FOR_MEMBERS' if idx < 50 else 'TEAM_FORMED'

            cur.execute(
                """INSERT INTO project_ideas (created_by, domain_id, title, abstract, difficulty_level, status)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (creator_uid, dom_id, title, base_abs, diff, status)
            )
            idea_id = cur.lastrowid
            idea_ids.append((idea_id, dom_id))

            req_skills = random.sample(skill_ids, random.randint(3, 5))
            for k, sk_id in enumerate(req_skills):
                imp = 'REQUIRED' if k < 3 else 'NICE_TO_HAVE'
                cur.execute(
                    "INSERT IGNORE INTO project_skill_requirements (idea_id, skill_id, importance_level) VALUES (%s, %s, %s)",
                    (idea_id, sk_id, imp)
                )

        # -------------------------------------------------------------
        # 5. Seed 120 Project Teams, Members & Join Requests
        # -------------------------------------------------------------
        print("Seeding 120 Project Teams and Team Memberships...")
        team_records = []  # list of (team_id, idea_id, domain_id, leader_sid, status)
        team_prefixes = ["Astra", "Kautilya", "Aryabhata", "Vikram", "Nalanda", "Takshashila",
                         "Surya", "Garuda", "Vayu", "Agni", "Prithvi", "Trishul", "Brahma", "Chanakya", "Tejas"]

        shuffled_students = list(student_records)
        random.shuffle(shuffled_students)
        student_cursor = 0

        for t_idx in range(120):
            team_name = f"Team {team_prefixes[t_idx % len(team_prefixes)]} {t_idx + 1}"
            idea_id, dom_id = idea_ids[t_idx % len(idea_ids)]
            team_size = 4 if t_idx < 80 else 3
            if student_cursor + team_size > len(shuffled_students):
                break
            members_slice = shuffled_students[student_cursor:student_cursor + team_size]
            student_cursor += team_size
            leader_sid = members_slice[0][0]
            team_status = 'ALLOCATED' if t_idx < 60 else ('READY' if t_idx < 90 else 'FORMING')

            cur.execute(
                """INSERT INTO project_teams (idea_id, team_name, leader_id, max_members, status)
                   VALUES (%s, %s, %s, %s, %s)""",
                (idea_id, team_name, leader_sid, 4, team_status)
            )
            team_id = cur.lastrowid
            team_records.append((team_id, idea_id, dom_id, leader_sid, team_status))

            for m_idx, (m_sid, _, _, _) in enumerate(members_slice):
                role_in_team = 'LEADER' if m_idx == 0 else 'MEMBER'
                cur.execute(
                    """INSERT INTO team_members (team_id, student_id, member_role, status)
                       VALUES (%s, %s, %s, 'ACTIVE')""",
                    (team_id, m_sid, role_in_team)
                )

        # Remaining unallocated students send join requests to FORMING teams
        forming_teams = [t for t in team_records if t[4] == 'FORMING']
        remaining_students = shuffled_students[student_cursor:]
        for idx, (r_sid, _, _, r_name) in enumerate(remaining_students[:35]):
            if not forming_teams:
                break
            target_team = forming_teams[idx % len(forming_teams)]
            cur.execute(
                """INSERT IGNORE INTO team_join_requests (team_id, student_id, message, status)
                   VALUES (%s, %s, %s, 'PENDING')""",
                (target_team[0], r_sid, f"Hi! I am {r_name} and would love to contribute backend/ML skills to your team.")
            )

        # -------------------------------------------------------------
        # 6. Allocation Cycle, Proposals, Preferences & Allocations
        # -------------------------------------------------------------
        print("Seeding Allocation Cycle, 90 Proposals & 60 Mentor Allocations...")
        cur.execute("SELECT cycle_id FROM allocation_cycles WHERE name = 'Autumn 2026 Capstone Cycle'")
        cyc = cur.fetchone()
        if not cyc:
            cur.execute(
                """INSERT INTO allocation_cycles (name, semester, academic_year, start_date, end_date, status)
                   VALUES ('Autumn 2026 Capstone Cycle', 7, '2026-2027', '2026-08-01', '2026-12-20', 'ALLOCATION_IN_PROGRESS')"""
            )
            cycle_id = cur.lastrowid
        else:
            cycle_id = cyc['cycle_id']

        # Track faculty allocation load carefully so triggers pass cleanly
        faculty_load = {f[0]: 0 for f in faculty_records}
        faculty_cap = {f[0]: f[4] for f in faculty_records}

        # Check existing allocations for this cycle just in case
        cur.execute("SELECT faculty_id, COUNT(*) AS cnt FROM mentor_allocations WHERE status = 'ACTIVE' GROUP BY faculty_id")
        for row in cur.fetchall():
            if row['faculty_id'] in faculty_load:
                faculty_load[row['faculty_id']] = row['cnt']

        allocated_proposals = []  # (proposal_id, team_id, faculty_id, faculty_uid, leader_uid)

        for p_idx, (team_id, idea_id, dom_id, leader_sid, t_status) in enumerate(team_records[:90]):
            base_title, base_abs = PROJECT_IDEA_TOPICS[p_idx % len(PROJECT_IDEA_TOPICS)]
            prop_title = f"{base_title} — Team #{p_idx + 1}"
            objectives = "1. Design normalized 3NF schema. 2. Build REST APIs and React UI. 3. Benchmark performance and deploy."

            # Insert as SUBMITTED first (or APPROVED), then allocate if < 60
            initial_status = 'APPROVED' if p_idx < 60 else ('UNDER_REVIEW' if p_idx < 75 else 'SUBMITTED')
            cur.execute(
                """INSERT INTO project_proposals
                   (team_id, cycle_id, domain_id, title, problem_statement, objectives, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (team_id, cycle_id, dom_id, prop_title, base_abs, objectives, initial_status)
            )
            proposal_id = cur.lastrowid

            # Pick 3 faculty preferences
            pref_facs = random.sample(faculty_records, 3)
            for rank_num, fac in enumerate(pref_facs, start=1):
                cur.execute(
                    """INSERT IGNORE INTO mentor_preferences (proposal_id, faculty_id, preference_rank)
                       VALUES (%s, %s, %s)""",
                    (proposal_id, fac[0], rank_num)
                )

            # Allocate first 60 proposals to faculty with available capacity
            if p_idx < 60:
                chosen_fac = None
                for fac in faculty_records:
                    if faculty_load[fac[0]] < faculty_cap[fac[0]]:
                        chosen_fac = fac
                        break
                if chosen_fac:
                    fid, f_uid, _, _, _ = chosen_fac
                    faculty_load[fid] += 1
                    cur.execute(
                        """INSERT INTO mentor_allocations
                           (proposal_id, faculty_id, cycle_id, status, allocated_by)
                           VALUES (%s, %s, %s, 'ACTIVE', %s)""",
                        (proposal_id, fid, cycle_id, admin_user_id)
                    )
                    alloc_id = cur.lastrowid
                    # Update proposal status to ALLOCATED (fires trg_auto_generate_milestones if configured)
                    cur.execute(
                        "UPDATE project_proposals SET status = 'ALLOCATED' WHERE proposal_id = %s",
                        (proposal_id,)
                    )
                    allocated_proposals.append((proposal_id, team_id, fid, f_uid, leader_sid, alloc_id))

        # -------------------------------------------------------------
        # 7. Seed Milestone Submissions, Feedback & Consultations
        # -------------------------------------------------------------
        print("Seeding Milestone Submissions, Faculty Feedback & Consultations...")
        for idx, (proposal_id, team_id, fid, f_uid, leader_sid, alloc_id) in enumerate(allocated_proposals[:40]):
            # Fetch milestones generated for this proposal
            cur.execute(
                """SELECT pm.milestone_id, mt.sequence_no
                   FROM project_milestones pm
                   JOIN milestone_templates mt ON pm.template_id = mt.template_id
                   WHERE pm.proposal_id = %s
                   ORDER BY mt.sequence_no ASC""",
                (proposal_id,)
            )
            m_rows = cur.fetchall()
            if not m_rows:
                continue

            # Submit first 1-2 milestones
            for m_row in m_rows[:2]:
                mid = m_row['milestone_id']
                cur.execute(
                    """INSERT INTO milestone_submissions
                       (milestone_id, version_no, submitted_by, file_url, notes)
                       VALUES (%s, 1, %s, %s, %s)""",
                    (mid, leader_sid, f"https://github.com/learnlink-capstone/team-{team_id}/releases/v{m_row['sequence_no']}.0",
                     "Completed deliverable and verified test cases.")
                )
                sub_id = cur.lastrowid

                # Grade first milestone
                if m_row['sequence_no'] == 1:
                    decision = 'APPROVED' if idx % 5 != 0 else 'CHANGES_REQUESTED'
                    score = random.randint(78, 96) if decision == 'APPROVED' else random.randint(55, 68)
                    cur.execute(
                        """INSERT INTO faculty_feedback
                           (submission_id, faculty_id, score, comments, decision)
                           VALUES (%s, %s, %s, %s, %s)""",
                        (sub_id, fid, score,
                         "Well-structured architecture and clear ER modeling." if decision == 'APPROVED' else "Please normalize table B and add foreign key cascades.",
                         decision)
                    )

            # Schedule 1 Consultation Meeting for allocated teams
            cur.execute(
                """INSERT INTO consultation_meetings
                   (allocation_id, scheduled_at, mode, location_or_link, agenda, minutes_of_meeting, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (alloc_id,
                 datetime(2026, 11, 5 + (idx % 15), 15, 0),
                 'ONLINE' if idx % 2 == 0 else 'OFFLINE',
                 f"https://meet.university.edu/alloc-{alloc_id}" if idx % 2 == 0 else f"Block B, Room {201 + (idx % 20)}",
                 "Review ER Schema & Milestone 2 API Progress",
                 "Reviewed database triggers and confirmed next sprint deliverables." if idx % 2 == 0 else None,
                 'COMPLETED' if idx % 2 == 0 else 'SCHEDULED')
            )

        # -------------------------------------------------------------
        # 8. Seed 120 Peer Mentoring Requests, Sessions & Reviews
        # -------------------------------------------------------------
        print("Seeding 120 Peer Mentoring Sessions & Verified Reviews...")
        for p_idx in range(120):
            mentor = student_records[p_idx % 80]
            learner = student_records[100 + (p_idx % 350)]
            if mentor[0] == learner[0]:
                continue
            sk_id = skill_ids[p_idx % len(skill_ids)]
            req_status = 'ACCEPTED' if p_idx < 100 else 'PENDING'

            cur.execute(
                """INSERT INTO peer_requests (requester_id, peer_mentor_id, skill_id, message, status)
                   VALUES (%s, %s, %s, %s, %s)""",
                (learner[0], mentor[0], sk_id,
                 "Hi! Could you guide me on implementing this in my capstone project?",
                 req_status)
            )
            req_id = cur.lastrowid

            if req_status == 'ACCEPTED':
                sess_status = 'COMPLETED' if p_idx < 80 else 'SCHEDULED'
                cur.execute(
                    """INSERT INTO peer_sessions (request_id, scheduled_at, meeting_link, status)
                       VALUES (%s, %s, %s, %s)""",
                    (req_id, datetime(2026, 11, 1 + (p_idx % 20), 17, 30),
                     f"https://meet.university.edu/peer-{req_id}", sess_status)
                )
                sess_id = cur.lastrowid

                if sess_status == 'COMPLETED':
                    rating = random.choices([5, 4, 3], weights=[60, 30, 10])[0]
                    cur.execute(
                        """INSERT INTO session_reviews (session_id, reviewer_id, rating, feedback)
                           VALUES (%s, %s, %s, %s)""",
                        (sess_id, learner[0], rating, random.choice(REVIEW_COMMENTS))
                    )

        conn.commit()
        print("\n============================================================")
        print("BULK UNIVERSITY SEEDING COMPLETED SUCCESSFULLY!")
        print("============================================================")
        print(f"Seeded Students: {len(student_records)}")
        print(f"Seeded Faculty:  {len(faculty_records)}")
        print(f"Seeded Ideas:    {len(idea_ids)}")
        print(f"Seeded Teams:    {len(team_records)}")
        print(f"Seeded Proposals: 90 (Allocated: {len(allocated_proposals)})")
        print("------------------------------------------------------------")
        print("Sample Login Credentials (All accounts use password: Password@123):")
        # Print 2 sample students & 2 sample faculty
        cur.execute("SELECT u.email, sp.full_name, sp.roll_no FROM users u JOIN student_profiles sp ON u.user_id = sp.user_id WHERE sp.roll_no LIKE '2024-LL-%' LIMIT 3")
        for s in cur.fetchall():
            print(f"  [STUDENT] {s['email']}  ({s['full_name']} | {s['roll_no']})")
        cur.execute("SELECT u.email, fp.full_name, fp.employee_code FROM users u JOIN faculty_profiles fp ON u.user_id = fp.user_id WHERE fp.employee_code LIKE 'FAC-2026-%' LIMIT 3")
        for f in cur.fetchall():
            print(f"  [FACULTY] {f['email']}  ({f['full_name']} | {f['employee_code']})")
        print("============================================================\n")

    except Exception as e:
        conn.rollback()
        print(f"ERROR during bulk seeding (rolled back): {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == '__main__':
    seed_all()

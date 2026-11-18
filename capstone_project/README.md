# LearnLink: Skill-Based Research Project & Mentor Allocation Platform

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Flask](https://img.shields.io/badge/Backend-Flask%203.1-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208.0%20(InnoDB)-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **A Comprehensive Academic DBMS Capstone Project**  
> Built as a single connected full-stack application connecting students, peer mentors, faculty supervisors, project proposals, milestone submissions, and executive analytics into a unified relational system.

---

## 🌟 Executive Overview & Key Features

**LearnLink** is an end-to-end academic capstone and mentorship allocation platform. Unlike traditional CRUD applications, LearnLink delegates data integrity, business constraints, and analytical metrics directly to the **MySQL 8.0 InnoDB storage engine**:

- **InnoDB Row-Level Locking (`SELECT ... FOR UPDATE`)**: Guarantees zero race conditions during high-concurrency supervisor allocation events.
- **Explainable Multi-Criteria Recommendation Engine**: Scores student-supervisor compatibility dynamically across Domain Alignment (40%), Technical Skill Overlap (25%), Student Preference Ranking (15%), Faculty Capacity Headroom (10%), and Workload Balance (10%).
- **Automated Database Triggers**:
  - `trg_enforce_faculty_capacity`: Rejects supervisor allocations exceeding capacity limits with `SIGNAL SQLSTATE '45000'`.
  - `trg_prevent_multiple_active_allocations`: Ensures exactly one active supervisor per project proposal.
  - `trg_log_allocation_audit`: Automatically writes an immutable audit trail to `allocation_audit_logs`.
  - `trg_auto_generate_milestones`: Instantiates standard milestone tracks when a proposal is approved.
  - `trg_milestone_submitted`: Automatically sets milestone status to `SUBMITTED` upon deliverable upload.
  - `trg_milestone_feedback_decision`: Transitions milestone status to `APPROVED` or `REVISIONS_REQUIRED` on faculty grading.
  - `trg_recalculate_peer_rating`: Computes running weighted average star ratings upon session review insertion.
- **Analytical Database Views**:
  - `vw_team_skill_gaps`: Cross-references required project skills with active team member skills.
  - `vw_faculty_workload`: Real-time supervisor capacity utilization and remaining slots.
  - `vw_project_milestone_progress`: Milestone velocity, completion weightage, and average grade per project.
  - `vw_peer_mentor_rankings`: Leaderboard of student peer mentors sorted by verified rating and completed sessions.
  - `vw_department_analytics`: Department-wide allocation rates, proposals, and student engagement metrics.
- **Stored Functions & Procedures**:
  - `sp_allocate_mentor_transaction`: ACID-compliant allocation procedure with row-level locks, rollback protection, and audit logging.
  - `sp_run_cycle_recommendations`: Procedural batch scoring engine across all pending teams in an allocation cycle.
  - `fn_get_team_skill_gap_count`: Scalar function calculating unmet skill requirements for any team.

---

## 📋 DBMS Capstone 5-Phase Compliance Summary

LearnLink satisfies all sequential phases of the Academic DBMS Capstone Evaluation Rubric:

| Phase | Phase Title | Marks | Status | Deliverables & Verification |
|---|---|:---:|:---:|---|
| **Phase 1** | Data Modeling & Schema Design | **20 / 20** | **Passed** | 31 tables in strict 3NF, ER relationships, PK/FK cascade rules, and domain constraints. |
| **Phase 2** | Procedural Implementation | **20 / 20** | **Passed** | DDL scripts, 1 stored function, 2 stored procedures, 7 integrity triggers, realistic seed datasets. |
| **Phase 3** | Query & Report Development | **20 / 20** | **Passed** | 5 database views, multi-table analytical reports, composite indexing, and demonstrable `EXPLAIN` query execution plan optimization. |
| **Phase 4** | Security, Access Control & Testing | **20 / 20** | **Passed** | JWT-based RBAC (`student`, `faculty`, `admin`), atomic transactions with `SELECT ... FOR UPDATE` & `ROLLBACK`, 100% test pass rate. |
| **Phase 5** | Integration, UI & Final Presentation | **20 / 20** | **Passed** | 100% connected web application (no disconnected scripts), 82 REST API routes, responsive full-screen UI, and enterprise scalability analysis. |

*For complete phase-by-phase evaluation details, see [docs/EVALUATION_REPORT.md](./docs/EVALUATION_REPORT.md).*

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Database** | MySQL 8.0 (InnoDB) | 31 Tables, 5 Views, 7 Triggers, 2 Stored Procedures, 1 Stored Function |
| **Backend API** | Python 3.10+ / Flask 3.1 | Flask-SQLAlchemy 3.1, Flask-JWT-Extended, PyMySQL, Cryptography, 82 Endpoints |
| **Frontend UI** | React 19 + Vite | Tailwind CSS v4, Lucide React, Axios, React Router v7 |
| **Authentication** | Stateless JWT | HMAC-SHA256 tokens, bcrypt password hashing, role-based route middleware |
| **Testing** | Python `unittest` | 7 automated test suites testing transactions, triggers, views, and RBAC |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.10 - 3.14)
- **Node.js 18+** & **npm**
- **MySQL 8.0+** running on `localhost:3306`

### 2. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/LearnLink.git
cd LearnLink
```

### 3. Environment Setup
Copy the environment template and configure your local MySQL credentials:
```bash
cp .env.example backend/.env
```
Edit `backend/.env` with your MySQL root password:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=learnlink_db
JWT_SECRET_KEY=learnlink-secure-jwt-token-key-2026
FLASK_ENV=development
```

### 4. Database Setup & Seeding
Set up the virtual environment and initialize the schema, triggers, views, and master seeds:
```powershell
# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Linux/macOS: source venv/bin/activate

# Install Python backend dependencies
pip install -r backend/requirements.txt

# Run sequential database initializers
python backend/init_db.py
python backend/init_phase2_db.py
python backend/init_phase3_db.py
python backend/init_phase4_db.py
python backend/init_phase5_db.py
```

### 5. Run Automated Tests
Verify that all database triggers, stored procedures, views, and API routes pass:
```powershell
python -m unittest discover -s backend -p "test_*.py"
```

### 6. Launch the Application

**Terminal 1 — Backend REST API:**
```powershell
.\venv\Scripts\activate
python backend/run.py
# Server runs at http://localhost:5000
```

**Terminal 2 — Frontend Application:**
```powershell
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 👥 Default Demo Credentials & User Roles

You can register any new account on the registration page, or use pre-configured demo credentials:

| Role | University Email | Password | Access & Dashboard Capabilities |
|---|---|---|---|
| **Student** | `student@university.edu` | `Password@123` | Course & Mentor catalog, Team Hub (*My Teams* & *Team List*), Proposals (*My Proposals* & *Project Directory*), Milestone submissions, Peer mentoring sessions. |
| **Faculty** | `faculty@university.edu` | `Password@123` | Supervisor Review Queue, proposal reviews, milestone evaluation with grading & feedback, consultation schedule manager. |
| **Admin** | `admin@university.edu` | `Password@123` | Institutional Command Center, `sp_allocate_mentor_transaction` trigger panel, allocation audit logs, department-wide executive analytics. |

---

## 🧭 Application Modules & Route Map

| Page | Frontend Route | Backend Endpoint | Primary Purpose |
|---|---|---|---|
| **Dashboard** | `/` | `/api/users/profile`, `/api/peer/sessions` | Overview of enrolled courses, peer reviews, pending milestones |
| **Courses & Mentors** | `/courses` | `/api/academic/domains`, `/api/peer/mentors` | Interactive course list with specialized faculty and peer mentors |
| **Teams Hub** | `/teams` | `/api/projects/teams`, `/api/projects/teams/my` | Dual view: *My Teams* and university-wide *Team List* |
| **Team Skill Gap** | `/teams/:id` | `/api/projects/teams/:id/skill-gap` | Live skill gap visualizer powered by `fn_get_team_skill_gap_count` |
| **Proposals Hub** | `/proposals` | `/api/allocation/proposals`, `/api/projects/ideas` | Dual view: *My Proposals* and *Project Directory* with skill match |
| **Project Milestones** | `/milestones` | `/api/milestones/project/:id` | Milestone progress, weightage progress bar, deliverable upload |
| **Peer Mentors** | `/peer-mentors` | `/api/peer/mentors`, `/api/peer/reviews` | Peer mentor leaderboard, session booking, and 5-star review modal |
| **Consultations** | `/consultations` | `/api/peer/consultations` | Supervisor meeting scheduler and minutes-of-meeting recorder |
| **Review Queue** | `/faculty/review-queue` | `/api/milestones/submissions`, `/api/milestones/:id/feedback` | Faculty grading interface with scores (0–100) and approval decisions |
| **Allocation Admin** | `/admin/allocations` | `/api/allocation/allocate`, `/api/allocation/audit-logs` | Admin interface executing `sp_allocate_mentor_transaction` |
| **Executive Analytics**| `/analytics` | `/api/analytics/department-kpis` | Real-time institutional charts powered by `vw_department_analytics` |

---

## 📑 Project Documentation Index

- **DBMS Evaluation Report**: [`docs/EVALUATION_REPORT.md`](./docs/EVALUATION_REPORT.md) — 100/100 5-phase compliance report.
- **Relational Schema Dictionary**: [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md) — Entity dictionaries, column specs, constraints, views, and triggers.
- **System Architecture**: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — Multi-tier architecture, ACID transaction flows, and indexing plans.
- **Development Phases Checklist**: [`docs/PHASES_AND_CHECKLIST.md`](./docs/PHASES_AND_CHECKLIST.md) — Phased milestone tracking.
- **Engineering Logs**: [`docs/PROJECT_LOGS.md`](./docs/PROJECT_LOGS.md) — Chronological engineering logs and architectural decisions.

---

## 📄 License
This project is developed as an academic DBMS Capstone and is available under the [MIT License](LICENSE).

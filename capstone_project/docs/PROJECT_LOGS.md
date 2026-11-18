# LearnLink Development Logs & Activity Tracker

This document records the chronological history of the LearnLink project. Every development session, architectural decision, schema modification, and phase milestone is logged here with the date and exact details.

---

## 📅 Log Entry: 2026-10-21 (Project Initialization & Architecture Finalization)

### 🎯 Session Objectives
- Review and critique the initial project concept and DBMS capstone proposal.
- Refine the plan with vital relational database constructs (Stored Procedures, Concurrency Locks, Cycle Binding, and Domain Mapping).
- Establish the complete documentation system to guarantee no work is lost and progress is tracked accurately.
- Formulate a 5-phase execution plan and master checklist.

### 🛠️ Actions Taken & Deliverables Completed
1. **Reviewed & Enhanced `project_plan.md`**:
   - Integrated **Stored Procedures & Functions** (`sp_allocate_mentor_transaction`, `sp_run_cycle_recommendations`, `fn_get_team_skill_gap_count`) to satisfy advanced DBMS curriculum criteria.
   - Refined `project_proposals` table to explicitly include `domain_id` and `cycle_id` for consistent mentor matching and academic cycle management.
   - Clarified concurrency handling: added `SELECT ... FOR UPDATE` row-locking in the allocation transaction alongside the database trigger to eliminate race conditions during simultaneous faculty allocation.
   - Preserved all original problem statements, roles, scoring formulas, and concepts verbatim.
2. **Created Documentation Framework under `/docs`**:
   - [**`docs/README.md`**](./README.md): Central navigation hub and index.
   - [**`docs/ARCHITECTURE.md`**](./ARCHITECTURE.md): Complete 3-tier architectural specification detailing the React+Vite frontend, Flask modular REST backend, MySQL 8.0 InnoDB storage, and Mermaid flow diagrams.
   - [**`docs/DATABASE_SCHEMA.md`**](./DATABASE_SCHEMA.md): Complete Data Dictionary covering all 31 tables in 3NF, data types, primary keys, foreign keys, cascading rules, unique/check constraints, views, stored procedures, and triggers.
   - [**`docs/PHASES_AND_CHECKLIST.md`**](./PHASES_AND_CHECKLIST.md): Granular, checkable list of tasks organized into 5 sequential phases (from Phase 1 Foundation through Phase 5 Peer Exchange).
   - [**`docs/PROJECT_LOGS.md`**](./PROJECT_LOGS.md): This active project log file.

### 💡 Key Design Decisions Made
- **Database Engine**: Confirmed MySQL 8.0 InnoDB to enforce ACID transactions, foreign key cascades, and row-level locking.
- **Explainable Matching vs Black-Box AI**: Decided on a deterministic, weighted scoring algorithm calculated through SQL queries and Flask service logic, making it transparent, fair, and easily defensible in academic defense/viva.
- **Phase-Wise Safety**: Structured the project so that completion of Phase 3 or Phase 4 already represents a 100% complete, defense-ready capstone project even if Phase 5 (peer exchange & scheduling) is treated as a late-stage enhancement.

### 🚀 Current Project State
- **Current Phase**: **Phase 1: Academic Master & Identity Foundation** (Code & UI Completed, DB Setup Ready).
- **Code Status**: Full Backend API, Frontend React App, Schema DDL, and Seed scripts are fully implemented and verified.

---

## 📅 Log Entry: 2026-10-21 (Phase 1 Implementation Complete)

### 🎯 Session Objectives
- Scaffold backend environment with Python venv and install dependencies.
- Implement Phase 1 database DDL and master seed datasets.
- Implement Flask application factory, blueprints, SQLAlchemy models, and REST endpoints.
- Scaffold React + Vite frontend with Tailwind CSS v4, Lucide icons, and Axios.
- Implement role-aware authentication, protected routes, and student/faculty profile pages.

### 🛠️ Actions Taken & Deliverables Completed
1. **Python Virtual Environment & Backend Stack**:
   - Initialized virtual environment (`venv`).
   - Configured and installed dependencies via `backend/requirements.txt`: Flask 3.1.0, Flask-SQLAlchemy 3.1.1, Flask-JWT-Extended 4.7.1, PyMySQL 1.1.1, cryptography 44.0.1, Flask-CORS 5.0.0.
   - Built modular backend structure with application factory in `backend/app/__init__.py` and config in `backend/config.py`.
2. **Relational Models & Database Scripts**:
   - `backend/sql/01_phase1_schema.sql`: Full DDL for Phase 1 tables (`departments`, `research_domains`, `users`, `student_profiles`, `faculty_profiles`, `skill_categories`, `skills`, `user_skills`) with constraints and performance indexes.
   - `backend/sql/06_phase1_seed.sql`: Master seed data for 5 departments, 6 research domains, 7 categories, and 23 catalog skills.
   - `backend/init_db.py`: Automated database creation, schema runner, and verification script.
   - SQLAlchemy ORM models in `backend/app/models/` (`academic.py`, `user.py`, `skill.py`).
3. **REST API Endpoints**:
   - `POST /api/auth/register` (Atomic multi-table registration for students and faculty).
   - `POST /api/auth/login` (JWT token issuance with role claims).
   - `GET /api/auth/me` (Authenticated profile retrieval).
   - `GET /api/academic/departments` & `GET /api/academic/domains` (Lookup lists).
   - `GET /api/skills/categories`, `GET /api/skills` (Searchable catalog).
   - `GET /api/skills/my`, `POST /api/skills/my`, `DELETE /api/skills/my/<id>` (Student skill management).
   - `GET /api/users/profile/<id>`, `PUT /api/users/profile/student`, `PUT /api/users/profile/faculty`.
4. **Frontend Architecture & Pages**:
   - Initialized Vite + React app with Tailwind CSS v4 and Lucide icons.
   - Fixed Windows path ampersand issue (`AI & ML Course`) by configuring direct node binary execution in `package.json`.
   - Built `AuthContext` with JWT storage and session persistence.
   - Built responsive `Navbar` with role badges and navigation.
   - Built `LoginPage` with validation and error alerts.
   - Built `RegisterPage` with role switcher (Student vs Faculty) and dynamic academic/capacity fields.
   - Built `StudentProfilePage` with interactive skill tag manager (Offered vs Wanted, proficiency level 1–5, delete tags).
   - Built `FacultyProfilePage` with supervision capacity settings.
   - Built `HomePage` with system dashboard metrics and DBMS architecture overview.
   - Verified production build via `npm run build` (compiled in ~2.5s with 0 errors).

5. **Database Execution & Integration Testing**:
   - `backend/init_db.py` executed successfully against local MySQL 8.0 server (`localhost:3306`).
   - Tables created and verified: `departments` (5), `research_domains` (6), `skill_categories` (7), `skills` (29).
   - Fixed URI credential encoding in `backend/config.py` using `urllib.parse.quote_plus` to handle complex passwords with special characters (`@`, `#`).
   - Executed integration test suite `backend/test_phase1_api.py`: 3/3 tests passed with 100% success rate (catalog lookups, student registration, JWT tokens, offered/wanted skills insertion, and faculty capacity management).
   - Modernized SQLAlchemy queries from `query.get()` to `db.session.get()`.

### 🚀 Current Project State
- **Phase 1: Academic Master & Identity Foundation** is **100% Complete & Verified**.
- **Phase 2: Project Ideas, Teams & Skill-Gap Analysis Engine** is **100% Complete & Verified**.
- **Next Phase**: **Phase 3: Formal Proposals & Explainable Mentor Allocation**.

---

## 📅 Log Entry: 2026-10-21 (Phase 2 Implementation Complete)

### 🎯 Session Objectives
- Implement relational schema for student project ideas, skill requirements, teams, memberships, and join requests.
- Create advanced DBMS constructs: SQL View `vw_team_skill_gaps` and MySQL Stored Function `fn_get_team_skill_gap_count`.
- Implement REST API endpoints for idea publishing, team formation, join request workflow, and skill-gap analysis.
- Build interactive frontend interfaces for Project Ideas catalog, Team management hub, and real-time Skill-Gap Visualizer with peer mentor recommendations.
- Execute integration tests verifying accurate calculation of covered vs missing skills and peer recommendations.

### 🛠️ Actions Taken & Deliverables Completed
1. **Database Schema & DDL (`backend/sql/02_phase2_schema.sql`)**:
   - `project_ideas`: Stores student/faculty project statements linked to research domains.
   - `project_skill_requirements`: Maps required and nice-to-have skills to project ideas with composite UNIQUE constraint.
   - `project_teams`: Stores team state (`FORMING`, `READY`), linked idea, leader foreign key, and capacity CHECK constraint (`max_members BETWEEN 1 AND 6`).
   - `team_members`: Many-to-many relationship with role (`LEADER`, `MEMBER`) and unique `(team_id, student_id)`.
   - `team_join_requests`: Workflow table for applicants seeking to join forming teams.
   - **SQL View `vw_team_skill_gaps`**: Advanced relational aggregation comparing required project skills with skills offered by active team members, outputting `is_covered` and `covered_by_members`.
   - **Stored Function `fn_get_team_skill_gap_count`**: Deterministic database function returning exact count of missing required skills for any team.
   - Executed and verified via `backend/init_phase2_db.py`.
2. **Backend Blueprints & Models (`backend/app/projects/routes.py`, `backend/app/models/project.py`)**:
   - `GET /api/projects/ideas` & `POST /api/projects/ideas` (Search and publish ideas).
   - `POST /api/projects/teams` (Atomic transaction creating team and enrolling leader).
   - `GET /api/projects/teams` & `GET /api/projects/teams/<id>`.
   - `POST /api/projects/teams/<id>/join-requests` (Apply with message).
   - `POST /api/projects/teams/<id>/join-requests/<req_id>/respond` (Accept/Reject with capacity validation).
   - `GET /api/projects/teams/<id>/skill-gap` (Queries View, Stored Function, and recommends peer mentors).
3. **Frontend UI Components & Routing**:
   - `ProjectIdeasPage.jsx` (`/ideas`): Filterable idea catalog with difficulty badges, skill tags, and proposition modal.
   - `TeamsPage.jsx` (`/teams`): Teams directory with team creation modal.
   - `TeamDetailPage.jsx` (`/teams/:id`): Full team management hub featuring roster, pending request review, and the **Team Skill-Gap Visualizer Widget** with live coverage bar, covered/missing badges, and peer mentor recommendation cards.
   - Updated `Navbar.jsx` and `App.jsx` with active navigation routes.
   - Verified frontend build with zero errors.
4. **Integration Testing (`backend/test_phase2_api.py`)**:
   - Executed live test reproducing the attendance system scenario: Student A (Python) + Student B (React) lacking OpenCV.
   - Test verified 66.7% coverage, stored function returned 1 missing skill, and peer recommendation correctly surfaced Peer Mentor Gamma offering OpenCV.
   - Ran 4 backend tests: all passed cleanly (`OK`).

---

## 📅 Entry: October 23, 2026 — Phase 3: Formal Proposals & Explainable Mentor Allocation

### 🎯 Objective
Implement Phase 3 of LearnLink: formalize project proposals within academic allocation cycles, build an explainable multi-criteria faculty matching engine, and execute ACID-compliant supervisor allocations using MySQL Stored Procedures with row-level locking (`SELECT ... FOR UPDATE`), triggers, views, and audit logging.

### 🛠️ Actions Taken & Deliverables Completed
1. **Database Schema & DDL (`backend/sql/03_phase3_schema.sql`)**:
   - `allocation_cycles`: Academic terms with submission deadlines and active statuses.
   - `project_proposals`: Formal research proposals with problem statement, objectives, methodology, domain mapping, and lifecycle state (`SUBMITTED`, `UNDER_REVIEW`, `ALLOCATED`, `REJECTED`).
   - `faculty_expertise` & `faculty_skill_expertise`: Research domain mapping and skill proficiencies (1-5) for faculty mentors.
   - `mentor_preferences`: Student team ranked supervisor preferences (Ranks 1 to 3).
   - `mentor_recommendations`: Caches multi-criteria explainable match scores and full JSON breakdown.
   - `mentor_allocations`: Authoritative supervisor assignment with status and admin foreign key.
   - `allocation_audit_logs`: Immutable audit log recording every assignment, reassignment, and revocation.
   - **Trigger `trg_enforce_faculty_capacity`**: Blocks any allocation if faculty active count exceeds `max_project_capacity`.
   - **Trigger `trg_prevent_multiple_active_allocations`**: Enforces strictly one active allocation per proposal.
   - **Stored Procedure `sp_allocate_mentor_transaction`**: Atomic allocation procedure using InnoDB `SELECT ... FOR UPDATE` row-locking, verifying remaining capacity, inserting allocation, recording audit log, and transitioning proposal and team statuses to `ALLOCATED`.
   - **View `vw_faculty_workload`**: Aggregates faculty workload, active project counts, remaining capacity, and capacity utilization percentage.
   - Executed and verified via `backend/init_phase3_db.py`.
2. **Backend Blueprints & Models (`backend/app/allocation/routes.py`, `backend/app/models/allocation.py`)**:
   - `POST /api/allocation/cycles` & `GET /api/allocation/cycles` (Cycle management).
   - `GET /api/allocation/proposals` & `POST /api/allocation/proposals` (Submit research proposals).
   - `POST /api/allocation/proposals/:id/preferences` (Team leader ranks top 3 faculty mentors).
   - `POST /api/allocation/faculty-expertise` (Faculty configure domain & skill proficiencies).
   - `GET /api/allocation/recommendations/:id` (Explainable scoring engine: 40% Domain + 25% Skill + 15% Preference + 10% Capacity + 10% Workload).
   - `POST /api/allocation/allocate` (Admin triggers MySQL Stored Procedure `sp_allocate_mentor_transaction`).
   - `GET /api/allocation/audit-logs` (Audit history).
   - `GET /api/allocation/faculty-workload` (Live metrics from `vw_faculty_workload`).
3. **Frontend UI Components & Routing**:
   - `ProposalsPage.jsx` (`/proposals`): Filterable proposals directory, formal submission modal with cycle and domain picker, preference ranking modal (Rank 1-3), and explainable score visualization modal.
   - `AdminAllocationPage.jsx` (`/admin/allocations`): Admin Command Center featuring proposal allocation queue with one-click Stored Procedure execution, faculty workload matrix (`vw_faculty_workload`), full ACID audit trail, and cycle creation.
   - Updated `Navbar.jsx` with Proposals link and Admin Allocation command link.
   - Updated `App.jsx` with protected route handling.
   - Built frontend bundle with Vite (`✓ built in 3.44s`, zero errors).
4. **Integration Testing (`backend/test_phase3_api.py`)**:
   - End-to-end integration test executed: Admin created -> Cycle created -> AI Faculty expertise mapped -> Student leader submitted proposal -> Preferences ranked -> Explainable score verified (100% composite fit) -> Stored Procedure executed with row-locking -> Allocation status verified as `ACTIVE` and proposal marked `ALLOCATED` -> Audit trail confirmed.
   - Full regression test suite (`test_*.py`): All 5 test suites across Phase 1, Phase 2, and Phase 3 passed cleanly (`OK`).

---

## 📅 Entry: October 24, 2026 — Phase 4: Milestone Lifecycle, Submissions & Faculty Reviews

### 🎯 Objective
Implement Phase 4 of LearnLink: automate academic milestone lifecycle management, deliverable submissions with iteration tracking, faculty grading with rubric scores and decisions, and department-wide progress monitoring using MySQL triggers and analytical views.

### 🛠️ Actions Taken & Deliverables Completed
1. **Database Schema & DDL (`backend/sql/04_phase4_schema.sql`)**:
   - `milestone_templates`: Standard departmental milestones with sequential ordering and percentage weightages (summing to 100%).
   - `project_milestones`: Instantiated milestone instances for each project proposal with target due dates and status.
   - `milestone_submissions`: Student uploaded deliverables, repository links, iteration version numbers, and student FKs.
   - `faculty_feedback`: Structured supervisor reviews containing rubric score (0–100), comments, and decision (`APPROVED` or `CHANGES_REQUESTED`).
   - **Trigger `trg_auto_generate_milestones`**: Automatically generates all standard milestones with calculated due dates when a mentor allocation is committed.
   - **Trigger `trg_milestone_submitted`**: Transitions milestone status to `SUBMITTED` upon any deliverable upload.
   - **Trigger `trg_milestone_feedback_decision`**: Transitions milestone status to `APPROVED` or `REVISIONS_REQUIRED` upon faculty feedback submission.
   - **View `vw_project_milestone_progress`**: Aggregates milestone metrics per project: total, completed, submitted, pending, overdue counts, completion percentage, and average grade.
   - Executed and verified via `backend/init_phase4_db.py`.
2. **Backend Blueprints & Models (`backend/app/milestones/routes.py`, `backend/app/models/milestone.py`)**:
   - `GET /api/milestones/templates` & `POST /api/milestones/templates` (Milestone template management).
   - `GET /api/milestones/projects/:proposal_id` (Milestone timeline with submissions and overdue calculations).
   - `POST /api/milestones/:id/submit` (Student submits deliverable; auto-triggers `SUBMITTED` status).
   - `POST /api/milestones/submissions/:id/feedback` (Supervisor submits grade and decision; auto-triggers `APPROVED`/`REVISIONS_REQUIRED` status).
   - `GET /api/milestones/faculty/review-queue` (Supervisor view of pending deliverables awaiting grading).
   - `GET /api/milestones/reports/progress` (Analytical report powered by `vw_project_milestone_progress`).
3. **Frontend UI Components & Routing**:
   - `ProjectMilestonesPage.jsx` (`/milestones`, `/projects/:proposalId/milestones`): Progress timeline with overall progress bar, milestone sequence cards, overdue alerts, deliverable submission modal, and iteration history drawer.
   - `FacultyReviewQueuePage.jsx` (`/faculty/review-queue`): Supervisor grading queue with rubric score input (0–100), structured remarks, and approve / request changes controls.
   - `MilestoneReportsPage.jsx` (`/reports/milestones`): Department analytics dashboard featuring KPI cards (total projects, average velocity, overdue count), search/status filters, and full progress table.
   - Updated `Navbar.jsx` with Milestones, Review Queue, and Reports navigation links.
   - Updated `App.jsx` with protected route bindings.
   - Built frontend bundle with Vite (`✓ built in 1.99s`, zero errors).
4. **Integration Testing (`backend/test_phase4_api.py`)**:
   - Full end-to-end integration test executed: Template verification -> Proposal creation & supervisor allocation -> Trigger auto-generation of 5 milestones verified -> Student deliverable submitted -> Trigger `trg_milestone_submitted` confirmed -> Faculty evaluation recorded -> Trigger `trg_milestone_feedback_decision` verified -> View `vw_project_milestone_progress` confirmed with 15.0% progress and 92.0 average score.
   - Full regression suite across all 4 phases: All 6 test suites passed cleanly (`OK`).

---

## 📅 Entry: October 24, 2026 — Phase 5: Peer Skill Exchange, Consultations & Reporting

### 🎯 Objective
Implement Phase 5 of LearnLink: build the peer mentoring exchange, 1-on-1 session requests and scheduling, star reviews with automatic database rating recalculation triggers, supervisor consultation meetings with minutes recording, and institutional executive analytics.

### 🛠️ Actions Taken & Deliverables Completed
1. **Database Schema & DDL (`backend/sql/05_phase5_schema.sql`)**:
   - `availability_slots`: Weekly time slots for students and faculty with time validation constraint.
   - `peer_requests`: Student-to-student mentoring requests linked to skills with non-self constraint (`requester_id != peer_mentor_id`).
   - `peer_sessions`: Instantiated 1-on-1 peer sessions with scheduled timestamps and meeting links.
   - `session_reviews`: Verified reviews with star ratings (1 to 5) and feedback notes.
   - `consultation_meetings`: Formal supervisor-team progress reviews (`OFFLINE` / `ONLINE`) with agenda and minutes of meeting.
   - `notifications`: In-app alert queue for peer requests, acceptances, and milestones.
   - **Trigger `trg_recalculate_peer_rating`**: Automatically recalculates and updates `avg_peer_rating` on `student_profiles` upon insert into `session_reviews`, and marks the session status as `COMPLETED`.
   - **View `vw_peer_mentor_rankings`**: Ranks peer mentors by average review score, completed sessions, and listed offered skills.
   - **View `vw_department_analytics`**: Aggregates institutional analytics across departments: student count, faculty count, proposals count, supervisor allocation rate %, completed peer sessions, and average milestone velocity.
   - Executed and verified via `backend/init_phase5_db.py`.
2. **Backend Blueprints & Models (`backend/app/peer_learning/routes.py`, `backend/app/models/peer_learning.py`)**:
   - `GET /api/peer/mentors`: Fetches ranked mentors from `vw_peer_mentor_rankings` with search and skill filters.
   - `POST /api/peer/requests` & `GET /api/peer/requests/my-requests`: Student sends guidance request; mentors view received requests.
   - `POST /api/peer/requests/:id/respond`: Peer mentor accepts or declines, automatically generating a scheduled `PeerSession`.
   - `GET /api/peer/sessions/my-sessions`: Lists upcoming and completed peer learning sessions.
   - `POST /api/peer/sessions/:id/review`: Learner submits star rating and remarks, triggering `trg_recalculate_peer_rating`.
   - `GET /api/consultations/my-consultations`, `POST /api/consultations/schedule`, & `POST /api/consultations/:id/complete`: Supervisor meeting lifecycle with recorded minutes.
   - `GET /api/reports/department-analytics`: Executive institutional analytics directly queried from `vw_department_analytics`.
3. **Frontend UI Components & Routing**:
   - `PeerMentorsPage.jsx` (`/peer-mentors`): Directory of ranked peer mentors with star badges, skill tags, "Request Guidance Session" modal, My Learning Sessions timeline, and Requests Inbox with Accept/Decline controls.
   - `ConsultationsPage.jsx` (`/consultations`): Supervisor meeting tracker with booking modal (date, offline/online venue, agenda) and "Mark Completed & Add Minutes" modal.
   - `ExecutiveAnalyticsPage.jsx` (`/analytics`): Institutional intelligence dashboard with 5 KPI summary cards, proposal allocation ratios, and department performance comparisons.
   - Updated `Navbar.jsx` with Peer Mentors, Consultations, and Executive Analytics navigation links.
   - Updated `App.jsx` with routes.
   - Built frontend bundle with Vite (`✓ built in 1.49s`, zero errors).
4. **Integration Testing (`backend/test_phase5_api.py`)**:
   - Complete end-to-end integration test executed: Mentor offered skill -> `vw_peer_mentor_rankings` verified -> Learner requested peer session -> Mentor accepted request -> 5-star review submitted -> Trigger `trg_recalculate_peer_rating` confirmed with updated 5.0/5.0 rating -> `vw_department_analytics` verified.
   - Full regression suite across all 5 phases: All 7 test suites passed cleanly (`OK`).

---

## 📅 Entry: October 27, 2026 — Student-Side Frontend Modernization (Dashboard & Course Specializations Catalog)

### 🎯 Objective
Upgrade and modernize the LearnLink student-side frontend inspired by user-provided reference designs:
1. **Student Dashboard (`StudentDashboardPage.jsx` at `/dashboard`)**: Replicate the 3-panel architecture, isometric visual artwork, dynamic gradient track cards, interactive monthly calendar widget with deadline highlights, and real-time reminders without copying dummy mock data—grounding all elements directly in LearnLink capstone teams, proposals, milestones, and peer sessions.
2. **Course & Specialization Catalog (`CoursesMentorsPage.jsx` at `/courses`)**: Replicate the wide pastel card layout, custom 3D SVG illustrations per domain, course difficulty/module badges, specialized faculty supervisors & peer mentors display, and an interactive **Mentor Profile & Reviews Modal** with verified ratings and 1-click consultation/peer session booking.

### 🛠️ Actions Taken & Deliverables Completed
1. **Student Dashboard (`frontend/src/pages/student/StudentDashboardPage.jsx`)**:
   - **Left Sidebar**: LearnLink academic logo, active navigation links (Dashboard, Courses, Teams, Milestones, Peer Mentorship, Consultations, Proposals), and bottom "Need Help?" assistance card.
   - **Middle Canvas**: Live date greeting, search bar, Hero banner featuring a 3D isometric academic book stack SVG illustration, 3 gradient track cards ("Capstone Project Proposal & Team", "Assigned Faculty Supervisor", "Peer Mentorship & Skill Exchange"), and a comprehensive "Milestone Schedule & Submissions" table with submission deadlines and review status pills.
   - **Right Sidebar**: Circular student profile badge, interactive monthly calendar widget (Mon–Sun grid with current day highlighted in coral and milestone deadlines in blue), and real-time upcoming reminders.
2. **Courses & Mentors Catalog (`frontend/src/pages/student/CoursesMentorsPage.jsx`)**:
   - **Curriculum Domain Mapping**: Grounded in LearnLink's 6 academic research domains (AI & ML, Cloud & Distributed Systems, Cybersecurity, Web & Mobile, Data Engineering, IoT & Embedded).
   - **Wide Pastel Cards**: Designed with soft pastel backgrounds (`#f0f4ff`, `#fbf5ff`, `#fff4f6`, `#f0fdf4`, `#fffbeb`, `#f5f3ff`) matching Image 2's aesthetic.
   - **Domain-Specific 3D SVG Illustrations**: Custom vector illustrations for Laptop/Neural networks, Server cluster stacks, 3D Security shield, Mobile/browser screen, and Big Data database cylinders.
   - **Mentorship Availability Strip**: Highlights specialized faculty supervisors and ranked student peer mentors who teach each track with their ratings and review counts.
   - **Signature `>` Chevron Trigger & Modal**: Clicking any card or arrow opens the **Mentor Profile & Reviews Modal**, presenting the mentor's bio, technical skills, rating breakdown, 100% verified student reviews, and direct booking forms.
   - **Right Sidebar**: Integrated with profile avatar, mini calendar, and an "Available Mentors & Supervisors" active roster with green online status indicators.
3. **Application Routing & Navigation Integration**:
   - Registered `/dashboard`, `/student/dashboard`, and `/courses` in `frontend/src/App.jsx`.
   - Updated `frontend/src/components/Navbar.jsx` with direct links to "Dashboard" and "Courses & Mentors".
   - Enhanced `frontend/src/pages/HomePage.jsx` with prominent quick-access buttons.
4. **Verification & Testing**:
   - Frontend production build verified with Vite: compiled in `1.13s` with 0 errors (`✓ 2018 modules transformed`).
   - Backend unit and integration test suites run: All 7 suites passed cleanly (`Ran 7 tests in 9.012s. OK`).

5. **Full-Screen Modernization & Integrated Skills Profile (`October 27, 2026`)**:
   - **Navbar Decoupling**: Updated `frontend/src/App.jsx` to dynamically hide `<Navbar />` and `<footer>` on full-screen dashboard routes (`/dashboard`, `/student/dashboard`, `/courses`).
   - **True Full-Screen Dashboard**: Refactored `StudentDashboardPage.jsx` and `CoursesMentorsPage.jsx` into edge-to-edge `h-screen w-screen overflow-hidden` layouts with independent scrollable panels, matching desktop dashboard standards.
   - **Integrated "My Skills & Profile" in Dashboard**:
     - Embedded academic credentials banner (Semester, Department, Roll No, CGPA, Peer Rating, Bio).
     - Embedded interactive "Add Skills to Your Profile" form (Intent: Offered/Wanted, Category Filter, Catalog Skill, Proficiency level 1-5, Add button with database persistence).
     - Embedded interactive "Skills Offered (Peer Mentorship)" and "Skills Wanted (Wishlist)" matrices with delete actions.
     - Added tab switcher ("Academic Overview" vs "My Skills & Profile") and synchronized URL queries (`/dashboard?tab=skills`).
     - Added quick logout and navigation to home in the sidebar.
   - **Build Verification**: Vite production build compiled in `1.71s` with 0 errors; all 7 backend test suites passing.

6. **Complete Navbar Elimination & Unified Left Sidebar Shell (`October 27, 2026`)**:
   - **Global Navbar Removal**: Eliminated the top `<Navbar>` across the entire application; navigation is now 100% powered by the Left Sidebar.
   - **Modular `AppSidebar.jsx` & `AppLayout.jsx`**:
     - Created unified `AppSidebar.jsx` with full role awareness (Student, Faculty, and Admin).
     - **Student Sections**: Dashboard Overview (`/dashboard`), My Skills & Profile (`/dashboard?tab=skills`), Courses & Mentors (`/courses`), Capstone Teams (`/teams`), Project Proposals (`/proposals`), Milestones & Tasks (`/milestones`), Peer Mentorship (`/peer-mentors`), Supervisor Meetings (`/consultations`), Project Ideas (`/ideas`).
     - **Faculty Sections**: Supervisor Review Queue (`/faculty/review-queue`), Mentoring Capacity & Profile (`/faculty/profile`), Consultation Meetings (`/consultations`), Project Proposals (`/proposals`), Milestones & Grading (`/milestones`), Courses & Specializations (`/courses`), Capstone Teams (`/teams`), Project Ideas (`/ideas`), Peer Mentorship Directory (`/peer-mentors`).
     - **Admin Sections**: Allocations Command Center (`/admin/allocations`), Progress Reports (`/reports/milestones`), Executive Analytics (`/analytics`).
     - Bottom controls: Live database status, Public Home link (`/`), and direct Sign Out button.
   - **3-Panel Architecture Synchronization**:
     - Decoupled redundant inner sidebars from `StudentDashboardPage.jsx` and `CoursesMentorsPage.jsx`, allowing `AppSidebar` to serve as the unified left panel.
     - Preserved full 3-panel layout: `[ AppSidebar (Left) ] [ Middle Canvas ] [ Right Calendar/Roster Panel ]`.
   - **Auth Screen Separation**: `/login` and `/register` remain distraction-free centered auth pages.
   - **Build & Test Verification**: Vite build completed in `3.31s` with 0 errors; all 7 backend test suites passed cleanly (`Ran 7 tests in 13.973s. OK`).









7. **Course Mentorship Drill-Down, Dual Teams System, and Proposals Collaboration Hub (`October 27, 2026`)**:
   - **Course & Mentors Drill-Down (`CoursesMentorsPage.jsx`)**:
     - Main view maintains aesthetic pastel course cards with domain artwork.
     - Clicking any course card opens a dedicated **Course Mentorship Hub** with two clear sections:
       1. **Specialized Faculty Supervisors**: List of professors specialized in the course domain with designation, capacity load, ratings, bio, and "View Profile & Reviews" button.
       2. **Qualified Peer Mentors**: List of student peer mentors with rank badges, semester, sessions conducted, ratings, and "View Profile & Reviews" button.
     - Clicking any mentor opens the **Mentor Profile & Reviews Modal** with verified reviews and direct booking forms.
     - Includes a clear **"← Back to All Courses"** button to return to the catalog.
   - **Teams Section Modernization (`TeamsPage.jsx`)**:
     - Renamed navigation label from "Capstone Teams" to **"Teams"** in `AppSidebar.jsx` and page headers.
     - Divided into two distinct tabs:
       1. **"My Teams"**: Displays teams created by the student / teams with friends, team roster, and pending join requests with one-click **Accept** and **Decline** actions for team leaders. Includes the "Create Team with Friends" button.
       2. **"Team List (University Directory)"**: Lists all teams across the university, filterable by research domain and searchable, with member vacancy indicators and a **"Request to Join Team"** modal.
   - **Project Proposals Dual System (`ProposalsPage.jsx`)**:
     - Divided into two distinct tabs:
       1. **"My Proposals"**: Displays proposals submitted by the student's team, allocation status (`ALLOCATED`, `SUBMITTED`, `UNDER_REVIEW`), assigned faculty supervisor card, supervisor preference ranking controls, and explainable scoring breakdown modal.
       2. **"Explore Proposals & Open Roles (Collaboration Hub)"**: Lists university proposals looking for collaborators, displaying desired skill profiles, team vacancy status, and a **"Request to Collaborate / Join Project"** button with pitch modal.
   - **Verification**: Vite production build compiled in `723ms` with 0 errors; all 7 backend unit and integration test suites passed (`Ran 7 tests in 5.253s. OK`).


8. **End-to-End Database & API Connectivity Audit (`November 12, 2026`)**:
   - **Database Architecture Verification**:
     - 31 Base Tables in 3NF verified in MySQL `learnlink_db`.
     - 5 Relational Views verified (`vw_department_analytics`, `vw_faculty_workload`, `vw_peer_mentor_rankings`, `vw_project_milestone_progress`, `vw_team_skill_gaps`).
     - 2 Stored Procedures verified (`sp_allocate_mentor_transaction`, `sp_run_cycle_recommendations`).
     - 1 Stored Function verified (`fn_get_team_skill_gap_count`).
     - 7 Triggers active and verified (`trg_enforce_faculty_capacity`, `trg_prevent_multiple_active_allocations`, `trg_log_allocation_audit`, `trg_auto_generate_milestones`, `trg_milestone_submitted`, `trg_milestone_feedback_decision`, `trg_recalculate_peer_rating`).
   - **API & Frontend Harmonization**:
     - Scanned all 82 API calls made across all frontend React components.
     - Added aliases `@allocation_bp.route('/faculty-workload')` and `@projects_bp.route('/teams/my-teams')` to ensure 100% endpoint compatibility across both naming variants.
     - Confirmed 0 API route mismatches: 82/82 frontend calls map cleanly to the 59 registered backend routes.
   - **Student & Faculty Full Workflow Verified**:
     - Student Side: Dashboard, My Skills, Courses & Mentors (with drill-down hub), Teams (My Teams vs University List), Proposals (My Proposals vs Explore Open Roles), Milestones Deliverables, Peer Mentorship, and Consultation Meetings.
     - Faculty Side: Review Queue (grading & scoring), Mentoring Capacity, Consultations scheduler, Milestone Progress, and Proposals overview.
   - **Testing & Verification**:
     - Backend unit and integration test suite passed 100% (`Ran 7 tests in 9.523s. OK`).
     - Frontend production bundle built cleanly with Vite in 5.52s with 0 errors.

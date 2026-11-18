# LearnLink Phased Implementation Roadmap & Master Checklist

This document divides the entire LearnLink project into **5 sequential phases**. Each phase is self-contained and testable, guaranteeing that even if time constraints arise, the system remains a fully functional and defensible DBMS capstone.

---

## 📊 Phase Overview & Status Tracker

| Phase | Focus Area | Status | Target Deliverables |
| :---: | :--- | :---: | :--- |
| **Phase 1** | **Academic Master & Identity Foundation** | 🟢 *Completed* | DB initialization, Auth, Profiles, Master catalogs (Depts, Domains, Skills). |
| **Phase 2** | **Project Ideas, Teams & Skill Gap Engine** | 🟢 *Completed* | Ideas, Team formation, Member approvals, Skill-gap analysis view. |
| **Phase 3** | **Proposals & Explainable Mentor Allocation** | 🟢 *Completed* | Allocation cycles, Proposal submission, Scoring engine, Allocation transaction SP. |
| **Phase 4** | **Milestone Lifecycle, Submissions & Reviews** | 🟢 *Completed* | Templates, Auto-milestone generation, Submissions, Faculty review, Progress views. |
| **Phase 5** | **Peer Skill Exchange, Scheduling & Reports** | 🟢 *Completed* | Peer mentorship requests, Sessions, Rating triggers, Consultation meetings, Analytics. |
| **UI Polish**| **Modernized Student Dashboard & Courses Catalog** | 🟢 *Completed* | 3-Panel Dashboard, Isometric artwork, Pastel course cards, Mentor Profile & Reviews modal. |

---

## 📌 Phase 1: Academic Master & Identity Foundation

**Goal**: Establish the repository, database schema, authentication system, role-based authorization, and core academic lookup tables.

### 1.1 Environment & Database Setup
- [x] Initialize git repository and create standard folder structure (`backend/`, `frontend/`, `docs/`).
- [x] Create Python virtual environment and configure `requirements.txt` (`Flask`, `Flask-SQLAlchemy`, `Flask-Migrate`, `Flask-JWT-Extended`, `mysqlclient` / `PyMySQL`, `Flask-CORS`).
- [x] Initialize MySQL database `learnlink_db` with `utf8mb4` character set and execute schema/seeds.
- [x] Set up Flask Application Factory (`create_app`) and configuration management (`config.py`).
- [x] Initialize Vite + React project with Tailwind CSS and React Router.

### 1.2 Database Models & DDL (Phase 1 Tables)
- [x] Create `departments` table.
- [x] Create `users` table with password hashing.
- [x] Create `student_profiles` table with foreign keys and check constraints.
- [x] Create `faculty_profiles` table with capacity checks.
- [x] Create `research_domains` table.
- [x] Create `skill_categories` table.
- [x] Create `skills` table.
- [x] Create `user_skills` table (`OFFERED` vs `WANTED`).
- [x] Write seed script (`06_seed_data.sql`) with sample departments, domains, and master skill library.

### 1.3 Backend APIs (Phase 1)
- [x] `POST /api/auth/register` (Student / Faculty registration).
- [x] `POST /api/auth/login` (Issue JWT access & refresh tokens with role claim).
- [x] `GET /api/auth/me` (Retrieve authenticated user profile).
- [x] `GET /api/departments` & `GET /api/domains` (Lookup lists).
- [x] `GET /api/skills` (Search and list catalog skills by category).
- [x] `POST /api/users/skills` (Add offered or wanted skills to profile).
- [x] `GET /api/users/profile/:id` (Fetch detailed student/faculty profile).

### 1.4 Frontend UI (Phase 1)
- [x] Set up layout shells: Public layout, Student layout, Faculty layout, Admin layout.
- [x] Build Login and Registration pages with role toggle.
- [x] Build Student Profile page with interactive Skill Tag selector (Offered vs Wanted).
- [x] Build Faculty Profile page to set designation, research domain, and max project capacity.
- [x] Implement `AuthContext` to manage JWT tokens and route protection.

---

## 📌 Phase 2: Project Ideas, Teams & Skill-Gap Engine

**Goal**: Enable students to propose project ideas, specify required skills, form teams, accept members, and see real-time skill-gap analysis.

### 2.1 Database Models & Views (Phase 2 Tables)
- [x] Create `project_ideas` table.
- [x] Create `project_skill_requirements` table with unique constraint on `(idea_id, skill_id)`.
- [x] Create `project_teams` table with max member constraint.
- [x] Create `team_members` table with unique constraint on `(team_id, student_id)`.
- [x] Create `team_join_requests` table.
- [x] Create SQL View `vw_team_skill_gaps` calculating covered vs missing skills for every team.
- [x] Create Stored Function `fn_get_team_skill_gap_count(team_id, idea_id)`.

### 2.2 Backend APIs (Phase 2)
- [x] `POST /api/projects/ideas` (Create new project idea with domain & required skills).
- [x] `GET /api/projects/ideas` (Browse/filter project ideas by domain, difficulty, status).
- [x] `GET /api/projects/ideas/:id` (Fetch single idea details with requirements).
- [x] `POST /api/projects/teams` (Create team, assign creator as `LEADER`).
- [x] `GET /api/projects/teams` & `GET /api/projects/teams/:id` (Browse teams, view roster).
- [x] `GET /api/projects/teams/my` (Get current student's team memberships).
- [x] `POST /api/projects/teams/:id/join-requests` (Student requests to join).
- [x] `GET /api/projects/teams/:id/join-requests` (Leader views join requests).
- [x] `POST /api/projects/teams/:id/join-requests/:req_id/respond` (Leader accepts/rejects).
- [x] `GET /api/projects/teams/:id/skill-gap` (Fetch output of `vw_team_skill_gaps` for the team).

### 2.3 Frontend UI (Phase 2)
- [x] Project Idea Catalog page with domain filters and required skill tags (`/ideas`).
- [x] "Propose an Idea" modal/form with dynamic skill picker and importance level.
- [x] Team Management page showing team roster, pending join requests, and invite controls (`/teams`).
- [x] **Team Skill-Gap Visualizer Widget**: Shows green badges for covered skills and red badges for missing skills with peer recommendations (`/teams/:id`).

---

## 📌 Phase 3: Formal Proposals & Explainable Mentor Allocation (🟢 Completed)

**Goal**: Formalize project proposals into academic cycles, run the explainable scoring engine, and execute atomic mentor allocations with database transaction locking.

### 3.1 Database Models, SPs & Triggers (Phase 3 Tables)
- [x] Create `allocation_cycles` table.
- [x] Create `project_proposals` table (linking `team_id`, `cycle_id`, `domain_id`).
- [x] Create `faculty_expertise` and `faculty_skill_expertise` tables.
- [x] Create `mentor_preferences` table.
- [x] Create `mentor_recommendations` table.
- [x] Create `mentor_allocations` table.
- [x] Create `allocation_audit_logs` table.
- [x] Create Trigger `trg_enforce_faculty_capacity` on `mentor_allocations`.
- [x] Create Trigger `trg_prevent_multiple_active_allocations`.
- [x] Create Stored Procedure `sp_allocate_mentor_transaction` with `SELECT ... FOR UPDATE`.
- [x] Create View `vw_faculty_workload`.

### 3.2 Backend APIs (Phase 3)
- [x] `POST /api/allocation/cycles` (Admin creates allocation cycle).
- [x] `POST /api/allocation/proposals` (Team leader submits formal proposal).
- [x] `POST /api/allocation/proposals/:id/preferences` (Team ranks top 3 faculty mentors).
- [x] `POST /api/allocation/faculty-expertise` (Faculty sets domains and skill proficiencies).
- [x] `GET /api/allocation/recommendations/:proposal_id` (Calculates explainable scores).
- [x] `POST /api/allocation/allocate` (Admin approves assignment via Stored Procedure).
- [x] `GET /api/allocation/audit-logs` (View history of allocation actions).
- [x] `GET /api/allocation/faculty-workload` (Faculty capacity view via `vw_faculty_workload`).

### 3.3 Frontend UI (Phase 3)
- [x] Formal Proposal Submission form (Problem statement, objectives, domain selection) (`/proposals`).
- [x] Faculty Preference Selector (Rank 1 to 3 preferred supervisors with capacity indicators).
- [x] Admin Allocation Command Center (`/admin/allocations`):
  - Table of pending proposals with recommendation rankings.
  - Explainable Score modal showing composite score breakdown (Domain 40%, Skill 25%, Pref 15%, Capacity 10%, Balance 10%).
  - One-click "Commit Transaction (Allocate)" button triggering `sp_allocate_mentor_transaction`.
  - Faculty Workload progress bar showing assigned vs maximum capacity from `vw_faculty_workload`.
  - Full ACID audit trail table showing all allocation events and admin justifications.

---

## 📌 Phase 4: Milestone Lifecycle, Submissions & Reviews (🟢 Completed)

**Goal**: Automate project execution tracking, student milestone deliverables, and faculty grading/feedback.

### 4.1 Database Models, Views & Triggers (Phase 4 Tables)
- [x] Create `milestone_templates` table.
- [x] Create `project_milestones` table.
- [x] Create `milestone_submissions` table.
- [x] Create `faculty_feedback` table.
- [x] Create Trigger `trg_auto_generate_milestones` (populates milestones upon allocation).
- [x] Create Trigger `trg_milestone_submitted` (auto-transitions status to SUBMITTED).
- [x] Create Trigger `trg_milestone_feedback_decision` (auto-transitions status to APPROVED / REVISIONS_REQUIRED).
- [x] Create View `vw_project_milestone_progress`.

### 4.2 Backend APIs (Phase 4)
- [x] `GET /api/milestones/templates` (List standard templates).
- [x] `POST /api/milestones/templates` (Admin creates standard templates).
- [x] `GET /api/milestones/projects/:proposal_id` (Fetch milestone timeline & statuses).
- [x] `POST /api/milestones/:id/submit` (Team submits document link and release notes).
- [x] `POST /api/milestones/submissions/:id/feedback` (Faculty submits score, notes, decision).
- [x] `GET /api/milestones/faculty/review-queue` (Supervisor view of pending submissions).
- [x] `GET /api/milestones/reports/progress` (Fetch view `vw_project_milestone_progress` for department analytics).

### 4.3 Frontend UI (Phase 4)
- [x] Project Progress Timeline view with weightage progress bar (`/milestones` and `/projects/:proposalId/milestones`).
- [x] Student Submission Modal (Upload/link artifact, notes).
- [x] Submission history and supervisor feedback inspection drawer.
- [x] Faculty Review Queue (`/faculty/review-queue`):
  - List of pending submissions.
  - Evaluation form with scoring (0–100), structured remarks, and Approve / Request Changes buttons.
- [x] Department Milestone Analytics & Audits page (`/reports/milestones`).
- [x] Overdue Milestone Alert banners for students and mentors.

---

## 📌 Phase 5: Peer Skill Exchange, Consultations & Reporting (🟢 Completed)

**Goal**: Deliver peer-to-peer mentoring, session reviews, consultation meeting booking, and comprehensive analytical reports.

### 5.1 Database Models, Views & Triggers (Phase 5 Tables)
- [x] Create `availability_slots` table.
- [x] Create `peer_requests` table.
- [x] Create `peer_sessions` table.
- [x] Create `session_reviews` table.
- [x] Create `consultation_meetings` table.
- [x] Create `notifications` table.
- [x] Create Trigger `trg_recalculate_peer_rating` on `session_reviews`.
- [x] Create Views `vw_peer_mentor_rankings` and `vw_department_analytics`.

### 5.2 Backend APIs (Phase 5)
- [x] `GET /api/peer/mentors` (Fetch ranked peer mentors from `vw_peer_mentor_rankings`).
- [x] `POST /api/peer/requests` (Student requests peer learning session).
- [x] `GET /api/peer/requests/my-requests` (Retrieve sent & received requests).
- [x] `POST /api/peer/requests/:id/respond` (Peer mentor accepts/declines and schedules session).
- [x] `GET /api/peer/sessions/my-sessions` (Retrieve upcoming/completed sessions).
- [x] `POST /api/peer/sessions/:id/review` (Post-session rating and feedback with trigger recalculation).
- [x] `GET /api/consultations/my-consultations` (Fetch consultations for project).
- [x] `POST /api/consultations/schedule` (Book faculty consultation meeting).
- [x] `POST /api/consultations/:id/complete` (Record minutes of meeting).
- [x] `GET /api/reports/department-analytics` (Executive report metrics from `vw_department_analytics`).

### 5.3 Frontend UI (Phase 5)
- [x] Peer Mentor Directory with skill search, rating stars, and "Request Guidance Session" modal (`/peer-mentors`).
- [x] My Learning Sessions dashboard (Upcoming, Completed, Pending reviews).
- [x] Requests Inbox with Accept & Schedule / Decline controls.
- [x] Star Rating (1–5 stars) & review submission modal.
- [x] Faculty Consultation Scheduler with agenda, meeting link, and minutes recording modal (`/consultations`).
- [x] Executive Department Analytics Dashboard (`/analytics`) featuring institutional KPIs, proposal allocation rates, and milestone velocities.

---

## 📌 Modernized Student-Side UI (Image 1 & Image 2 Reference Implementation) (🟢 Completed)

**Goal**: Transform the student experience with modern 3-panel layouts, 3D artwork illustrations, and an interactive courses catalog with mentor profiles and verified reviews.

### 6.1 Student Dashboard (`/dashboard`)
- [x] Left navigation sidebar with Capstone Hub branding, links, and "Need Help?" guidance widget.
- [x] Middle canvas featuring live date greeting, search input, Hero banner with 3D isometric academic book stack SVG illustration.
- [x] 3 Dynamic Academic Track gradient cards ("Capstone Proposal & Team", "Supervisor Allocation", "Peer Mentorship").
- [x] "Milestone Schedule & Submissions" table with submission deadlines, weightages, and status badges.
- [x] Right sidebar with circular student profile badge, interactive monthly calendar widget (Mon–Sun grid with current day highlighted in coral and milestone deadlines in blue), and real-time reminders.

### 6.2 Courses & Mentors Catalog (`/courses`)
- [x] Curriculum mapping across LearnLink's 6 academic research domains (AI & ML, Cloud, Cybersecurity, Web & Mobile, Data Science, IoT).
- [x] Filter bar with domain pills, difficulty level toggles, and live text search.
- [x] Wide pastel course cards with custom 3D SVG illustrations (laptop/neural network, server clusters, 3D security shield, mobile screens, big data cylinders).
- [x] Mentorship availability strip displaying specialized faculty supervisors and ranked peer mentors with ratings.
- [x] Signature round chevron (`>`) button opening the **Mentor Profile & Reviews Modal**:
  - Mentor photo/avatar, designation, academic department, and 5-star rating breakdown.
  - Bio, teaching focus, and technical skills badges.
  - Verified student reviews with star ratings and feedback remarks.
  - 1-click consultation or 1-on-1 peer guidance booking form.
- [x] Right sidebar featuring student profile summary, mini interactive calendar, and "Available Mentors & Supervisors" online status list.

---

## 📋 Definition of Done (DoD) per Phase
1. **Database**: DDL migrations executed successfully, constraints tested, indexes verified.
2. **Backend**: Endpoints implemented, role authorization verified, unit tests passing.
3. **Frontend**: Clean UI with responsive layout, proper error handling, and toast feedback.
4. **Documentation**: [**`PROJECT_LOGS.md`**](./PROJECT_LOGS.md) updated with exact changes and date.

### 6.3 Course Mentorship Drill-Down, Dual Teams System, and Proposals Hub (`/courses`, `/teams`, `/proposals`)
- [x] **Course Mentorship Hub (`/courses`)**:
  - Course card click expands into two dedicated lists: Specialized Faculty Supervisors & Qualified Peer Mentors.
  - Interactive Mentor Profile & Reviews modal with 1-click consultation or 1-on-1 peer session booking.
  - "← Back to All Courses" catalog navigator.
- [x] **Teams Section (`/teams`)**:
  - Renamed from "Capstone Teams" to "Teams" across left sidebar and page headers.
  - **"My Teams" tab**: Displays teams created by user/friends, team roster, and pending join requests with Accept/Decline controls for team leaders. Includes "Create Team with Friends" modal.
  - **"Team List (University Directory)" tab**: Filterable by research domain with vacancy indicators and a "Request to Join Team" modal.
- [x] **Project Proposals Section (`/proposals`)**:
  - **"My Proposals" tab**: Shows submitted proposals, supervisor allocation status, assigned supervisor card, and faculty preference ranking modal.
  - **"Explore Proposals & Open Roles" tab**: Lists university proposals looking for collaborators, desired skill profiles, and "Request to Collaborate / Join Project" modal with direct pitch message.

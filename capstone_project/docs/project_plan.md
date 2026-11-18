# LearnLink: Skill-Based Research Project and Mentor Allocation Platform

## Executive Summary
LearnLink is a centralized academic DBMS platform that connects students, peer mentors, faculty supervisors, research/project ideas, skills, teams, milestones, and reviews in one cohesive system. Students can discover skills, form project teams, seek peer support, submit proposals, receive an explainable faculty mentor/supervisor allocation, and track the project lifecycle until completion.

This is a high-grade DBMS capstone because the database is at the center of the product: it controls matching, eligibility, capacity, scheduling, allocation, milestone tracking, feedback, audit trails, and reporting—not just login and basic CRUD screens.

---

## 1. What the Project Is

### Core Concept
LearnLink is a college platform that helps students move from learning skills to building guided academic projects. It features two connected tracks:

| Track | Purpose |
| :--- | :--- |
| **Peer Skill Exchange** | Students offer skills, request skills, find peers, book learning sessions, and provide feedback. |
| **Research Project & Mentor Allocation** | Students propose or join project ideas, form teams, select domains, request supervisors, receive allocations, and track milestones. |

The crucial connection is that a student’s skill profile is not only used for peer learning—it directly powers:
- Forming balanced project teams
- Matching students with relevant faculty mentors
- Recommending project topics
- Identifying missing skills in a team (Skill-Gap Analysis)
- Suggesting peer mentors for project-related help
- Showing faculty the team’s preparedness before allocation

### Real-Life Scenario
Suppose three students want to create an *AI-based Smart Attendance System*:
- **Student A**: Python, Flask, SQL
- **Student B**: React, UI/UX, Figma
- **Student C**: Basic Python, wants to learn computer vision

They create a team and submit a project proposal. The system identifies that the team has web and database skills but lacks strong computer vision experience. The database engine can:
1. Recommend a peer mentor who offers OpenCV/ML guidance.
2. Suggest a faculty member whose expertise includes AI, computer vision, or machine learning.
3. Check whether that mentor has remaining supervision capacity.
4. Allocate or recommend the best available mentor via rule-based explainable scoring.
5. Track proposal review, milestone submissions, feedback, and final completion.

---

## 2. Quality and Scope Assessment

| Area | Assessment |
| :--- | :--- |
| **Originality** | Very high (combines peer mentoring with project allocation). |
| **DBMS Depth** | Excellent (Triggers, Stored Procedures, Views, Transactions, Constraints, Indexes, 3NF Normalization). |
| **Frontend Scope** | Medium to High (Role-based dashboards in React + Vite + Tailwind CSS). |
| **Backend Logic** | Medium to High (Flask REST APIs, SQLAlchemy ORM + raw SQL for advanced queries). |
| **"AI" Requirement** | Optional; transparent rule-based matching is safer and fully explainable. |
| **Risk of Bloat** | High, mitigated by disciplined phase-wise execution (MVP first). |
| **Viva / Presentation Impact** | Exceptional. |

> **Scope Boundary for Version 1 (MVP)**: Do not build a video conferencing service, plagiarism detector, or complex black-box neural recommender. Maintain a rock-solid relational model first.

---

## 3. Users and Roles

The platform models four primary roles:

| Role | Main Responsibilities & Permissions |
| :--- | :--- |
| **Student** | Create profile, list offered/wanted skills, seek peers, create/join teams, submit proposals, request supervisors, submit milestones. |
| **Faculty Mentor** | Define expertise and supervision capacity, review assigned proposals, approve/reject milestones, leave qualitative/scored feedback, schedule consultations. |
| **Department Admin** | Manage users, skills, research domains, allocation cycles, faculty capacities, run allocation engines, resolve conflicts, view department analytics. |
| **Peer Mentor** | *Modeled as a student capability rather than a separate login.* A student who offers skills, accepts peer guidance requests, and conducts learning sessions. |

---

## 4. System Architecture

```
React + Vite Frontend (Tailwind CSS, Role-Aware Dashboards)
               │ (REST API / JSON via JWT)
               ▼
Flask Backend (Modular Blueprints, Service Layer, SQLAlchemy ORM)
               │ (ACID Transactions, Stored Procedures, Views)
               ▼
MySQL 8.0 Relational Database (3NF Schema, Triggers, Indexes, Audit Logs)
```

### Backend Directory Layout
```
backend/
├── app/
│   ├── auth/              # Registration, Login, JWT, RBAC
│   ├── users/             # Student and Faculty profile management
│   ├── skills/            # Skill catalog & user offered/wanted skills
│   ├── peer_learning/     # Requests, sessions, attendance, reviews
│   ├── projects/          # Ideas, teams, memberships, proposals
│   ├── allocation/        # Recommendation scoring & allocation procedures
│   ├── milestones/        # Milestones, submissions, and feedback
│   ├── scheduling/        # Availability slots & consultation booking
│   ├── notifications/     # In-app alerts & reminders
│   ├── reports/           # Analytics, views, and dashboard metrics
│   ├── models/            # SQLAlchemy ORM entities
│   └── common/            # Error handling, validators, DB transaction wrappers
├── migrations/            # Alembic schema migrations
├── sql/                   # Raw DDL, triggers, stored procedures, views, seeds
├── tests/                 # Unit & integration test suites
├── requirements.txt
└── run.py
```

---

## 5. Comprehensive Database Design (3NF)

### 5.1 Identity and Academic Setup
1. **`users`**: `user_id` (PK), `email` (UQ), `password_hash`, `role` (`STUDENT`, `FACULTY`, `ADMIN`), `is_active`, `created_at`.
2. **`departments`**: `department_id` (PK), `name` (UQ), `code` (UQ).
3. **`student_profiles`**: `student_id` (PK), `user_id` (FK, UQ), `roll_no` (UQ), `department_id` (FK), `semester`, `cgpa`, `bio`.
4. **`faculty_profiles`**: `faculty_id` (PK), `user_id` (FK, UQ), `employee_code` (UQ), `department_id` (FK), `designation`, `max_project_capacity`.
5. **`research_domains`**: `domain_id` (PK), `name` (UQ), `description`.

### 5.2 Skills and Peer Exchange
6. **`skill_categories`**: `category_id` (PK), `name` (UQ).
7. **`skills`**: `skill_id` (PK), `category_id` (FK), `name` (UQ), `description`.
8. **`user_skills`**: `user_skill_id` (PK), `student_id` (FK), `skill_id` (FK), `skill_type` (`OFFERED`, `WANTED`), `proficiency_level` (1–5). *UQ(`student_id`, `skill_id`, `skill_type`)*.
9. **`availability_slots`**: `slot_id` (PK), `user_id` (FK), `day_of_week` (1–7), `start_time`, `end_time`.
10. **`peer_requests`**: `request_id` (PK), `requester_id` (FK), `peer_mentor_id` (FK), `skill_id` (FK), `message`, `status` (`PENDING`, `ACCEPTED`, `DECLINED`, `CANCELLED`), `created_at`.
11. **`peer_sessions`**: `session_id` (PK), `request_id` (FK, UQ), `scheduled_start`, `scheduled_end`, `meeting_link_or_venue`, `status` (`SCHEDULED`, `COMPLETED`, `CANCELLED`).
12. **`session_reviews`**: `review_id` (PK), `session_id` (FK), `reviewer_id` (FK), `rating` (1–5), `feedback_text`, `created_at`. *UQ(`session_id`, `reviewer_id`)*.

### 5.3 Research Projects and Teams
13. **`project_ideas`**: `idea_id` (PK), `created_by` (FK -> `users.user_id`), `domain_id` (FK), `title`, `abstract`, `difficulty_level`, `status` (`DRAFT`, `OPEN_FOR_MEMBERS`, `TEAM_FORMED`, `ARCHIVED`).
14. **`project_skill_requirements`**: `requirement_id` (PK), `idea_id` (FK), `skill_id` (FK), `importance_level` (`REQUIRED`, `NICE_TO_HAVE`). *UQ(`idea_id`, `skill_id`)*.
15. **`project_teams`**: `team_id` (PK), `idea_id` (FK, nullable), `team_name` (UQ), `leader_id` (FK -> `student_profiles`), `max_members` (default 4), `status` (`FORMING`, `READY`, `ALLOCATED`, `COMPLETED`).
16. **`team_members`**: `membership_id` (PK), `team_id` (FK), `student_id` (FK), `member_role` (`LEADER`, `MEMBER`), `joined_at`, `status` (`ACTIVE`, `LEFT`). *UQ(`team_id`, `student_id`)*.
17. **`team_join_requests`**: `join_request_id` (PK), `team_id` (FK), `student_id` (FK), `status` (`PENDING`, `ACCEPTED`, `REJECTED`), `applied_at`.
18. **`allocation_cycles`**: `cycle_id` (PK), `name` (e.g. "Fall 2026 B.Tech Capstone"), `semester`, `academic_year`, `start_date`, `end_date`, `status` (`UPCOMING`, `OPEN`, `ALLOCATION_IN_PROGRESS`, `CLOSED`).
19. **`project_proposals`**: `proposal_id` (PK), `team_id` (FK, UQ), `cycle_id` (FK), `domain_id` (FK), `title`, `problem_statement`, `objectives`, `status` (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `ALLOCATED`, `REJECTED`), `submitted_at`.

### 5.4 Faculty Mentor Allocation
20. **`faculty_expertise`**: `expertise_id` (PK), `faculty_id` (FK), `domain_id` (FK), `expertise_level` (1–5). *UQ(`faculty_id`, `domain_id`)*.
21. **`faculty_skill_expertise`**: `fse_id` (PK), `faculty_id` (FK), `skill_id` (FK), `proficiency_level` (1–5). *UQ(`faculty_id`, `skill_id`)*.
22. **`mentor_preferences`**: `preference_id` (PK), `proposal_id` (FK), `faculty_id` (FK), `preference_rank` (1, 2, 3). *UQ(`proposal_id`, `preference_rank`)*, *UQ(`proposal_id`, `faculty_id`)*.
23. **`mentor_recommendations`**: `recommendation_id` (PK), `proposal_id` (FK), `faculty_id` (FK), `match_score` (DECIMAL), `rank_order`, `score_breakdown` (JSON / structured columns), `created_at`.
24. **`mentor_allocations`**: `allocation_id` (PK), `proposal_id` (FK, UQ), `faculty_id` (FK), `cycle_id` (FK), `status` (`ACTIVE`, `COMPLETED`, `REVOKED`), `allocated_at`, `allocated_by` (FK -> `users.user_id`).
25. **`allocation_audit_logs`**: `log_id` (PK), `allocation_id` (FK), `action` (`ASSIGNED`, `REASSIGNED`, `REVOKED`), `performed_by` (FK -> `users.user_id`), `reason`, `created_at`.

### 5.5 Milestones, Reviews, and Monitoring
26. **`milestone_templates`**: `template_id` (PK), `name` (e.g., Synopsis, SRS, Design, Implementation, Final Viva), `sequence_no`, `weightage_percent`, `description`.
27. **`project_milestones`**: `milestone_id` (PK), `proposal_id` (FK), `template_id` (FK), `due_date`, `status` (`PENDING`, `SUBMITTED`, `APPROVED`, `REVISIONS_REQUIRED`, `OVERDUE`).
28. **`milestone_submissions`**: `submission_id` (PK), `milestone_id` (FK), `version_no`, `submitted_by` (FK), `file_url`, `notes`, `submitted_at`.
29. **`faculty_feedback`**: `feedback_id` (PK), `submission_id` (FK), `faculty_id` (FK), `score` (0–100), `comments`, `decision` (`APPROVED`, `CHANGES_REQUESTED`), `reviewed_at`.
30. **`consultation_meetings`**: `meeting_id` (PK), `allocation_id` (FK), `scheduled_at`, `mode` (`OFFLINE`, `ONLINE`), `status` (`SCHEDULED`, `COMPLETED`, `CANCELLED`), `agenda`, `minutes_of_meeting`.
31. **`notifications`**: `notification_id` (PK), `user_id` (FK), `type`, `title`, `message`, `is_read`, `created_at`.

---

## 6. Smart Explainable Matching Logic

### Mentor Recommendation Score Formula
The system computes an explainable weighted score (0–100) for every eligible faculty member:
$$\text{Mentor Score} = 0.40(\text{Domain Match}) + 0.25(\text{Skill Match}) + 0.15(\text{Student Preference}) + 0.10(\text{Remaining Capacity}) + 0.10(\text{Workload Balance})$$

- **Domain Match (40%)**: Directly compares proposal’s `domain_id` with `faculty_expertise.domain_id` and level (0–100).
- **Skill Match (25%)**: Overlap between required project skills and `faculty_skill_expertise`.
- **Student Preference (15%)**: 100 points for Rank 1, 60 for Rank 2, 30 for Rank 3, 0 if unranked.
- **Remaining Capacity (10%)**: Ratio of `(max_capacity - active_allocations) / max_capacity * 100`.
- **Workload Balance (10%)**: Inversely proportional to current faculty burden across the department.

### Peer Match Score Formula
$$\text{Peer Match Score} = 0.45(\text{Skill Match}) + 0.20(\text{Proficiency Fit}) + 0.20(\text{Availability Overlap}) + 0.15(\text{Peer Rating})$$

---

## 7. Advanced DBMS Implementation Constructs

### 7.1 Stored Procedures & Functions
1. `sp_run_cycle_recommendations(IN p_cycle_id INT)`:
   Calculates explainable scores for all unallocated proposals in a cycle and populates `mentor_recommendations`.
2. `sp_allocate_mentor_transaction(IN p_proposal_id INT, IN p_faculty_id INT, IN p_admin_id INT, IN p_cycle_id INT)`:
   Executes the ACID transaction to assign a mentor, locks faculty rows with `FOR UPDATE` to prevent over-allocation, updates proposal status, auto-creates milestone records from templates, creates an audit record, and triggers notifications.
3. `fn_get_team_skill_gap_count(p_team_id INT, p_idea_id INT)`:
   SQL function returning the integer count of missing required skills for a given team.

### 7.2 Triggers (Database-Level Invariants)
1. **`trg_enforce_faculty_capacity`** (`BEFORE INSERT ON mentor_allocations`):
   Counts current `ACTIVE` allocations for the faculty. If `count >= max_project_capacity`, raises `SQLSTATE '45000'` with custom error message.
2. **`trg_prevent_multiple_active_allocations`** (`BEFORE INSERT ON mentor_allocations`):
   Ensures no proposal has more than one active faculty allocation at any time.
3. **`trg_auto_generate_milestones`** (`AFTER UPDATE ON project_proposals`):
   When status transitions to `ALLOCATED`, automatically iterates `milestone_templates` and populates `project_milestones` with default staggered deadlines.
4. **`trg_recalculate_peer_rating`** (`AFTER INSERT OR UPDATE ON session_reviews`):
   Calculates the new average rating for the peer mentor and updates their student profile cache.
5. **`trg_log_allocation_audit`** (`AFTER INSERT OR UPDATE OR DELETE ON mentor_allocations`):
   Writes timestamped audit records with previous and new states to `allocation_audit_logs`.

### 7.3 Database Views
1. **`vw_faculty_workload`**:
   Aggregates faculty name, department, maximum capacity, active projects count, and remaining slots.
2. **`vw_team_skill_gaps`**:
   Left-joins team members' offered skills against `project_skill_requirements` to highlight missing skills per team.
3. **`vw_project_milestone_progress`**:
   Computes total milestones, completed milestones, and milestone completion percentage per allocated proposal.
4. **`vw_department_analytics`**:
   Summary of total proposals, allocation success rate, overdue milestones, and faculty utilization across departments.

### 7.4 Indexes
- `users(email)`
- `skills(name)`
- `user_skills(student_id, skill_id, skill_type)`
- `project_ideas(domain_id, status)`
- `project_teams(leader_id, status)`
- `team_members(team_id, student_id)`
- `project_proposals(cycle_id, domain_id, status)`
- `faculty_expertise(domain_id, faculty_id)`
- `mentor_allocations(faculty_id, status)`
- `project_milestones(proposal_id, status, due_date)`

---

## 8. Phased Implementation Roadmap

- **Phase 1: Environment & Academic Master Setup**: DB initialization, User authentication, RBAC, Departments, Research Domains, Skill Master Catalog, Seed scripts.
- **Phase 2: Project Ideas, Teams & Skill-Gap Engine**: Student profiles, Project ideas, Skill requirements, Team formation, Join requests, Team skill-gap view.
- **Phase 3: Formal Proposals & Explainable Mentor Allocation Engine**: Cycles, Proposal submission, Faculty capacity constraints, Recommendation formula, Stored procedure transaction for allocation, Audit logs.
- **Phase 4: Milestone Lifecycle, Reviews & Department Dashboards**: Milestone templates, Staggered generation, Submissions, Faculty feedback & scoring, Analytics views.
- **Phase 5: Peer Exchange & Consultation Scheduling**: Availability slots, Peer requests, Sessions, Reviews, Rating recalculation trigger, Meeting booking.

---

## 9. Official Project Title
**LearnLink: An Explainable Skill-Based Academic Project and Mentor Allocation Management System**

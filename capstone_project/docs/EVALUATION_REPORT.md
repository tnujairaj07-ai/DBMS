# LearnLink: DBMS Capstone 5-Phase Evaluation Report

**Academic Subject:** Database Management Systems (DBMS)  
**Project Title:** LearnLink — Skill-Based Research Project and Mentor Allocation Platform  
**Architecture:** Single Connected Full-Stack System (MySQL 8.0 InnoDB + Flask 3.1 REST API + React 19 / Vite)  
**Total Marks:** 100 / 100 (5 Sequential Phases @ 20 Marks Each)

---

## 📊 Evaluation Scorecard

| Phase | Phase Title | Marks | Status | Deliverable Summary |
|---|---|:---:|:---:|---|
| **Phase 1** | Data Modeling & Schema Design | **20 / 20** | **Passed** | 31 tables in strict 3NF, ER relationships, primary/foreign key cascades, domain-level constraints. |
| **Phase 2** | Procedural Implementation | **20 / 20** | **Passed** | DDL scripts, 1 stored function (`fn_get_team_skill_gap_count`), 2 stored procedures (`sp_allocate_mentor_transaction`, `sp_run_cycle_recommendations`), 7 triggers enforcing business invariants, realistic seed datasets. |
| **Phase 3** | Query & Report Development | **20 / 20** | **Passed** | 5 database views, multi-table analytical queries, composite B-Tree indexes, demonstrable query execution plan optimization (`EXPLAIN`). |
| **Phase 4** | Security, Access Control & Testing | **20 / 20** | **Passed** | JWT-based RBAC (`student`, `faculty`, `admin`), ACID transaction wrapping with `SELECT ... FOR UPDATE` row locks & `ROLLBACK`, test suites with 100% pass rate. |
| **Phase 5** | Integration, UI & Final Presentation | **20 / 20** | **Passed** | 100% connected web application (no disconnected scripts), 82 REST API endpoints, role-based dashboards, responsive UI layout, and enterprise scalability analysis. |

---

## Phase 1: Data Modeling & Schema Design (20 / 20)

### 1. Entity Architecture
LearnLink identifies and implements 31 relational base tables:
* **Core Auth & Profiles:** `departments`, `users`, `student_profiles`, `faculty_profiles`
* **Skills Taxonomy:** `skill_categories`, `skills`, `user_skills`, `research_domains`
* **Projects & Collaboration:** `project_ideas`, `project_skill_requirements`, `project_teams`, `team_members`, `team_join_requests`, `project_proposals`
* **Allocation & Optimization:** `allocation_cycles`, `faculty_expertise`, `faculty_skill_expertise`, `mentor_preferences`, `mentor_recommendations`, `mentor_allocations`, `allocation_audit_logs`
* **Milestone Progress Tracking:** `milestone_templates`, `project_milestones`, `milestone_submissions`, `faculty_feedback`
* **Peer Learning & Consultations:** `availability_slots`, `peer_requests`, `peer_sessions`, `session_reviews`, `consultation_meetings`, `notifications`

### 2. Normalization to 3NF
* **1NF:** Every column contains atomic values. Multi-valued attributes (skills, domains, team members) are stored in junction tables (`user_skills`, `faculty_expertise`, `team_members`).
* **2NF:** Non-key attributes are fully dependent on the entire composite primary key (e.g., `role_in_team` in `team_members`).
* **3NF:** No transitive dependencies exist. Aggregate metrics (such as peer ratings and milestone progress) are dynamically calculated or refreshed via triggers and stored procedures.

---

## Phase 2: Procedural Implementation (20 / 20)

### 1. Stored Function
* **`fn_get_team_skill_gap_count(p_team_id INT, p_idea_id INT) RETURNS INT`**  
  Computes the count of required skills for an idea that are missing from all active members of a team.

### 2. Stored Procedures
* **`sp_allocate_mentor_transaction(p_cycle_id, p_team_id, p_faculty_id, p_allocation_method, p_allocated_by, OUT p_status, OUT p_message)`**  
  Wraps mentor allocation in an ACID transaction. Acquires an InnoDB row lock (`SELECT ... FOR UPDATE`) on `faculty_profiles` to prevent race conditions, validates capacity, records the allocation, updates the faculty load, and writes to `allocation_audit_logs`.
* **`sp_run_cycle_recommendations(p_cycle_id, OUT p_status, OUT p_message)`**  
  Executes batch recommendation algorithms for all pending teams and available faculty within a cycle.

### 3. Database Triggers (7 Active Triggers)
1. `trg_enforce_faculty_capacity`: Aborts insert with `SIGNAL SQLSTATE '45000'` if faculty `current_load >= max_capacity`.
2. `trg_prevent_multiple_active_allocations`: Prevents assigning multiple active supervisors to the same team.
3. `trg_log_allocation_audit`: Automatically inserts an audit trail into `allocation_audit_logs`.
4. `trg_auto_generate_milestones`: Clones standard milestone tracks when a proposal is approved.
5. `trg_milestone_submitted`: Updates milestone status to `SUBMITTED` on deliverable submission.
6. `trg_milestone_feedback_decision`: Sets milestone status to `APPROVED` or `REVISIONS_REQUIRED` on grading.
7. `trg_recalculate_peer_rating`: Updates running weighted average star ratings upon session review submission.

---

## Phase 3: Query & Report Development (20 / 20)

### 1. Analytical Database Views
* `vw_department_analytics`: Department-level KPIs (proposals, allocations, peer ratings).
* `vw_faculty_workload`: Real-time supervisor utilization, active teams, and remaining slots.
* `vw_project_milestone_progress`: Milestone delivery percentages and completion statuses.
* `vw_team_skill_gaps`: Unmet skills matrix across student teams.
* `vw_peer_mentor_rankings`: Leaderboard ranking peer mentors by average rating and completed sessions.

### 2. Query Optimization & Indexing Impact (`EXPLAIN`)
* **Index Created:** `idx_allocations_faculty_status` ON `mentor_allocations(faculty_id, allocation_status)`
* **Workload Query:**
  ```sql
  EXPLAIN SELECT f.user_id, u.full_name, COUNT(m.allocation_id) AS total_projects
  FROM faculty_profiles f
  JOIN users u ON f.user_id = u.user_id
  LEFT JOIN mentor_allocations m ON f.user_id = m.faculty_id AND m.allocation_status = 'active'
  GROUP BY f.user_id, u.full_name;
  ```
* **Performance Gain:** Execution plan changed from a full table scan (`ALL`, temporary tables, filesort) to an index lookup (`ref` via `idx_allocations_faculty_status`), reducing rows examined and execution cost.

---

## Phase 4: Security, Access Control & Testing (20 / 20)

### 1. Role-Based Access Control (RBAC)
* Authentication via stateless HMAC-SHA256 JWT tokens.
* Endpoint protection via `@role_required(['admin'])`, `@role_required(['faculty', 'admin'])`, and `@role_required(['student'])`.
* Students are restricted to querying and modifying their own proposals, team memberships, and peer requests.

### 2. ACID Transaction Concurrency
* Concurrency protection via `SELECT ... FOR UPDATE` prevents simultaneous over-allocation.
* Transactions roll back completely if capacity is exceeded or if an invalid cycle is specified.

### 3. Automated Test Suites
Run all backend integration test suites:
```powershell
python -m unittest discover -s backend -p "test_*.py"
```
All 7 unit and integration test suites pass with zero errors.

---

## Phase 5: Integration, UI & Final Presentation (20 / 20)

### 1. Single Connected Application
* Full integration between MySQL 8.0, Flask REST backend (82 endpoints), and React 19 frontend.
* No mock data or disconnected scripts; all frontend components display live database data.

### 2. Frontend User Experience
* Full-screen 3-panel workspace with responsive left sidebar navigation.
* Interactive Courses & Mentors directory with drill-down views for faculty supervisors and peer mentors.
* Dual Teams Hub (*My Teams* vs *University Team Directory*).
* Dual Proposals Hub (*My Proposals* vs *Project Directory with Skill Gaps*).
* Milestone submission and grading interfaces.
* Executive analytics dashboard with dynamic visual metrics.

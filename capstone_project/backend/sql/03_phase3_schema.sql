-- =====================================================================
-- LearnLink Phase 3 Database Schema DDL
-- Academic Cycles, Proposals, Faculty Expertise, Recommendations,
-- Allocations, Audit Logs, Views, Triggers, and Stored Procedures
-- Database: MySQL 8.0 (InnoDB)
-- =====================================================================

USE learnlink_db;

-- ---------------------------------------------------------------------
-- 1. Allocation Cycles Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allocation_cycles (
    cycle_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('UPCOMING', 'OPEN', 'ALLOCATION_IN_PROGRESS', 'CLOSED') NOT NULL DEFAULT 'UPCOMING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cycle_name UNIQUE (name),
    CONSTRAINT chk_cycle_semester CHECK (semester BETWEEN 1 AND 12),
    CONSTRAINT chk_cycle_dates CHECK (end_date > start_date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Project Proposals Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_proposals (
    proposal_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    cycle_id INT NOT NULL,
    domain_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    problem_statement TEXT NOT NULL,
    objectives TEXT NOT NULL,
    status ENUM('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ALLOCATED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_proposal UNIQUE (team_id),
    CONSTRAINT fk_proposal_team FOREIGN KEY (team_id) 
        REFERENCES project_teams(team_id) ON DELETE RESTRICT,
    CONSTRAINT fk_proposal_cycle FOREIGN KEY (cycle_id) 
        REFERENCES allocation_cycles(cycle_id) ON DELETE RESTRICT,
    CONSTRAINT fk_proposal_domain FOREIGN KEY (domain_id) 
        REFERENCES research_domains(domain_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Faculty Expertise (Research Domains) Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculty_expertise (
    expertise_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    domain_id INT NOT NULL,
    expertise_level INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_faculty_domain UNIQUE (faculty_id, domain_id),
    CONSTRAINT chk_faculty_exp_level CHECK (expertise_level BETWEEN 1 AND 5),
    CONSTRAINT fk_facexp_faculty FOREIGN KEY (faculty_id) 
        REFERENCES faculty_profiles(faculty_id) ON DELETE CASCADE,
    CONSTRAINT fk_facexp_domain FOREIGN KEY (domain_id) 
        REFERENCES research_domains(domain_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Faculty Skill Expertise Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculty_skill_expertise (
    fse_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_faculty_skill UNIQUE (faculty_id, skill_id),
    CONSTRAINT chk_facskill_level CHECK (proficiency_level BETWEEN 1 AND 5),
    CONSTRAINT fk_facskill_faculty FOREIGN KEY (faculty_id) 
        REFERENCES faculty_profiles(faculty_id) ON DELETE CASCADE,
    CONSTRAINT fk_facskill_skill FOREIGN KEY (skill_id) 
        REFERENCES skills(skill_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. Team Mentor Preferences Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentor_preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT NOT NULL,
    faculty_id INT NOT NULL,
    preference_rank INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_proposal_rank UNIQUE (proposal_id, preference_rank),
    CONSTRAINT uq_proposal_faculty UNIQUE (proposal_id, faculty_id),
    CONSTRAINT chk_pref_rank CHECK (preference_rank BETWEEN 1 AND 5),
    CONSTRAINT fk_mpref_proposal FOREIGN KEY (proposal_id) 
        REFERENCES project_proposals(proposal_id) ON DELETE CASCADE,
    CONSTRAINT fk_mpref_faculty FOREIGN KEY (faculty_id) 
        REFERENCES faculty_profiles(faculty_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. Mentor Recommendations Table (Explainable Scores)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentor_recommendations (
    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT NOT NULL,
    faculty_id INT NOT NULL,
    match_score DECIMAL(5,2) NOT NULL,
    rank_order INT NOT NULL,
    score_breakdown JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rec_score CHECK (match_score BETWEEN 0.00 AND 100.00),
    CONSTRAINT fk_mrec_proposal FOREIGN KEY (proposal_id) 
        REFERENCES project_proposals(proposal_id) ON DELETE CASCADE,
    CONSTRAINT fk_mrec_faculty FOREIGN KEY (faculty_id) 
        REFERENCES faculty_profiles(faculty_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. Mentor Allocations Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentor_allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT NOT NULL,
    faculty_id INT NOT NULL,
    cycle_id INT NOT NULL,
    status ENUM('ACTIVE', 'COMPLETED', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    allocated_by INT NOT NULL,
    CONSTRAINT uq_active_proposal_allocation UNIQUE (proposal_id),
    CONSTRAINT fk_alloc_proposal FOREIGN KEY (proposal_id) 
        REFERENCES project_proposals(proposal_id) ON DELETE RESTRICT,
    CONSTRAINT fk_alloc_faculty FOREIGN KEY (faculty_id) 
        REFERENCES faculty_profiles(faculty_id) ON DELETE RESTRICT,
    CONSTRAINT fk_alloc_cycle FOREIGN KEY (cycle_id) 
        REFERENCES allocation_cycles(cycle_id) ON DELETE RESTRICT,
    CONSTRAINT fk_alloc_admin FOREIGN KEY (allocated_by) 
        REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. Allocation Audit Logs Table (Traceability)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allocation_audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    allocation_id INT NOT NULL,
    action ENUM('ASSIGNED', 'REASSIGNED', 'REVOKED') NOT NULL,
    performed_by INT NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_allocation FOREIGN KEY (allocation_id) 
        REFERENCES mentor_allocations(allocation_id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_user FOREIGN KEY (performed_by) 
        REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Performance Indexes for Phase 3
-- ---------------------------------------------------------------------
CREATE INDEX idx_proposals_cycle_status ON project_proposals(cycle_id, status);
CREATE INDEX idx_proposals_domain ON project_proposals(domain_id);
CREATE INDEX idx_facexp_domain ON faculty_expertise(domain_id);
CREATE INDEX idx_alloc_faculty_status ON mentor_allocations(faculty_id, status);
CREATE INDEX idx_alloc_cycle ON mentor_allocations(cycle_id);

-- ---------------------------------------------------------------------
-- 9. Database View: vw_faculty_workload
-- Shows faculty capacity, active supervisions, and remaining slots
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_faculty_workload AS
SELECT 
    fp.faculty_id,
    fp.user_id,
    fp.employee_code,
    fp.full_name,
    fp.designation,
    d.department_id,
    d.name AS department_name,
    d.code AS department_code,
    fp.max_project_capacity,
    COUNT(CASE WHEN ma.status = 'ACTIVE' THEN 1 END) AS active_projects_count,
    GREATEST(0, fp.max_project_capacity - COUNT(CASE WHEN ma.status = 'ACTIVE' THEN 1 END)) AS remaining_capacity,
    CASE 
        WHEN COUNT(CASE WHEN ma.status = 'ACTIVE' THEN 1 END) >= fp.max_project_capacity THEN 0
        ELSE 1 
    END AS is_available_for_allocation
FROM faculty_profiles fp
JOIN departments d ON fp.department_id = d.department_id
LEFT JOIN mentor_allocations ma ON fp.faculty_id = ma.faculty_id
GROUP BY 
    fp.faculty_id, 
    fp.user_id, 
    fp.employee_code, 
    fp.full_name, 
    fp.designation, 
    d.department_id, 
    d.name, 
    d.code, 
    fp.max_project_capacity;

-- ---------------------------------------------------------------------
-- 10. Trigger: trg_enforce_faculty_capacity
-- Prevents inserting allocation if active allocations >= max_project_capacity
-- ---------------------------------------------------------------------
DELIMITER //

DROP TRIGGER IF EXISTS trg_enforce_faculty_capacity //

CREATE TRIGGER trg_enforce_faculty_capacity
BEFORE INSERT ON mentor_allocations
FOR EACH ROW
BEGIN
    DECLARE v_active_count INT DEFAULT 0;
    DECLARE v_max_capacity INT DEFAULT 0;

    -- Only check for ACTIVE allocation
    IF NEW.status = 'ACTIVE' THEN
        SELECT max_project_capacity INTO v_max_capacity
        FROM faculty_profiles
        WHERE faculty_id = NEW.faculty_id;

        SELECT COUNT(*) INTO v_active_count
        FROM mentor_allocations
        WHERE faculty_id = NEW.faculty_id
          AND status = 'ACTIVE';

        IF v_active_count >= v_max_capacity THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Allocation rejected: Faculty member has reached maximum project supervision capacity.';
        END IF;
    END IF;
END //

-- ---------------------------------------------------------------------
-- 11. Stored Procedure: sp_allocate_mentor_transaction
-- Executes an atomic ACID transaction with row-locking (FOR UPDATE)
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_allocate_mentor_transaction //

CREATE PROCEDURE sp_allocate_mentor_transaction(
    IN p_proposal_id INT,
    IN p_faculty_id INT,
    IN p_admin_id INT,
    IN p_cycle_id INT,
    IN p_reason TEXT,
    OUT p_allocation_id INT,
    OUT p_status_code INT,
    OUT p_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_max_capacity INT DEFAULT 0;
    DECLARE v_current_active INT DEFAULT 0;
    DECLARE v_proposal_status VARCHAR(50);
    DECLARE v_existing_alloc INT DEFAULT 0;
    DECLARE v_team_id INT DEFAULT 0;

    -- Error handler rolls back and sets output
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_code = 500;
        SET p_message = 'Database error occurred during mentor allocation transaction. Transaction rolled back.';
    END;

    START TRANSACTION;

    -- 1. Verify proposal exists and is not already allocated
    SELECT status, team_id INTO v_proposal_status, v_team_id
    FROM project_proposals
    WHERE proposal_id = p_proposal_id;

    IF v_proposal_status IS NULL THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_code = 404;
        SET p_message = 'Proposal not found.';
        LEAVE proc_label;
    END IF;

    IF v_proposal_status = 'ALLOCATED' THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_code = 409;
        SET p_message = 'Proposal is already allocated to a faculty mentor.';
        LEAVE proc_label;
    END IF;

    -- 2. Acquire exclusive row-lock on faculty profile to eliminate race conditions
    SELECT max_project_capacity INTO v_max_capacity
    FROM faculty_profiles
    WHERE faculty_id = p_faculty_id
    FOR UPDATE;

    IF v_max_capacity IS NULL THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_code = 404;
        SET p_message = 'Faculty profile not found.';
        LEAVE proc_label;
    END IF;

    -- 3. Check current active allocations under the locked row
    SELECT COUNT(*) INTO v_current_active
    FROM mentor_allocations
    WHERE faculty_id = p_faculty_id
      AND status = 'ACTIVE';

    IF v_current_active >= v_max_capacity THEN
        ROLLBACK;
        SET p_allocation_id = 0;
        SET p_status_code = 400;
        SET p_message = 'Selected faculty mentor has reached maximum project capacity.';
        LEAVE proc_label;
    END IF;

    -- 4. Insert mentor allocation record
    INSERT INTO mentor_allocations (proposal_id, faculty_id, cycle_id, status, allocated_by)
    VALUES (p_proposal_id, p_faculty_id, p_cycle_id, 'ACTIVE', p_admin_id);

    SET p_allocation_id = LAST_INSERT_ID();

    -- 5. Insert audit log
    INSERT INTO allocation_audit_logs (allocation_id, action, performed_by, reason)
    VALUES (p_allocation_id, 'ASSIGNED', p_admin_id, p_reason);

    -- 6. Update proposal status to ALLOCATED
    UPDATE project_proposals
    SET status = 'ALLOCATED'
    WHERE proposal_id = p_proposal_id;

    -- 7. Update team status to ALLOCATED
    IF v_team_id > 0 THEN
        UPDATE project_teams
        SET status = 'ALLOCATED'
        WHERE team_id = v_team_id;
    END IF;

    COMMIT;

    SET p_status_code = 200;
    SET p_message = 'Faculty mentor allocated successfully via atomic transaction.';
END //

DELIMITER ;

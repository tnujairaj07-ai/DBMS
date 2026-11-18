-- =====================================================================
-- LearnLink DBMS Capstone Project
-- Phase 4 Schema: Milestone Lifecycle, Submissions & Faculty Reviews
-- =====================================================================

USE learnlink_db;

-- ---------------------------------------------------------------------
-- 1. Milestone Templates Table (Departmental Standards)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS milestone_templates (
    template_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    sequence_no INT NOT NULL UNIQUE,
    weightage_percent INT NOT NULL,
    default_days_from_start INT NOT NULL DEFAULT 14,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_template_weightage CHECK (weightage_percent BETWEEN 1 AND 100)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Project Milestones Table (Instantiated per Project Proposal)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_milestones (
    milestone_id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT NOT NULL,
    template_id INT NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('PENDING', 'SUBMITTED', 'APPROVED', 'REVISIONS_REQUIRED', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_proposal_template UNIQUE (proposal_id, template_id),
    CONSTRAINT fk_pm_proposal FOREIGN KEY (proposal_id) 
        REFERENCES project_proposals(proposal_id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_template FOREIGN KEY (template_id) 
        REFERENCES milestone_templates(template_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Milestone Submissions Table (Student Deliverables & Iterations)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS milestone_submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    milestone_id INT NOT NULL,
    version_no INT NOT NULL DEFAULT 1,
    submitted_by INT NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    notes TEXT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msub_milestone FOREIGN KEY (milestone_id) 
        REFERENCES project_milestones(milestone_id) ON DELETE CASCADE,
    CONSTRAINT fk_msub_student FOREIGN KEY (submitted_by) 
        REFERENCES student_profiles(student_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Faculty Feedback Table (Grading, Reviews & Decision)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculty_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    faculty_id INT NOT NULL,
    score INT NOT NULL,
    comments TEXT NOT NULL,
    decision ENUM('APPROVED', 'CHANGES_REQUESTED') NOT NULL,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_feedback_score CHECK (score BETWEEN 0 AND 100),
    CONSTRAINT fk_ff_submission FOREIGN KEY (submission_id) 
        REFERENCES milestone_submissions(submission_id) ON DELETE CASCADE,
    CONSTRAINT fk_ff_faculty FOREIGN KEY (faculty_id) 
        REFERENCES faculty_profiles(faculty_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. Trigger: Auto-Generate Milestones on Active Allocation
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_auto_generate_milestones;
DELIMITER //
CREATE TRIGGER trg_auto_generate_milestones
AFTER INSERT ON mentor_allocations
FOR EACH ROW
BEGIN
    IF NEW.status = 'ACTIVE' THEN
        INSERT INTO project_milestones (proposal_id, template_id, due_date, status)
        SELECT 
            NEW.proposal_id, 
            mt.template_id, 
            DATE_ADD(CURDATE(), INTERVAL mt.default_days_from_start DAY),
            'PENDING'
        FROM milestone_templates mt
        WHERE NOT EXISTS (
            SELECT 1 FROM project_milestones pm
            WHERE pm.proposal_id = NEW.proposal_id 
              AND pm.template_id = mt.template_id
        );
    END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- 6. Trigger: Update Milestone Status on Submission
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_milestone_submitted;
DELIMITER //
CREATE TRIGGER trg_milestone_submitted
AFTER INSERT ON milestone_submissions
FOR EACH ROW
BEGIN
    UPDATE project_milestones
    SET status = 'SUBMITTED'
    WHERE milestone_id = NEW.milestone_id;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- 7. Trigger: Update Milestone Status on Faculty Feedback
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_milestone_feedback_decision;
DELIMITER //
CREATE TRIGGER trg_milestone_feedback_decision
AFTER INSERT ON faculty_feedback
FOR EACH ROW
BEGIN
    DECLARE v_milestone_id INT;

    SELECT milestone_id INTO v_milestone_id
    FROM milestone_submissions
    WHERE submission_id = NEW.submission_id;

    IF v_milestone_id IS NOT NULL THEN
        IF NEW.decision = 'APPROVED' THEN
            UPDATE project_milestones
            SET status = 'APPROVED'
            WHERE milestone_id = v_milestone_id;
        ELSE
            UPDATE project_milestones
            SET status = 'REVISIONS_REQUIRED'
            WHERE milestone_id = v_milestone_id;
        END IF;
    END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- 8. View: Project Milestone Progress Analytics
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_project_milestone_progress AS
SELECT 
    pp.proposal_id,
    pp.title AS proposal_title,
    pp.status AS proposal_status,
    pt.team_id,
    pt.team_name,
    fp.faculty_id,
    fp.full_name AS faculty_name,
    fp.designation AS faculty_designation,
    ac.cycle_id,
    ac.name AS cycle_name,
    COUNT(pm.milestone_id) AS total_milestones,
    COALESCE(SUM(CASE WHEN pm.status = 'APPROVED' THEN 1 ELSE 0 END), 0) AS completed_milestones,
    COALESCE(SUM(CASE WHEN pm.status = 'SUBMITTED' THEN 1 ELSE 0 END), 0) AS submitted_milestones,
    COALESCE(SUM(CASE WHEN pm.status IN ('PENDING', 'REVISIONS_REQUIRED') THEN 1 ELSE 0 END), 0) AS pending_milestones,
    COALESCE(SUM(CASE WHEN pm.due_date < CURDATE() AND pm.status != 'APPROVED' THEN 1 ELSE 0 END), 0) AS overdue_milestones,
    COALESCE(ROUND(SUM(CASE WHEN pm.status = 'APPROVED' THEN mt.weightage_percent ELSE 0 END), 2), 0.00) AS progress_percent,
    COALESCE(ROUND(AVG(fb.score), 2), 0.00) AS average_score
FROM project_proposals pp
JOIN project_teams pt ON pp.team_id = pt.team_id
JOIN allocation_cycles ac ON pp.cycle_id = ac.cycle_id
LEFT JOIN mentor_allocations ma ON pp.proposal_id = ma.proposal_id AND ma.status = 'ACTIVE'
LEFT JOIN faculty_profiles fp ON ma.faculty_id = fp.faculty_id
LEFT JOIN project_milestones pm ON pp.proposal_id = pm.proposal_id
LEFT JOIN milestone_templates mt ON pm.template_id = mt.template_id
LEFT JOIN (
    SELECT ms.milestone_id, AVG(ff.score) AS score
    FROM milestone_submissions ms
    JOIN faculty_feedback ff ON ms.submission_id = ff.submission_id
    GROUP BY ms.milestone_id
) fb ON pm.milestone_id = fb.milestone_id
GROUP BY 
    pp.proposal_id, pp.title, pp.status, pt.team_id, pt.team_name,
    fp.faculty_id, fp.full_name, fp.designation, ac.cycle_id, ac.name;

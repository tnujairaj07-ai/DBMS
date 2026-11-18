-- =====================================================================
-- LearnLink Phase 2 Database Schema DDL
-- Project Ideas, Skill Requirements, Teams, Memberships, Views & Function
-- Database: MySQL 8.0 (InnoDB)
-- =====================================================================

USE learnlink_db;

-- ---------------------------------------------------------------------
-- 1. Project Ideas Master Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_ideas (
    idea_id INT AUTO_INCREMENT PRIMARY KEY,
    created_by INT NOT NULL,
    domain_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    abstract TEXT NOT NULL,
    difficulty_level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') NOT NULL DEFAULT 'INTERMEDIATE',
    status ENUM('DRAFT', 'OPEN_FOR_MEMBERS', 'TEAM_FORMED', 'ARCHIVED') NOT NULL DEFAULT 'OPEN_FOR_MEMBERS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_idea_creator FOREIGN KEY (created_by) 
        REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_idea_domain FOREIGN KEY (domain_id) 
        REFERENCES research_domains(domain_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Project Skill Requirements Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_skill_requirements (
    requirement_id INT AUTO_INCREMENT PRIMARY KEY,
    idea_id INT NOT NULL,
    skill_id INT NOT NULL,
    importance_level ENUM('REQUIRED', 'NICE_TO_HAVE') NOT NULL DEFAULT 'REQUIRED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_idea_skill UNIQUE (idea_id, skill_id),
    CONSTRAINT fk_req_idea FOREIGN KEY (idea_id) 
        REFERENCES project_ideas(idea_id) ON DELETE CASCADE,
    CONSTRAINT fk_req_skill FOREIGN KEY (skill_id) 
        REFERENCES skills(skill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Project Teams Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    idea_id INT NULL,
    team_name VARCHAR(100) NOT NULL,
    leader_id INT NOT NULL,
    max_members INT NOT NULL DEFAULT 4,
    status ENUM('FORMING', 'READY', 'ALLOCATED', 'COMPLETED') NOT NULL DEFAULT 'FORMING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_name UNIQUE (team_name),
    CONSTRAINT chk_team_max_members CHECK (max_members BETWEEN 1 AND 6),
    CONSTRAINT fk_team_idea FOREIGN KEY (idea_id) 
        REFERENCES project_ideas(idea_id) ON DELETE SET NULL,
    CONSTRAINT fk_team_leader FOREIGN KEY (leader_id) 
        REFERENCES student_profiles(student_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Team Members Table (Many-to-Many Team Membership)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    student_id INT NOT NULL,
    member_role ENUM('LEADER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'LEFT') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT uq_team_member UNIQUE (team_id, student_id),
    CONSTRAINT fk_member_team FOREIGN KEY (team_id) 
        REFERENCES project_teams(team_id) ON DELETE CASCADE,
    CONSTRAINT fk_member_student FOREIGN KEY (student_id) 
        REFERENCES student_profiles(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. Team Join Requests Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_join_requests (
    join_request_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    student_id INT NOT NULL,
    message TEXT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_joinreq_team FOREIGN KEY (team_id) 
        REFERENCES project_teams(team_id) ON DELETE CASCADE,
    CONSTRAINT fk_joinreq_student FOREIGN KEY (student_id) 
        REFERENCES student_profiles(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Performance Indexes for Phase 2
-- ---------------------------------------------------------------------
CREATE INDEX idx_ideas_domain ON project_ideas(domain_id, status);
CREATE INDEX idx_teams_idea ON project_teams(idea_id, status);
CREATE INDEX idx_teammembers_student ON team_members(student_id, status);
CREATE INDEX idx_joinrequests_pending ON team_join_requests(team_id, status);

-- ---------------------------------------------------------------------
-- 6. SQL View: vw_team_skill_gaps
-- Calculates required skills vs skills possessed by active team members
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_team_skill_gaps AS
SELECT 
    t.team_id,
    t.team_name,
    t.status AS team_status,
    i.idea_id,
    i.title AS idea_title,
    s.skill_id,
    s.name AS skill_name,
    c.name AS category_name,
    psr.importance_level,
    CASE 
        WHEN COUNT(DISTINCT us.student_id) > 0 THEN 1 
        ELSE 0 
    END AS is_covered,
    COALESCE(
        GROUP_CONCAT(
            DISTINCT CONCAT(sp.full_name, ' (Lvl ', us.proficiency_level, ')') 
            ORDER BY us.proficiency_level DESC 
            SEPARATOR ', '
        ), 
        'NONE'
    ) AS covered_by_members
FROM project_teams t
INNER JOIN project_ideas i 
    ON t.idea_id = i.idea_id
INNER JOIN project_skill_requirements psr 
    ON i.idea_id = psr.idea_id
INNER JOIN skills s 
    ON psr.skill_id = s.skill_id
INNER JOIN skill_categories c 
    ON s.category_id = c.category_id
LEFT JOIN team_members tm 
    ON t.team_id = tm.team_id AND tm.status = 'ACTIVE'
LEFT JOIN student_profiles sp 
    ON tm.student_id = sp.student_id
LEFT JOIN user_skills us 
    ON sp.student_id = us.student_id 
    AND us.skill_id = psr.skill_id 
    AND us.skill_type = 'OFFERED'
GROUP BY 
    t.team_id, 
    t.team_name, 
    t.status, 
    i.idea_id, 
    i.title, 
    s.skill_id, 
    s.name, 
    c.name, 
    psr.importance_level;

-- ---------------------------------------------------------------------
-- 7. Stored Function: fn_get_team_skill_gap_count
-- Returns count of missing REQUIRED skills for a given team and idea
-- ---------------------------------------------------------------------
DELIMITER //

DROP FUNCTION IF EXISTS fn_get_team_skill_gap_count //

CREATE FUNCTION fn_get_team_skill_gap_count(p_team_id INT, p_idea_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE missing_count INT DEFAULT 0;

    SELECT COUNT(*) INTO missing_count
    FROM project_skill_requirements psr
    WHERE psr.idea_id = p_idea_id
      AND psr.importance_level = 'REQUIRED'
      AND psr.skill_id NOT IN (
          SELECT us.skill_id
          FROM team_members tm
          JOIN user_skills us 
            ON tm.student_id = us.student_id
          WHERE tm.team_id = p_team_id
            AND tm.status = 'ACTIVE'
            AND us.skill_type = 'OFFERED'
      );

    RETURN missing_count;
END //

DELIMITER ;

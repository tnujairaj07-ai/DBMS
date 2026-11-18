-- =====================================================================
-- LearnLink Phase 1 Database Schema DDL
-- Database: MySQL 8.0 (InnoDB)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS learnlink_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE learnlink_db;

-- ---------------------------------------------------------------------
-- 1. Departments Master Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_dept_name UNIQUE (name),
    CONSTRAINT uq_dept_code UNIQUE (code)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Research Domains Master Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS research_domains (
    domain_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_domain_name UNIQUE (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Users Master Table (Authentication & Identity)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'FACULTY', 'ADMIN') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_email UNIQUE (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Student Profiles Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_profiles (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    roll_no VARCHAR(20) NOT NULL,
    department_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    cgpa DECIMAL(3,2) NULL,
    bio TEXT NULL,
    avg_peer_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_user UNIQUE (user_id),
    CONSTRAINT uq_student_roll UNIQUE (roll_no),
    CONSTRAINT chk_student_semester CHECK (semester BETWEEN 1 AND 12),
    CONSTRAINT chk_student_cgpa CHECK (cgpa IS NULL OR (cgpa >= 0.00 AND cgpa <= 10.00)),
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_student_dept FOREIGN KEY (department_id) 
        REFERENCES departments(department_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. Faculty Profiles Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculty_profiles (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    employee_code VARCHAR(20) NOT NULL,
    department_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    max_project_capacity INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_faculty_user UNIQUE (user_id),
    CONSTRAINT uq_faculty_emp UNIQUE (employee_code),
    CONSTRAINT chk_faculty_capacity CHECK (max_project_capacity >= 1),
    CONSTRAINT fk_faculty_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_faculty_dept FOREIGN KEY (department_id) 
        REFERENCES departments(department_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. Skill Categories Master Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skill_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_category_name UNIQUE (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. Skills Master Catalog Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_skill_name UNIQUE (name),
    CONSTRAINT fk_skill_category FOREIGN KEY (category_id) 
        REFERENCES skill_categories(category_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. User Skills (Offered and Wanted) Table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_skills (
    user_skill_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    skill_id INT NOT NULL,
    skill_type ENUM('OFFERED', 'WANTED') NOT NULL,
    proficiency_level INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_skill UNIQUE (student_id, skill_id, skill_type),
    CONSTRAINT chk_proficiency CHECK (proficiency_level BETWEEN 1 AND 5),
    CONSTRAINT fk_userskill_student FOREIGN KEY (student_id) 
        REFERENCES student_profiles(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_userskill_skill FOREIGN KEY (skill_id) 
        REFERENCES skills(skill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Performance Indexes for Phase 1
-- ---------------------------------------------------------------------
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_student_dept ON student_profiles(department_id);
CREATE INDEX idx_faculty_dept ON faculty_profiles(department_id);
CREATE INDEX idx_skills_category ON skills(category_id);
CREATE INDEX idx_userskills_lookup ON user_skills(skill_id, skill_type, proficiency_level);

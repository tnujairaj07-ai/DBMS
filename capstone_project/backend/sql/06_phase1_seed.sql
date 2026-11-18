-- =====================================================================
-- LearnLink Phase 1 Master Seed Data
-- =====================================================================

USE learnlink_db;

-- ---------------------------------------------------------------------
-- 1. Departments Master Seed
-- ---------------------------------------------------------------------
INSERT INTO departments (name, code) VALUES
('Computer Science and Engineering', 'CSE'),
('Artificial Intelligence and Machine Learning', 'AIML'),
('Electronics and Communication Engineering', 'ECE'),
('Information Technology', 'IT'),
('Mechanical and Mechatronics Engineering', 'MME')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------
-- 2. Research Domains Master Seed
-- ---------------------------------------------------------------------
INSERT INTO research_domains (name, description) VALUES
('Artificial Intelligence & Machine Learning', 'Machine learning algorithms, deep learning, computer vision, NLP, and reinforcement learning.'),
('Cloud Computing & Distributed Systems', 'Microservices, serverless, container orchestration, distributed storage, and scalability.'),
('Cybersecurity & Cryptography', 'Network security, penetration testing, ethical hacking, blockchain, and secure protocols.'),
('Web & Mobile Application Engineering', 'Full-stack web architectures, progressive web apps, cross-platform mobile systems.'),
('Internet of Things & Embedded Systems', 'Hardware sensor networks, edge computing, smart devices, and robotics.'),
('Data Engineering & Big Data Analytics', 'Data pipelines, data warehousing, stream processing, and business intelligence.')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ---------------------------------------------------------------------
-- 3. Skill Categories Master Seed
-- ---------------------------------------------------------------------
INSERT INTO skill_categories (name) VALUES
('Programming Languages'),
('Web & Frontend Development'),
('Backend & API Development'),
('AI, ML & Data Science'),
('Cloud, DevOps & Infrastructure'),
('Databases & Storage'),
('UI/UX Design')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------
-- 4. Master Skills Seed
-- ---------------------------------------------------------------------
INSERT INTO skills (category_id, name, description) VALUES
-- Programming Languages
(1, 'Python', 'General-purpose programming for data science, scripting, and web backends.'),
(1, 'JavaScript', 'Core language of web browsers and modern full-stack web applications.'),
(1, 'TypeScript', 'Typed superset of JavaScript providing compile-time type safety.'),
(1, 'C++', 'High-performance systems programming language.'),
(1, 'Java', 'Object-oriented language for enterprise applications and Android.'),
(1, 'Go (Golang)', 'Fast, statically typed compiled language designed for concurrency.'),

-- Web & Frontend Development
(2, 'React.js', 'Declarative, component-based frontend library for single-page applications.'),
(2, 'Vue.js', 'Progressive JavaScript framework for building user interfaces.'),
(2, 'Tailwind CSS', 'Utility-first CSS framework for rapid UI styling.'),
(2, 'Next.js', 'React framework for server-side rendering and static site generation.'),

-- Backend & API Development
(3, 'Flask', 'Lightweight WSGI Python web framework.'),
(3, 'FastAPI', 'High-performance modern Python web framework for building REST APIs.'),
(3, 'Node.js / Express', 'Asynchronous event-driven JavaScript runtime and server framework.'),
(3, 'Django', 'High-level Python web framework encouraging clean design.'),

-- AI, ML & Data Science
(4, 'PyTorch', 'Open source machine learning library based on the Torch library.'),
(4, 'TensorFlow', 'End-to-end open source platform for machine learning.'),
(4, 'Scikit-Learn', 'Simple and efficient tools for predictive data analysis.'),
(4, 'OpenCV', 'Open source computer vision and machine learning software library.'),
(4, 'Natural Language Processing (NLP)', 'Text mining, tokenization, transformers, and linguistic models.'),

-- Cloud, DevOps & Infrastructure
(5, 'Docker', 'Platform for developing, shipping, and running applications in containers.'),
(5, 'Kubernetes', 'Automated container orchestration and deployment management.'),
(5, 'AWS (Amazon Web Services)', 'On-demand cloud computing platforms and APIs.'),
(5, 'CI/CD Pipelines (GitHub Actions)', 'Automated testing and deployment workflows.'),

-- Databases & Storage
(6, 'MySQL', 'Relational database management system with ACID transaction support.'),
(6, 'PostgreSQL', 'Advanced open-source relational database with strong standards compliance.'),
(6, 'MongoDB', 'Document-oriented NoSQL database for flexible data models.'),
(6, 'Redis', 'In-memory data structure store used as a database, cache, and message broker.'),

-- UI/UX Design
(7, 'Figma', 'Collaborative web-based interface design and prototyping tool.'),
(7, 'UI/UX Wireframing & Prototyping', 'Design principles, user personas, wireframing, and user testing.')
ON DUPLICATE KEY UPDATE description = VALUES(description);

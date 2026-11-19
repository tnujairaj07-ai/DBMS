from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from backend.app.extensions import db

class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('STUDENT', 'FACULTY', 'ADMIN', name='user_roles'), nullable=False, index=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)
    updated_at = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student_profile = db.relationship('StudentProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    faculty_profile = db.relationship('FacultyProfile', backref='user', uselist=False, cascade='all, delete-orphan')

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        data = {
            'user_id': self.user_id,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if self.role == 'STUDENT' and self.student_profile:
            data['student_profile'] = self.student_profile.to_dict()
        elif self.role == 'FACULTY' and self.faculty_profile:
            data['faculty_profile'] = self.faculty_profile.to_dict()
        return data


class StudentProfile(db.Model):
    __tablename__ = 'student_profiles'

    student_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, unique=True)
    roll_no = db.Column(db.String(20), nullable=False, unique=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'), nullable=False, index=True)
    full_name = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    cgpa = db.Column(db.Numeric(3, 2), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    headline = db.Column(db.String(150), nullable=True)
    github_url = db.Column(db.String(255), nullable=True)
    linkedin_url = db.Column(db.String(255), nullable=True)
    portfolio_url = db.Column(db.String(255), nullable=True)
    open_to_mentor = db.Column(db.Boolean, default=True, nullable=False)
    open_to_collaborate = db.Column(db.Boolean, default=True, nullable=False)
    avg_peer_rating = db.Column(db.Numeric(3, 2), default=0.00)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    # Relationships
    user_skills = db.relationship('UserSkill', backref='student', lazy='dynamic', cascade='all, delete-orphan')
    portfolio_projects = db.relationship('StudentProject', backref='student', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'student_id': self.student_id,
            'user_id': self.user_id,
            'roll_no': self.roll_no,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'department_code': self.department.code if self.department else None,
            'full_name': self.full_name,
            'semester': self.semester,
            'cgpa': float(self.cgpa) if self.cgpa is not None else None,
            'bio': self.bio,
            'headline': self.headline,
            'github_url': self.github_url,
            'linkedin_url': self.linkedin_url,
            'portfolio_url': self.portfolio_url,
            'open_to_mentor': bool(self.open_to_mentor) if self.open_to_mentor is not None else True,
            'open_to_collaborate': bool(self.open_to_collaborate) if self.open_to_collaborate is not None else True,
            'avg_peer_rating': float(self.avg_peer_rating) if self.avg_peer_rating is not None else 0.00
        }


class StudentProject(db.Model):
    __tablename__ = 'student_projects'

    project_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student_profiles.student_id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    tech_stack = db.Column(db.String(255), nullable=True)
    github_url = db.Column(db.String(255), nullable=False)
    live_demo_url = db.Column(db.String(255), nullable=True)
    project_type = db.Column(
        db.Enum('PERSONAL', 'ACADEMIC', 'HACKATHON', 'OPEN_SOURCE', name='student_project_type'),
        default='PERSONAL',
        nullable=False
    )
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    def to_dict(self):
        return {
            'project_id': self.project_id,
            'student_id': self.student_id,
            'title': self.title,
            'description': self.description,
            'tech_stack': self.tech_stack,
            'github_url': self.github_url,
            'live_demo_url': self.live_demo_url,
            'project_type': self.project_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class FacultyProfile(db.Model):
    __tablename__ = 'faculty_profiles'

    faculty_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, unique=True)
    employee_code = db.Column(db.String(20), nullable=False, unique=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'), nullable=False, index=True)
    full_name = db.Column(db.String(100), nullable=False)
    designation = db.Column(db.String(50), nullable=False)
    max_project_capacity = db.Column(db.Integer, nullable=False, default=3)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    def to_dict(self):
        return {
            'faculty_id': self.faculty_id,
            'user_id': self.user_id,
            'employee_code': self.employee_code,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'department_code': self.department.code if self.department else None,
            'full_name': self.full_name,
            'designation': self.designation,
            'max_project_capacity': self.max_project_capacity
        }

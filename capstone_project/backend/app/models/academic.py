from datetime import datetime
from backend.app.extensions import db

class Department(db.Model):
    __tablename__ = 'departments'

    department_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    code = db.Column(db.String(10), nullable=False, unique=True)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    # Relationships
    students = db.relationship('StudentProfile', backref='department', lazy='dynamic')
    faculty = db.relationship('FacultyProfile', backref='department', lazy='dynamic')

    def to_dict(self):
        return {
            'department_id': self.department_id,
            'name': self.name,
            'code': self.code,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ResearchDomain(db.Model):
    __tablename__ = 'research_domains'

    domain_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    def to_dict(self):
        return {
            'domain_id': self.domain_id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

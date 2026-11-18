from datetime import datetime
from backend.app.extensions import db

class SkillCategory(db.Model):
    __tablename__ = 'skill_categories'

    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    # Relationships
    skills = db.relationship('Skill', backref='category', lazy='dynamic')

    def to_dict(self):
        return {
            'category_id': self.category_id,
            'name': self.name,
            'skills_count': self.skills.count()
        }


class Skill(db.Model):
    __tablename__ = 'skills'

    skill_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_id = db.Column(db.Integer, db.ForeignKey('skill_categories.category_id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    def to_dict(self):
        return {
            'skill_id': self.skill_id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'name': self.name,
            'description': self.description
        }


class UserSkill(db.Model):
    __tablename__ = 'user_skills'

    user_skill_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student_profiles.student_id', ondelete='CASCADE'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.skill_id', ondelete='CASCADE'), nullable=False)
    skill_type = db.Column(db.Enum('OFFERED', 'WANTED', name='user_skill_types'), nullable=False)
    proficiency_level = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('student_id', 'skill_id', 'skill_type', name='uq_user_skill'),
        db.CheckConstraint('proficiency_level BETWEEN 1 AND 5', name='chk_proficiency'),
        db.Index('idx_userskills_lookup', 'skill_id', 'skill_type', 'proficiency_level')
    )

    skill = db.relationship('Skill', backref='user_skills')

    def to_dict(self):
        return {
            'user_skill_id': self.user_skill_id,
            'student_id': self.student_id,
            'skill_id': self.skill_id,
            'skill_name': self.skill.name if self.skill else None,
            'category_id': self.skill.category_id if self.skill else None,
            'category_name': self.skill.category.name if self.skill and self.skill.category else None,
            'skill_type': self.skill_type,
            'proficiency_level': self.proficiency_level
        }

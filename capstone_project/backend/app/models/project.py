from datetime import datetime
from sqlalchemy.sql import func
from backend.app.extensions import db

class ProjectIdea(db.Model):
    __tablename__ = 'project_ideas'

    idea_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    domain_id = db.Column(db.Integer, db.ForeignKey('research_domains.domain_id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    abstract = db.Column(db.Text, nullable=False)
    difficulty_level = db.Column(
        db.Enum('BEGINNER', 'INTERMEDIATE', 'ADVANCED', name='idea_difficulty'),
        default='INTERMEDIATE',
        nullable=False
    )
    status = db.Column(
        db.Enum('DRAFT', 'OPEN_FOR_MEMBERS', 'TEAM_FORMED', 'ARCHIVED', name='idea_status'),
        default='OPEN_FOR_MEMBERS',
        nullable=False
    )
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())
    updated_at = db.Column(db.TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = db.relationship('User', backref=db.backref('created_ideas', cascade='all, delete-orphan', passive_deletes=True))
    domain = db.relationship('ResearchDomain', backref='project_ideas')
    requirements = db.relationship('ProjectSkillRequirement', backref='idea', cascade='all, delete-orphan')
    teams = db.relationship('ProjectTeam', backref='idea')

    def to_dict(self, include_requirements=True):
        data = {
            'idea_id': self.idea_id,
            'created_by': self.created_by,
            'creator_email': self.creator.email if self.creator else None,
            'creator_name': (
                self.creator.student_profile.full_name
                if self.creator and self.creator.student_profile
                else (self.creator.faculty_profile.full_name if self.creator and self.creator.faculty_profile else 'Unknown')
            ),
            'domain_id': self.domain_id,
            'domain_name': self.domain.name if self.domain else None,
            'title': self.title,
            'abstract': self.abstract,
            'difficulty_level': self.difficulty_level,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_requirements:
            data['requirements'] = [r.to_dict() for r in self.requirements]
        return data


class ProjectSkillRequirement(db.Model):
    __tablename__ = 'project_skill_requirements'

    requirement_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    idea_id = db.Column(db.Integer, db.ForeignKey('project_ideas.idea_id', ondelete='CASCADE'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.skill_id', ondelete='CASCADE'), nullable=False)
    importance_level = db.Column(
        db.Enum('REQUIRED', 'NICE_TO_HAVE', name='req_importance'),
        default='REQUIRED',
        nullable=False
    )
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.UniqueConstraint('idea_id', 'skill_id', name='uq_idea_skill'),
    )

    skill = db.relationship('Skill', backref='skill_requirements')

    def to_dict(self):
        return {
            'requirement_id': self.requirement_id,
            'idea_id': self.idea_id,
            'skill_id': self.skill_id,
            'skill_name': self.skill.name if self.skill else None,
            'category_name': self.skill.category.name if self.skill and self.skill.category else None,
            'importance_level': self.importance_level
        }


class ProjectTeam(db.Model):
    __tablename__ = 'project_teams'

    team_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    idea_id = db.Column(db.Integer, db.ForeignKey('project_ideas.idea_id', ondelete='SET NULL'), nullable=True)
    team_name = db.Column(db.String(100), nullable=False, unique=True)
    leader_id = db.Column(db.Integer, db.ForeignKey('student_profiles.student_id'), nullable=False)
    max_members = db.Column(db.Integer, nullable=False, default=4)
    status = db.Column(
        db.Enum('FORMING', 'READY', 'ALLOCATED', 'COMPLETED', name='team_status'),
        default='FORMING',
        nullable=False
    )
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())
    updated_at = db.Column(db.TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        db.CheckConstraint('max_members BETWEEN 1 AND 6', name='chk_team_max_members'),
    )

    # Relationships
    leader = db.relationship('StudentProfile', foreign_keys=[leader_id], backref='led_teams')
    members = db.relationship('TeamMember', backref='team', cascade='all, delete-orphan')
    join_requests = db.relationship('TeamJoinRequest', backref='team', cascade='all, delete-orphan')

    def to_dict(self, include_members=True):
        active_members = [m for m in self.members if m.status == 'ACTIVE']
        data = {
            'team_id': self.team_id,
            'idea_id': self.idea_id,
            'idea_title': self.idea.title if self.idea else None,
            'domain_name': self.idea.domain.name if self.idea and self.idea.domain else None,
            'team_name': self.team_name,
            'leader_id': self.leader_id,
            'leader_name': self.leader.full_name if self.leader else None,
            'max_members': self.max_members,
            'current_members_count': len(active_members),
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_members:
            data['members'] = [m.to_dict() for m in active_members]
        return data


class TeamMember(db.Model):
    __tablename__ = 'team_members'

    membership_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    team_id = db.Column(db.Integer, db.ForeignKey('project_teams.team_id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('student_profiles.student_id', ondelete='CASCADE'), nullable=False)
    member_role = db.Column(db.Enum('LEADER', 'MEMBER', name='member_role'), default='MEMBER', nullable=False)
    joined_at = db.Column(db.TIMESTAMP, server_default=func.now())
    status = db.Column(db.Enum('ACTIVE', 'LEFT', name='member_status'), default='ACTIVE', nullable=False)

    __table_args__ = (
        db.UniqueConstraint('team_id', 'student_id', name='uq_team_member'),
    )

    student = db.relationship('StudentProfile', backref='team_memberships')

    def to_dict(self):
        return {
            'membership_id': self.membership_id,
            'team_id': self.team_id,
            'student_id': self.student_id,
            'user_id': self.student.user_id if self.student else None,
            'full_name': self.student.full_name if self.student else None,
            'roll_no': self.student.roll_no if self.student else None,
            'department_code': self.student.department.code if self.student and self.student.department else None,
            'member_role': self.member_role,
            'status': self.status,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None
        }


class TeamJoinRequest(db.Model):
    __tablename__ = 'team_join_requests'

    join_request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    team_id = db.Column(db.Integer, db.ForeignKey('project_teams.team_id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('student_profiles.student_id', ondelete='CASCADE'), nullable=False)
    message = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum('PENDING', 'ACCEPTED', 'REJECTED', name='join_status'), default='PENDING', nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())
    updated_at = db.Column(db.TIMESTAMP, server_default=func.now(), onupdate=func.now())

    student = db.relationship('StudentProfile', backref='join_requests')

    def to_dict(self):
        return {
            'join_request_id': self.join_request_id,
            'team_id': self.team_id,
            'student_id': self.student_id,
            'student_name': self.student.full_name if self.student else None,
            'student_roll': self.student.roll_no if self.student else None,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

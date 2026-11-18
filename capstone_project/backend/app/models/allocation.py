from datetime import datetime
from sqlalchemy.sql import func
from backend.app.extensions import db

class AllocationCycle(db.Model):
    __tablename__ = 'allocation_cycles'

    cycle_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    semester = db.Column(db.Integer, nullable=False)
    academic_year = db.Column(db.String(20), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(
        db.Enum('UPCOMING', 'OPEN', 'ALLOCATION_IN_PROGRESS', 'CLOSED', name='cycle_status'),
        default='UPCOMING',
        nullable=False
    )
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.CheckConstraint('semester BETWEEN 1 AND 12', name='chk_cycle_semester'),
        db.CheckConstraint('end_date > start_date', name='chk_cycle_dates'),
    )

    # Relationships
    proposals = db.relationship('ProjectProposal', backref='cycle', lazy='dynamic')
    allocations = db.relationship('MentorAllocation', backref='cycle', lazy='dynamic')

    def to_dict(self):
        return {
            'cycle_id': self.cycle_id,
            'name': self.name,
            'semester': self.semester,
            'academic_year': self.academic_year,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'proposals_count': self.proposals.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ProjectProposal(db.Model):
    __tablename__ = 'project_proposals'

    proposal_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    team_id = db.Column(db.Integer, db.ForeignKey('project_teams.team_id'), nullable=False, unique=True)
    cycle_id = db.Column(db.Integer, db.ForeignKey('allocation_cycles.cycle_id'), nullable=False)
    domain_id = db.Column(db.Integer, db.ForeignKey('research_domains.domain_id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    problem_statement = db.Column(db.Text, nullable=False)
    objectives = db.Column(db.Text, nullable=False)
    status = db.Column(
        db.Enum('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ALLOCATED', 'REJECTED', name='proposal_status'),
        default='SUBMITTED',
        nullable=False
    )
    submitted_at = db.Column(db.TIMESTAMP, server_default=func.now())
    updated_at = db.Column(db.TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    team = db.relationship('ProjectTeam', backref=db.backref('proposal', uselist=False))
    domain = db.relationship('ResearchDomain', backref='proposals')
    preferences = db.relationship('MentorPreference', backref='proposal', cascade='all, delete-orphan', order_by='MentorPreference.preference_rank')
    recommendations = db.relationship('MentorRecommendation', backref='proposal', cascade='all, delete-orphan', order_by='MentorRecommendation.rank_order')
    allocation = db.relationship('MentorAllocation', backref='proposal', uselist=False)
    milestones = db.relationship('ProjectMilestone', backref='proposal', cascade='all, delete-orphan')

    def to_dict(self, include_details=True):
        data = {
            'proposal_id': self.proposal_id,
            'team_id': self.team_id,
            'team_name': self.team.team_name if self.team else None,
            'leader_name': self.team.leader.full_name if self.team and self.team.leader else None,
            'cycle_id': self.cycle_id,
            'cycle_name': self.cycle.name if self.cycle else None,
            'domain_id': self.domain_id,
            'domain_name': self.domain.name if self.domain else None,
            'title': self.title,
            'problem_statement': self.problem_statement,
            'objectives': self.objectives,
            'status': self.status,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }
        if include_details:
            data['preferences'] = [p.to_dict() for p in self.preferences]
            if self.allocation:
                data['allocation'] = self.allocation.to_dict()
        return data


class FacultyExpertise(db.Model):
    __tablename__ = 'faculty_expertise'

    expertise_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty_profiles.faculty_id', ondelete='CASCADE'), nullable=False)
    domain_id = db.Column(db.Integer, db.ForeignKey('research_domains.domain_id'), nullable=False)
    expertise_level = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.UniqueConstraint('faculty_id', 'domain_id', name='uq_faculty_domain'),
        db.CheckConstraint('expertise_level BETWEEN 1 AND 5', name='chk_faculty_exp_level'),
    )

    faculty = db.relationship('FacultyProfile', backref=db.backref('domain_expertises', cascade='all, delete-orphan', passive_deletes=True))
    domain = db.relationship('ResearchDomain', backref='expert_faculty')

    def to_dict(self):
        return {
            'expertise_id': self.expertise_id,
            'faculty_id': self.faculty_id,
            'faculty_name': self.faculty.full_name if self.faculty else None,
            'domain_id': self.domain_id,
            'domain_name': self.domain.name if self.domain else None,
            'expertise_level': self.expertise_level
        }


class FacultySkillExpertise(db.Model):
    __tablename__ = 'faculty_skill_expertise'

    fse_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty_profiles.faculty_id', ondelete='CASCADE'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.skill_id'), nullable=False)
    proficiency_level = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.UniqueConstraint('faculty_id', 'skill_id', name='uq_faculty_skill'),
        db.CheckConstraint('proficiency_level BETWEEN 1 AND 5', name='chk_facskill_level'),
    )

    faculty = db.relationship('FacultyProfile', backref=db.backref('skill_expertises', cascade='all, delete-orphan', passive_deletes=True))
    skill = db.relationship('Skill', backref='expert_faculty')

    def to_dict(self):
        return {
            'fse_id': self.fse_id,
            'faculty_id': self.faculty_id,
            'skill_id': self.skill_id,
            'skill_name': self.skill.name if self.skill else None,
            'category_name': self.skill.category.name if self.skill and self.skill.category else None,
            'proficiency_level': self.proficiency_level
        }


class MentorPreference(db.Model):
    __tablename__ = 'mentor_preferences'

    preference_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey('project_proposals.proposal_id', ondelete='CASCADE'), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty_profiles.faculty_id', ondelete='CASCADE'), nullable=False)
    preference_rank = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.UniqueConstraint('proposal_id', 'preference_rank', name='uq_proposal_rank'),
        db.UniqueConstraint('proposal_id', 'faculty_id', name='uq_proposal_faculty'),
        db.CheckConstraint('preference_rank BETWEEN 1 AND 5', name='chk_pref_rank'),
    )

    faculty = db.relationship('FacultyProfile', backref=db.backref('team_preferences', cascade='all, delete-orphan', passive_deletes=True))

    def to_dict(self):
        return {
            'preference_id': self.preference_id,
            'proposal_id': self.proposal_id,
            'faculty_id': self.faculty_id,
            'faculty_name': self.faculty.full_name if self.faculty else None,
            'designation': self.faculty.designation if self.faculty else None,
            'preference_rank': self.preference_rank
        }


class MentorRecommendation(db.Model):
    __tablename__ = 'mentor_recommendations'

    recommendation_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey('project_proposals.proposal_id', ondelete='CASCADE'), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty_profiles.faculty_id', ondelete='CASCADE'), nullable=False)
    match_score = db.Column(db.Numeric(5, 2), nullable=False)
    rank_order = db.Column(db.Integer, nullable=False)
    score_breakdown = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.CheckConstraint('match_score BETWEEN 0.00 AND 100.00', name='chk_rec_score'),
    )

    faculty = db.relationship('FacultyProfile', backref=db.backref('recommendations', cascade='all, delete-orphan', passive_deletes=True))

    def to_dict(self):
        return {
            'recommendation_id': self.recommendation_id,
            'proposal_id': self.proposal_id,
            'faculty_id': self.faculty_id,
            'faculty_name': self.faculty.full_name if self.faculty else None,
            'designation': self.faculty.designation if self.faculty else None,
            'match_score': float(self.match_score) if self.match_score is not None else 0.0,
            'rank_order': self.rank_order,
            'score_breakdown': self.score_breakdown,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class MentorAllocation(db.Model):
    __tablename__ = 'mentor_allocations'

    allocation_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey('project_proposals.proposal_id'), nullable=False, unique=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty_profiles.faculty_id'), nullable=False)
    cycle_id = db.Column(db.Integer, db.ForeignKey('allocation_cycles.cycle_id'), nullable=False)
    status = db.Column(
        db.Enum('ACTIVE', 'COMPLETED', 'REVOKED', name='allocation_status'),
        default='ACTIVE',
        nullable=False
    )
    allocated_at = db.Column(db.TIMESTAMP, server_default=func.now())
    allocated_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)

    faculty = db.relationship('FacultyProfile', backref=db.backref('allocations', cascade='all, delete-orphan', passive_deletes=True))
    admin = db.relationship('User', foreign_keys=[allocated_by], backref=db.backref('approved_allocations', cascade='all, delete-orphan', passive_deletes=True))
    audit_logs = db.relationship('AllocationAuditLog', backref='allocation', cascade='all, delete-orphan', order_by='desc(AllocationAuditLog.created_at)')

    def to_dict(self):
        return {
            'allocation_id': self.allocation_id,
            'proposal_id': self.proposal_id,
            'proposal_title': self.proposal.title if self.proposal else None,
            'team_name': self.proposal.team.team_name if self.proposal and self.proposal.team else None,
            'faculty_id': self.faculty_id,
            'faculty_name': self.faculty.full_name if self.faculty else None,
            'designation': self.faculty.designation if self.faculty else None,
            'cycle_id': self.cycle_id,
            'cycle_name': self.cycle.name if self.cycle else None,
            'status': self.status,
            'allocated_at': self.allocated_at.isoformat() if self.allocated_at else None
        }


class AllocationAuditLog(db.Model):
    __tablename__ = 'allocation_audit_logs'

    log_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    allocation_id = db.Column(db.Integer, db.ForeignKey('mentor_allocations.allocation_id', ondelete='CASCADE'), nullable=False)
    action = db.Column(
        db.Enum('ASSIGNED', 'REASSIGNED', 'REVOKED', name='audit_action'),
        nullable=False
    )
    performed_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    admin_user = db.relationship('User', foreign_keys=[performed_by])

    def to_dict(self):
        return {
            'log_id': self.log_id,
            'allocation_id': self.allocation_id,
            'action': self.action,
            'performed_by': self.performed_by,
            'performed_by_email': self.admin_user.email if self.admin_user else None,
            'reason': self.reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

from sqlalchemy.sql import func
from backend.app.extensions import db


class MilestoneTemplate(db.Model):
    __tablename__ = 'milestone_templates'

    template_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    sequence_no = db.Column(db.Integer, nullable=False, unique=True)
    weightage_percent = db.Column(db.Integer, nullable=False)
    default_days_from_start = db.Column(db.Integer, nullable=False, default=14)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.CheckConstraint('weightage_percent BETWEEN 1 AND 100', name='chk_template_weightage'),
    )

    def to_dict(self):
        return {
            'template_id': self.template_id,
            'name': self.name,
            'sequence_no': self.sequence_no,
            'weightage_percent': self.weightage_percent,
            'default_days_from_start': self.default_days_from_start,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ProjectMilestone(db.Model):
    __tablename__ = 'project_milestones'

    milestone_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    proposal_id = db.Column(db.Integer, db.ForeignKey('project_proposals.proposal_id', ondelete='CASCADE'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('milestone_templates.template_id'), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    status = db.Column(
        db.Enum('PENDING', 'SUBMITTED', 'APPROVED', 'REVISIONS_REQUIRED', 'OVERDUE', name='milestone_status'),
        default='PENDING',
        nullable=False
    )
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.UniqueConstraint('proposal_id', 'template_id', name='uq_proposal_template'),
    )

    template = db.relationship('MilestoneTemplate', backref='project_milestones')
    submissions = db.relationship(
        'MilestoneSubmission',
        backref='milestone',
        cascade='all, delete-orphan',
        order_by='desc(MilestoneSubmission.submitted_at)'
    )

    def to_dict(self, include_submissions=False):
        data = {
            'milestone_id': self.milestone_id,
            'proposal_id': self.proposal_id,
            'template_id': self.template_id,
            'name': self.template.name if self.template else None,
            'sequence_no': self.template.sequence_no if self.template else None,
            'weightage_percent': self.template.weightage_percent if self.template else 0,
            'description': self.template.description if self.template else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'submission_count': len(self.submissions)
        }

        # Latest submission and feedback if available
        if self.submissions:
            latest = self.submissions[0]
            data['latest_submission'] = latest.to_dict(include_feedback=True)
        else:
            data['latest_submission'] = None

        if include_submissions:
            data['submissions'] = [s.to_dict(include_feedback=True) for s in self.submissions]

        return data


class MilestoneSubmission(db.Model):
    __tablename__ = 'milestone_submissions'

    submission_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    milestone_id = db.Column(db.Integer, db.ForeignKey('project_milestones.milestone_id', ondelete='CASCADE'), nullable=False)
    version_no = db.Column(db.Integer, nullable=False, default=1)
    submitted_by = db.Column(db.Integer, db.ForeignKey('student_profiles.student_id'), nullable=False)
    file_url = db.Column(db.String(255), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    submitted_at = db.Column(db.TIMESTAMP, server_default=func.now())

    student = db.relationship('StudentProfile', backref=db.backref('milestone_submissions', cascade='all, delete-orphan', passive_deletes=True))
    feedback = db.relationship('FacultyFeedback', backref='submission', uselist=False, cascade='all, delete-orphan')

    def to_dict(self, include_feedback=True):
        data = {
            'submission_id': self.submission_id,
            'milestone_id': self.milestone_id,
            'version_no': self.version_no,
            'submitted_by': self.submitted_by,
            'student_name': self.student.full_name if self.student else None,
            'file_url': self.file_url,
            'notes': self.notes,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }
        if include_feedback:
            data['feedback'] = self.feedback.to_dict() if self.feedback else None
        return data


class FacultyFeedback(db.Model):
    __tablename__ = 'faculty_feedback'

    feedback_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('milestone_submissions.submission_id', ondelete='CASCADE'), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty_profiles.faculty_id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    comments = db.Column(db.Text, nullable=False)
    decision = db.Column(
        db.Enum('APPROVED', 'CHANGES_REQUESTED', name='feedback_decision'),
        nullable=False
    )
    reviewed_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.CheckConstraint('score BETWEEN 0 AND 100', name='chk_feedback_score'),
    )

    faculty = db.relationship('FacultyProfile', backref=db.backref('given_feedbacks', cascade='all, delete-orphan', passive_deletes=True))

    def to_dict(self):
        return {
            'feedback_id': self.feedback_id,
            'submission_id': self.submission_id,
            'faculty_id': self.faculty_id,
            'faculty_name': self.faculty.full_name if self.faculty else None,
            'designation': self.faculty.designation if self.faculty else None,
            'score': self.score,
            'comments': self.comments,
            'decision': self.decision,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None
        }

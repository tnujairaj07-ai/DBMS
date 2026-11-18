from sqlalchemy.sql import func
from backend.app.extensions import db


class AvailabilitySlot(db.Model):
    __tablename__ = 'availability_slots'

    slot_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    day_of_week = db.Column(
        db.Enum('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY', name='day_of_week_enum'),
        nullable=False
    )
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.CheckConstraint('end_time > start_time', name='chk_slot_time'),
    )

    user = db.relationship('User', backref=db.backref('availability_slots', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'slot_id': self.slot_id,
            'user_id': self.user_id,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class PeerRequest(db.Model):
    __tablename__ = 'peer_requests'

    request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    requester_id = db.Column(db.Integer, db.ForeignKey('student_profiles.student_id', ondelete='CASCADE'), nullable=False)
    peer_mentor_id = db.Column(db.Integer, db.ForeignKey('student_profiles.student_id', ondelete='CASCADE'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skills.skill_id'), nullable=False)
    message = db.Column(db.Text, nullable=True)
    status = db.Column(
        db.Enum('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', name='peer_request_status'),
        default='PENDING',
        nullable=False
    )
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.CheckConstraint('requester_id != peer_mentor_id', name='chk_peer_not_self'),
    )

    requester = db.relationship('StudentProfile', foreign_keys=[requester_id], backref=db.backref('sent_peer_requests', cascade='all, delete-orphan', passive_deletes=True))
    peer_mentor = db.relationship('StudentProfile', foreign_keys=[peer_mentor_id], backref=db.backref('received_peer_requests', cascade='all, delete-orphan', passive_deletes=True))
    skill = db.relationship('Skill', backref='peer_requests')
    session = db.relationship('PeerSession', backref='request', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'request_id': self.request_id,
            'requester_id': self.requester_id,
            'requester_name': self.requester.full_name if self.requester else None,
            'peer_mentor_id': self.peer_mentor_id,
            'peer_mentor_name': self.peer_mentor.full_name if self.peer_mentor else None,
            'peer_mentor_rating': float(self.peer_mentor.avg_peer_rating) if self.peer_mentor and self.peer_mentor.avg_peer_rating else 0.0,
            'skill_id': self.skill_id,
            'skill_name': self.skill.name if self.skill else None,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'session': self.session.to_dict() if self.session else None
        }


class PeerSession(db.Model):
    __tablename__ = 'peer_sessions'

    session_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_id = db.Column(db.Integer, db.ForeignKey('peer_requests.request_id', ondelete='CASCADE'), nullable=False, unique=True)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    meeting_link = db.Column(db.String(255), nullable=True)
    status = db.Column(
        db.Enum('SCHEDULED', 'COMPLETED', 'CANCELLED', name='peer_session_status'),
        default='SCHEDULED',
        nullable=False
    )
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    review = db.relationship('SessionReview', backref='session', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'session_id': self.session_id,
            'request_id': self.request_id,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'meeting_link': self.meeting_link,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'review': self.review.to_dict() if self.review else None
        }


class SessionReview(db.Model):
    __tablename__ = 'session_reviews'

    review_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.Integer, db.ForeignKey('peer_sessions.session_id', ondelete='CASCADE'), nullable=False, unique=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('student_profiles.student_id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    feedback = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    __table_args__ = (
        db.CheckConstraint('rating BETWEEN 1 AND 5', name='chk_review_rating'),
    )

    reviewer = db.relationship('StudentProfile', backref=db.backref('given_peer_reviews', cascade='all, delete-orphan', passive_deletes=True))

    def to_dict(self):
        return {
            'review_id': self.review_id,
            'session_id': self.session_id,
            'reviewer_id': self.reviewer_id,
            'reviewer_name': self.reviewer.full_name if self.reviewer else None,
            'rating': self.rating,
            'feedback': self.feedback,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ConsultationMeeting(db.Model):
    __tablename__ = 'consultation_meetings'

    meeting_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    allocation_id = db.Column(db.Integer, db.ForeignKey('mentor_allocations.allocation_id', ondelete='CASCADE'), nullable=False)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    mode = db.Column(
        db.Enum('OFFLINE', 'ONLINE', name='meeting_mode'),
        default='OFFLINE',
        nullable=False
    )
    location_or_link = db.Column(db.String(255), nullable=True)
    status = db.Column(
        db.Enum('SCHEDULED', 'COMPLETED', 'CANCELLED', name='meeting_status'),
        default='SCHEDULED',
        nullable=False
    )
    agenda = db.Column(db.Text, nullable=False)
    minutes_of_meeting = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    allocation = db.relationship('MentorAllocation', backref=db.backref('consultations', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'meeting_id': self.meeting_id,
            'allocation_id': self.allocation_id,
            'proposal_title': self.allocation.proposal.title if self.allocation and self.allocation.proposal else None,
            'team_name': self.allocation.proposal.team.team_name if self.allocation and self.allocation.proposal and self.allocation.proposal.team else None,
            'faculty_name': self.allocation.faculty.full_name if self.allocation and self.allocation.faculty else None,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'mode': self.mode,
            'location_or_link': self.location_or_link,
            'status': self.status,
            'agenda': self.agenda,
            'minutes_of_meeting': self.minutes_of_meeting,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    notification_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())

    user = db.relationship('User', backref=db.backref('notifications', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'notification_id': self.notification_id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

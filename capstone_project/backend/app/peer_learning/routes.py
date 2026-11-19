from datetime import datetime, date, time
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from backend.app.extensions import db
from backend.app.models.user import User, StudentProfile, FacultyProfile
from backend.app.models.skill import Skill, UserSkill
from backend.app.models.project import ProjectTeam, TeamMember
from backend.app.models.allocation import ProjectProposal, MentorAllocation
from backend.app.models.peer_learning import (
    AvailabilitySlot,
    PeerRequest,
    PeerSession,
    SessionReview,
    ConsultationMeeting,
    Notification
)
from backend.app.utils.decorators import role_required
from backend.app.utils.responses import success_response, error_response

peer_learning_bp = Blueprint('peer_learning', __name__, url_prefix='/api/peer')


# ---------------------------------------------------------------------
# 1. Peer Mentors Directory (vw_peer_mentor_rankings)
# ---------------------------------------------------------------------

@peer_learning_bp.route('/mentors', methods=['GET'])
def get_peer_mentors():
    """
    Returns ranked peer mentors. Queries MySQL view `vw_peer_mentor_rankings`
    with optional filtering by skill name or search term.
    """
    skill_filter = request.args.get('skill', '').strip()
    search = request.args.get('search', '').strip()

    try:
        sql = """
            SELECT v.*, sp.user_id
            FROM vw_peer_mentor_rankings v
            JOIN student_profiles sp ON v.student_id = sp.student_id
            WHERE 1=1
        """
        params = {}

        if skill_filter:
            sql += " AND v.offered_skills LIKE :skill"
            params['skill'] = f"%{skill_filter}%"

        if search:
            sql += " AND (v.full_name LIKE :search OR v.roll_no LIKE :search OR v.department_name LIKE :search OR v.offered_skills LIKE :search)"
            params['search'] = f"%{search}%"

        sql += " ORDER BY v.avg_peer_rating DESC, v.total_sessions_completed DESC;"
        result = db.session.execute(text(sql), params).mappings().all()

        records = [dict(r) for r in result]
        return success_response(records)
    except Exception as e:
        return error_response(f"Failed to fetch peer mentors: {str(e)}", 500)


# ---------------------------------------------------------------------
# 2. Peer Learning Requests Workflow
# ---------------------------------------------------------------------

@peer_learning_bp.route('/requests', methods=['POST'])
@jwt_required()
@role_required('STUDENT')
def create_peer_request():
    """Student requests a 1-on-1 guidance session from a peer mentor for a specific skill."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    requester = user.student_profile if user else None

    if not requester:
        return error_response("Student profile not found.", 404)

    data = request.get_json() or {}
    peer_mentor_id = data.get('peer_mentor_id')
    skill_id = data.get('skill_id')
    message = data.get('message', '').strip()

    if not peer_mentor_id or not skill_id:
        return error_response("peer_mentor_id and skill_id are required.", 400)

    if requester.student_id == int(peer_mentor_id):
        return error_response("You cannot request a peer mentoring session with yourself.", 400)

    mentor = db.session.get(StudentProfile, peer_mentor_id)
    if not mentor:
        return error_response("Peer mentor not found.", 404)

    skill = db.session.get(Skill, skill_id)
    if not skill:
        return error_response("Skill not found.", 404)

    # Verify mentor actually offers this skill
    offers_skill = UserSkill.query.filter_by(
        student_id=peer_mentor_id,
        skill_id=skill_id,
        skill_type='OFFERED'
    ).first()
    if not offers_skill:
        return error_response("Selected peer mentor does not offer this skill.", 400)

    try:
        req = PeerRequest(
            requester_id=requester.student_id,
            peer_mentor_id=peer_mentor_id,
            skill_id=skill_id,
            message=message,
            status='PENDING'
        )
        db.session.add(req)

        # Create in-app notification for the mentor
        notif = Notification(
            user_id=mentor.user_id,
            type='PEER_REQUEST',
            title='New Peer Learning Request',
            message=f"{requester.full_name} requested guidance in {skill.name}."
        )
        db.session.add(notif)

        db.session.commit()
        return success_response(req.to_dict(), "Peer learning request sent successfully.", 201)

    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to create peer request: {str(e)}", 500)


@peer_learning_bp.route('/requests/my-requests', methods=['GET'])
@jwt_required()
@role_required('STUDENT')
def get_my_peer_requests():
    """Retrieve requests sent and received by the logged-in student."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    student = user.student_profile if user else None

    if not student:
        return error_response("Student profile not found.", 404)

    sent = PeerRequest.query.filter_by(requester_id=student.student_id).order_by(PeerRequest.created_at.desc()).all()
    received = PeerRequest.query.filter_by(peer_mentor_id=student.student_id).order_by(PeerRequest.created_at.desc()).all()

    return success_response({
        'sent': [r.to_dict() for r in sent],
        'received': [r.to_dict() for r in received]
    })


@peer_learning_bp.route('/requests/<int:request_id>/respond', methods=['POST'])
@jwt_required()
@role_required('STUDENT')
def respond_peer_request(request_id):
    """Peer mentor accepts or declines a mentoring request. If accepted, schedules a session."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    student = user.student_profile if user else None

    req = db.session.get(PeerRequest, request_id)
    if not req:
        return error_response("Request not found.", 404)

    if req.peer_mentor_id != student.student_id:
        return error_response("Only the recipient peer mentor can respond to this request.", 403)

    if req.status != 'PENDING':
        return error_response(f"Request is already {req.status}.", 400)

    data = request.get_json() or {}
    action = data.get('action', '').upper()  # 'ACCEPT' | 'DECLINE'
    scheduled_at_str = data.get('scheduled_at')
    meeting_link = data.get('meeting_link', '').strip()

    if action not in ('ACCEPT', 'DECLINE'):
        return error_response("action must be 'ACCEPT' or 'DECLINE'.", 400)

    try:
        if action == 'DECLINE':
            req.status = 'DECLINED'
            db.session.commit()
            return success_response(req.to_dict(), "Peer request declined.")

        # ACCEPT -> Create scheduled PeerSession
        req.status = 'ACCEPTED'

        if scheduled_at_str:
            try:
                scheduled_at = datetime.fromisoformat(scheduled_at_str.replace('Z', '+00:00'))
            except Exception:
                scheduled_at = datetime.now()
        else:
            scheduled_at = datetime.now()

        session = PeerSession(
            request_id=req.request_id,
            scheduled_at=scheduled_at,
            meeting_link=meeting_link or 'https://meet.google.com/learnlink-session',
            status='SCHEDULED'
        )
        db.session.add(session)

        # Notify requester
        notif = Notification(
            user_id=req.requester.user_id,
            type='PEER_ACCEPTED',
            title='Peer Request Accepted',
            message=f"{student.full_name} accepted your session for {req.skill.name}!"
        )
        db.session.add(notif)

        db.session.commit()
        return success_response(req.to_dict(), "Peer request accepted and session scheduled.", 201)

    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to respond to request: {str(e)}", 500)


# ---------------------------------------------------------------------
# 3. Peer Learning Sessions & Star Rating Reviews
# ---------------------------------------------------------------------

@peer_learning_bp.route('/sessions/my-sessions', methods=['GET'])
@jwt_required()
@role_required('STUDENT')
def get_my_peer_sessions():
    """Returns all scheduled, completed, and pending review sessions for the student."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    student = user.student_profile if user else None

    if not student:
        return error_response("Student profile not found.", 404)

    # Sessions where user is requester or mentor
    sessions = (
        PeerSession.query
        .join(PeerRequest)
        .filter((PeerRequest.requester_id == student.student_id) | (PeerRequest.peer_mentor_id == student.student_id))
        .order_by(PeerSession.scheduled_at.desc())
        .all()
    )

    results = []
    for s in sessions:
        s_data = s.to_dict()
        s_data['skill_name'] = s.request.skill.name if s.request.skill else None
        s_data['requester_id'] = s.request.requester_id
        s_data['requester_name'] = s.request.requester.full_name
        s_data['peer_mentor_id'] = s.request.peer_mentor_id
        s_data['peer_mentor_name'] = s.request.peer_mentor.full_name
        s_data['is_requester'] = (s.request.requester_id == student.student_id)
        results.append(s_data)

    return success_response(results)


@peer_learning_bp.route('/sessions/<int:session_id>/review', methods=['POST'])
@jwt_required()
@role_required('STUDENT')
def review_peer_session(session_id):
    """
    Student submits star rating (1-5) and feedback for a completed peer session.
    Database trigger `trg_recalculate_peer_rating` automatically recalculates mentor's average rating.
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    student = user.student_profile if user else None

    session = db.session.get(PeerSession, session_id)
    if not session:
        return error_response("Session not found.", 404)

    if session.request.requester_id != student.student_id:
        return error_response("Only the student learner who requested the session can submit a review.", 403)

    if session.review:
        return error_response("You have already reviewed this session.", 400)

    data = request.get_json() or {}
    rating = data.get('rating')
    feedback = data.get('feedback', '').strip()

    if rating is None:
        return error_response("Rating is required.", 400)

    try:
        rating = int(rating)
        if not (1 <= rating <= 5):
            return error_response("Rating must be between 1 and 5 stars.", 400)
    except ValueError:
        return error_response("Rating must be a valid integer.", 400)

    try:
        rev = SessionReview(
            session_id=session_id,
            reviewer_id=student.student_id,
            rating=rating,
            feedback=feedback
        )
        db.session.add(rev)
        db.session.commit()

        # Reload peer mentor to fetch trigger-updated avg_peer_rating
        db.session.refresh(session.request.peer_mentor)
        new_rating = float(session.request.peer_mentor.avg_peer_rating or 0.0)

        return success_response({
            'review': rev.to_dict(),
            'updated_mentor_rating': new_rating
        }, "Session review submitted successfully! Mentor rating recalculated via trigger.", 201)

    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to submit review: {str(e)}", 500)


# ---------------------------------------------------------------------
# 4. Supervisor Consultation Meetings
# ---------------------------------------------------------------------

consultations_bp = Blueprint('consultations', __name__, url_prefix='/api/consultations')


@consultations_bp.route('/my-consultations', methods=['GET'])
@jwt_required()
def get_my_consultations():
    """Retrieve consultation meetings for the current user (faculty or student team member)."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    query = ConsultationMeeting.query.join(MentorAllocation)

    if user.role == 'FACULTY' and user.faculty_profile:
        query = query.filter(MentorAllocation.faculty_id == user.faculty_profile.faculty_id)
    elif user.role == 'STUDENT' and user.student_profile:
        # Consultations for projects where student is a member of the team
        query = (
            query
            .join(ProjectProposal, MentorAllocation.proposal_id == ProjectProposal.proposal_id)
            .join(ProjectTeam, ProjectProposal.team_id == ProjectTeam.team_id)
            .join(TeamMember, ProjectTeam.team_id == TeamMember.team_id)
            .filter(TeamMember.student_id == user.student_profile.student_id, TeamMember.status == 'ACTIVE')
        )

    meetings = query.order_by(ConsultationMeeting.scheduled_at.desc()).all()
    return success_response([m.to_dict() for m in meetings])


@consultations_bp.route('/schedule', methods=['POST'])
@jwt_required()
def schedule_consultation():
    """Book a new supervisor consultation meeting for an allocated project."""
    data = request.get_json() or {}
    allocation_id = data.get('allocation_id')
    scheduled_at_str = data.get('scheduled_at')
    mode = data.get('mode', 'OFFLINE').upper()
    location_or_link = data.get('location_or_link', '').strip()
    agenda = data.get('agenda', '').strip()

    if not allocation_id or not scheduled_at_str or not agenda:
        return error_response("allocation_id, scheduled_at, and agenda are required.", 400)

    alloc = db.session.get(MentorAllocation, allocation_id)
    if not alloc or alloc.status != 'ACTIVE':
        return error_response("Active mentor allocation not found.", 404)

    try:
        scheduled_at = datetime.fromisoformat(scheduled_at_str.replace('Z', '+00:00'))
    except Exception:
        return error_response("Invalid scheduled_at datetime format.", 400)

    try:
        meeting = ConsultationMeeting(
            allocation_id=allocation_id,
            scheduled_at=scheduled_at,
            mode=mode if mode in ('ONLINE', 'OFFLINE') else 'OFFLINE',
            location_or_link=location_or_link,
            agenda=agenda,
            status='SCHEDULED'
        )
        db.session.add(meeting)
        db.session.commit()
        return success_response(meeting.to_dict(), "Consultation meeting scheduled.", 201)
    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to schedule consultation: {str(e)}", 500)


@consultations_bp.route('/<int:meeting_id>/complete', methods=['POST'])
@jwt_required()
def complete_consultation(meeting_id):
    """Record minutes of meeting and mark consultation as completed."""
    meeting = db.session.get(ConsultationMeeting, meeting_id)
    if not meeting:
        return error_response("Meeting not found.", 404)

    data = request.get_json() or {}
    minutes = data.get('minutes_of_meeting', '').strip()

    try:
        meeting.status = 'COMPLETED'
        meeting.minutes_of_meeting = minutes
        db.session.commit()
        return success_response(meeting.to_dict(), "Consultation marked as completed.")
    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to update consultation: {str(e)}", 500)


# ---------------------------------------------------------------------
# 5. Executive Department Analytics Dashboard (vw_department_analytics)
# ---------------------------------------------------------------------

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@reports_bp.route('/department-analytics', methods=['GET'])
def get_department_analytics():
    """Executive metrics view aggregating students, faculty, proposals, allocation rate, and progress."""
    try:
        sql = "SELECT * FROM vw_department_analytics ORDER BY total_students DESC;"
        result = db.session.execute(text(sql)).mappings().all()
        records = [dict(r) for r in result]
        return success_response(records)
    except Exception as e:
        return error_response(f"Failed to fetch executive analytics: {str(e)}", 500)

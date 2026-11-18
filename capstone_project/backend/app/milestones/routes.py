from datetime import date, datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from backend.app.extensions import db
from backend.app.models.user import User, StudentProfile, FacultyProfile
from backend.app.models.project import ProjectTeam, TeamMember
from backend.app.models.allocation import ProjectProposal, MentorAllocation
from backend.app.models.milestone import (
    MilestoneTemplate,
    ProjectMilestone,
    MilestoneSubmission,
    FacultyFeedback
)
from backend.app.utils.decorators import role_required
from backend.app.utils.responses import success_response, error_response

milestones_bp = Blueprint('milestones', __name__, url_prefix='/api/milestones')


# ---------------------------------------------------------------------
# 1. Milestone Templates (Departmental Blueprints)
# ---------------------------------------------------------------------

@milestones_bp.route('/templates', methods=['GET'])
def get_templates():
    """Retrieve list of all active milestone templates ordered by sequence number."""
    templates = MilestoneTemplate.query.order_by(MilestoneTemplate.sequence_no.asc()).all()
    return success_response([t.to_dict() for t in templates])


@milestones_bp.route('/templates', methods=['POST'])
@jwt_required()
@role_required('ADMIN')
def create_template():
    """Admin creates a new standard milestone template."""
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    seq = data.get('sequence_no')
    weight = data.get('weightage_percent')
    days = data.get('default_days_from_start', 14)
    desc = data.get('description', '').strip()

    if not name or seq is None or weight is None:
        return error_response("Name, sequence_no, and weightage_percent are required.", 400)

    try:
        seq = int(seq)
        weight = int(weight)
        days = int(days)
        if not (1 <= weight <= 100):
            return error_response("Weightage must be between 1% and 100%.", 400)
    except ValueError:
        return error_response("Sequence, weightage, and default days must be valid numbers.", 400)

    if MilestoneTemplate.query.filter_by(name=name).first():
        return error_response("A template with this name already exists.", 400)
    if MilestoneTemplate.query.filter_by(sequence_no=seq).first():
        return error_response("A template with this sequence number already exists.", 400)

    try:
        tpl = MilestoneTemplate(
            name=name,
            sequence_no=seq,
            weightage_percent=weight,
            default_days_from_start=days,
            description=desc
        )
        db.session.add(tpl)
        db.session.commit()
        return success_response(tpl.to_dict(), "Milestone template created.", 201)
    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to create template: {str(e)}", 500)


# ---------------------------------------------------------------------
# 2. Project Milestones Timeline & Status
# ---------------------------------------------------------------------

@milestones_bp.route('/projects/<int:proposal_id>', methods=['GET'])
def get_project_milestones(proposal_id):
    """Retrieve full milestone timeline, submissions, and feedback for a project proposal."""
    proposal = db.session.get(ProjectProposal, proposal_id)
    if not proposal:
        return error_response("Project proposal not found.", 404)

    milestones = (
        ProjectMilestone.query
        .filter_by(proposal_id=proposal_id)
        .join(MilestoneTemplate)
        .order_by(MilestoneTemplate.sequence_no.asc())
        .all()
    )

    today = date.today()
    results = []
    total_weight = 0
    completed_weight = 0

    for m in milestones:
        m_dict = m.to_dict(include_submissions=True)
        is_overdue = (m.due_date < today) and (m.status != 'APPROVED')
        m_dict['is_overdue'] = is_overdue
        total_weight += m_dict['weightage_percent']
        if m.status == 'APPROVED':
            completed_weight += m_dict['weightage_percent']
        results.append(m_dict)

    progress_percent = round((completed_weight / total_weight) * 100, 2) if total_weight > 0 else 0.0

    return success_response({
        'proposal_id': proposal.proposal_id,
        'title': proposal.title,
        'team_name': proposal.team.team_name if proposal.team else None,
        'allocation': proposal.allocation.to_dict() if proposal.allocation else None,
        'progress_percent': progress_percent,
        'total_weight': total_weight,
        'completed_weight': completed_weight,
        'milestones': results
    })


@milestones_bp.route('/projects/<int:proposal_id>/initialize', methods=['POST'])
@jwt_required()
def initialize_project_milestones(proposal_id):
    """Initializes standard milestones for an allocated project if not already present."""
    proposal = db.session.get(ProjectProposal, proposal_id)
    if not proposal:
        return error_response("Proposal not found.", 404)

    templates = MilestoneTemplate.query.order_by(MilestoneTemplate.sequence_no.asc()).all()
    if not templates:
        return error_response("No milestone templates configured in the system.", 400)

    created_count = 0
    try:
        today = date.today()
        for tpl in templates:
            existing = ProjectMilestone.query.filter_by(proposal_id=proposal_id, template_id=tpl.template_id).first()
            if not existing:
                due = today.fromordinal(today.toordinal() + tpl.default_days_from_start)
                pm = ProjectMilestone(
                    proposal_id=proposal_id,
                    template_id=tpl.template_id,
                    due_date=due,
                    status='PENDING'
                )
                db.session.add(pm)
                created_count += 1
        db.session.commit()
        return success_response({'initialized_count': created_count}, f"Initialized {created_count} milestones.")
    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to initialize milestones: {str(e)}", 500)


# ---------------------------------------------------------------------
# 3. Student Milestone Submissions
# ---------------------------------------------------------------------

@milestones_bp.route('/<int:milestone_id>/submit', methods=['POST'])
@jwt_required()
@role_required('STUDENT')
def submit_milestone(milestone_id):
    """
    Active team student submits a deliverable for a project milestone.
    Database trigger `trg_milestone_submitted` automatically transitions status to SUBMITTED.
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    student = user.student_profile if user else None

    if not student:
        return error_response("Student profile not found.", 404)

    milestone = db.session.get(ProjectMilestone, milestone_id)
    if not milestone:
        return error_response("Milestone not found.", 404)

    # Verify student is a member of the project team
    proposal = milestone.proposal
    membership = TeamMember.query.filter_by(
        team_id=proposal.team_id,
        student_id=student.student_id,
        status='ACTIVE'
    ).first()

    if not membership:
        return error_response("You are not an active member of this project team.", 403)

    data = request.get_json() or {}
    file_url = data.get('file_url', '').strip()
    notes = data.get('notes', '').strip()

    if not file_url:
        return error_response("file_url (link to artifact, documentation, or code repository) is required.", 400)

    try:
        # Determine current iteration version
        current_version = len(milestone.submissions) + 1

        submission = MilestoneSubmission(
            milestone_id=milestone_id,
            version_no=current_version,
            submitted_by=student.student_id,
            file_url=file_url,
            notes=notes
        )
        db.session.add(submission)
        db.session.commit()

        # Reload milestone to reflect trigger update
        db.session.refresh(milestone)

        return success_response({
            'submission': submission.to_dict(),
            'milestone_status': milestone.status
        }, "Milestone deliverable submitted successfully.", 201)

    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to submit deliverable: {str(e)}", 500)


# ---------------------------------------------------------------------
# 4. Faculty Feedback & Grading
# ---------------------------------------------------------------------

@milestones_bp.route('/submissions/<int:submission_id>/feedback', methods=['POST'])
@jwt_required()
def evaluate_submission(submission_id):
    """
    Assigned Faculty supervisor or Admin evaluates a milestone submission.
    Database trigger `trg_milestone_feedback_decision` transitions milestone status
    to APPROVED or REVISIONS_REQUIRED.
    """
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    submission = db.session.get(MilestoneSubmission, submission_id)

    if not submission:
        return error_response("Submission not found.", 404)

    proposal = submission.milestone.proposal
    allocation = proposal.allocation

    # Permission check: must be assigned faculty or admin
    if user.role == 'FACULTY':
        if not user.faculty_profile or not allocation or allocation.faculty_id != user.faculty_profile.faculty_id:
            return error_response("You are not the designated supervisor for this project.", 403)
        faculty_id = user.faculty_profile.faculty_id
    elif user.role == 'ADMIN':
        faculty_id = allocation.faculty_id if allocation else 1
    else:
        return error_response("Only faculty supervisors or administrators can evaluate submissions.", 403)

    data = request.get_json() or {}
    score = data.get('score')
    comments = data.get('comments', '').strip()
    decision = data.get('decision', '').strip().upper()

    if score is None or not comments or decision not in ('APPROVED', 'CHANGES_REQUESTED'):
        return error_response("score (0-100), comments, and valid decision ('APPROVED' or 'CHANGES_REQUESTED') are required.", 400)

    try:
        score = int(score)
        if not (0 <= score <= 100):
            return error_response("Score must be between 0 and 100.", 400)
    except ValueError:
        return error_response("Score must be an integer.", 400)

    try:
        # Check if feedback already exists for this submission
        if submission.feedback:
            fb = submission.feedback
            fb.score = score
            fb.comments = comments
            fb.decision = decision
            fb.faculty_id = faculty_id
        else:
            fb = FacultyFeedback(
                submission_id=submission_id,
                faculty_id=faculty_id,
                score=score,
                comments=comments,
                decision=decision
            )
            db.session.add(fb)

        db.session.commit()

        # Reload milestone to reflect trigger update
        db.session.refresh(submission.milestone)

        return success_response({
            'feedback': fb.to_dict(),
            'milestone_status': submission.milestone.status
        }, f"Submission evaluated with decision: {decision}.")

    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to submit evaluation: {str(e)}", 500)


# ---------------------------------------------------------------------
# 5. Faculty Review Queue
# ---------------------------------------------------------------------

@milestones_bp.route('/faculty/review-queue', methods=['GET'])
@jwt_required()
@role_required('FACULTY')
def get_faculty_review_queue():
    """Retrieve all pending deliverables awaiting evaluation across assigned projects."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user.faculty_profile:
        return error_response("Faculty profile not found.", 404)

    fac_id = user.faculty_profile.faculty_id

    # Find all milestones of projects allocated to this faculty that have SUBMITTED status
    pending_milestones = (
        ProjectMilestone.query
        .join(ProjectProposal)
        .join(MentorAllocation)
        .filter(MentorAllocation.faculty_id == fac_id, MentorAllocation.status == 'ACTIVE')
        .filter(ProjectMilestone.status == 'SUBMITTED')
        .all()
    )

    items = []
    for pm in pending_milestones:
        if pm.submissions:
            latest_sub = pm.submissions[0]
            items.append({
                'milestone_id': pm.milestone_id,
                'milestone_name': pm.template.name if pm.template else None,
                'due_date': pm.due_date.isoformat(),
                'proposal_id': pm.proposal_id,
                'proposal_title': pm.proposal.title,
                'team_name': pm.proposal.team.team_name,
                'submission': latest_sub.to_dict(include_feedback=False)
            })

    return success_response(items)


# ---------------------------------------------------------------------
# 6. Milestone Progress Reports (View vw_project_milestone_progress)
# ---------------------------------------------------------------------

@milestones_bp.route('/reports/progress', methods=['GET'])
def get_progress_reports():
    """
    Directly queries MySQL analytical view `vw_project_milestone_progress`
    to return departmental progress metrics across all projects.
    """
    try:
        sql = text("""
            SELECT 
                proposal_id,
                proposal_title,
                proposal_status,
                team_id,
                team_name,
                faculty_id,
                faculty_name,
                faculty_designation,
                cycle_id,
                cycle_name,
                total_milestones,
                completed_milestones,
                submitted_milestones,
                pending_milestones,
                overdue_milestones,
                progress_percent,
                average_score
            FROM vw_project_milestone_progress
            ORDER BY progress_percent DESC;
        """)
        result = db.session.execute(sql).mappings().all()

        records = [dict(row) for row in result]
        return success_response(records)
    except Exception as e:
        return error_response(f"Failed to fetch milestone analytics: {str(e)}", 500)

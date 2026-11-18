import json
from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from backend.app.extensions import db
from backend.app.models.user import User, FacultyProfile
from backend.app.models.project import ProjectTeam, ProjectSkillRequirement
from backend.app.models.academic import ResearchDomain
from backend.app.models.skill import Skill
from backend.app.models.allocation import (
    AllocationCycle,
    ProjectProposal,
    FacultyExpertise,
    FacultySkillExpertise,
    MentorPreference,
    MentorRecommendation,
    MentorAllocation,
    AllocationAuditLog
)
from backend.app.utils.decorators import role_required
from backend.app.utils.responses import success_response, error_response

allocation_bp = Blueprint('allocation', __name__, url_prefix='/api/allocation')

# ---------------------------------------------------------------------
# 1. Allocation Cycle Management
# ---------------------------------------------------------------------

@allocation_bp.route('/cycles', methods=['GET'])
def get_cycles():
    """List all allocation cycles."""
    status = request.args.get('status', '').upper()
    query = AllocationCycle.query
    if status in ('UPCOMING', 'OPEN', 'ALLOCATION_IN_PROGRESS', 'CLOSED'):
        query = query.filter_by(status=status)
    cycles = query.order_by(AllocationCycle.start_date.desc()).all()
    return success_response([c.to_dict() for c in cycles])


@allocation_bp.route('/cycles', methods=['POST'])
@jwt_required()
@role_required('ADMIN')
def create_cycle():
    """Create a new academic allocation cycle (Admin only)."""
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    semester = data.get('semester')
    academic_year = data.get('academic_year', '').strip()
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    if not name or not semester or not academic_year or not start_date or not end_date:
        return error_response("All cycle fields (name, semester, academic_year, start_date, end_date) are required.", 400)

    try:
        s_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        e_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        if e_date <= s_date:
            return error_response("End date must be after start date.", 400)

        cycle = AllocationCycle(
            name=name,
            semester=int(semester),
            academic_year=academic_year,
            start_date=s_date,
            end_date=e_date,
            status='OPEN'
        )
        db.session.add(cycle)
        db.session.commit()
        return success_response(cycle.to_dict(), "Allocation cycle created successfully.", 201)

    except ValueError:
        return error_response("Invalid date format. Expected YYYY-MM-DD.", 400)
    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to create cycle: {str(e)}", 500)


@allocation_bp.route('/cycles/<int:cycle_id>/status', methods=['PUT'])
@jwt_required()
@role_required('ADMIN')
def update_cycle_status(cycle_id):
    """Update cycle status (Admin only)."""
    cycle = db.session.get(AllocationCycle, cycle_id)
    if not cycle:
        return error_response("Cycle not found.", 404)

    data = request.get_json() or {}
    new_status = data.get('status', '').upper()
    if new_status not in ('UPCOMING', 'OPEN', 'ALLOCATION_IN_PROGRESS', 'CLOSED'):
        return error_response("Invalid cycle status.", 400)

    cycle.status = new_status
    db.session.commit()
    return success_response(cycle.to_dict(), "Cycle status updated.")


# ---------------------------------------------------------------------
# 2. Faculty Expertise & Workload
# ---------------------------------------------------------------------

@allocation_bp.route('/faculty/workload', methods=['GET'])
@allocation_bp.route('/faculty-workload', methods=['GET'])
def get_faculty_workload():
    """Retrieve faculty supervision workload and remaining slots from vw_faculty_workload."""
    query = text("""
        SELECT 
            faculty_id,
            user_id,
            employee_code,
            full_name,
            designation,
            department_id,
            department_name,
            department_code,
            max_project_capacity,
            active_projects_count,
            remaining_capacity,
            is_available_for_allocation
        FROM vw_faculty_workload
        ORDER BY department_name ASC, remaining_capacity DESC, full_name ASC;
    """)
    rows = db.session.execute(query).fetchall()

    results = []
    for r in rows:
        results.append({
            'faculty_id': r.faculty_id,
            'user_id': r.user_id,
            'employee_code': r.employee_code,
            'full_name': r.full_name,
            'designation': r.designation,
            'department_id': r.department_id,
            'department_name': r.department_name,
            'department_code': r.department_code,
            'max_project_capacity': r.max_project_capacity,
            'active_projects_count': r.active_projects_count,
            'remaining_capacity': r.remaining_capacity,
            'is_available': bool(r.is_available_for_allocation)
        })

    return success_response(results)


@allocation_bp.route('/faculty/expertise', methods=['GET'])
@jwt_required()
@role_required('FACULTY')
def get_my_expertise():
    """Retrieve domain and skill expertise of authenticated faculty member."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or not user.faculty_profile:
        return error_response("Faculty profile not found.", 404)

    faculty_id = user.faculty_profile.faculty_id
    domain_exps = FacultyExpertise.query.filter_by(faculty_id=faculty_id).all()
    skill_exps = FacultySkillExpertise.query.filter_by(faculty_id=faculty_id).all()

    return success_response({
        'domains': [d.to_dict() for d in domain_exps],
        'skills': [s.to_dict() for s in skill_exps]
    })


@allocation_bp.route('/faculty/expertise', methods=['POST'])
@jwt_required()
@role_required('FACULTY')
def update_my_expertise():
    """Update domain and skill expertise for authenticated faculty."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or not user.faculty_profile:
        return error_response("Faculty profile not found.", 404)

    faculty_id = user.faculty_profile.faculty_id
    data = request.get_json() or {}
    domain_id = data.get('domain_id')
    domain_level = data.get('expertise_level')

    skill_id = data.get('skill_id')
    skill_level = data.get('proficiency_level')

    try:
        # Handle domain expertise
        if domain_id and domain_level:
            d_level = int(domain_level)
            if not (1 <= d_level <= 5):
                return error_response("Domain expertise level must be 1 to 5.", 400)

            existing = FacultyExpertise.query.filter_by(faculty_id=faculty_id, domain_id=domain_id).first()
            if existing:
                existing.expertise_level = d_level
            else:
                db.session.add(FacultyExpertise(faculty_id=faculty_id, domain_id=domain_id, expertise_level=d_level))

        # Handle skill expertise
        if skill_id and skill_level:
            s_level = int(skill_level)
            if not (1 <= s_level <= 5):
                return error_response("Skill proficiency level must be 1 to 5.", 400)

            existing_s = FacultySkillExpertise.query.filter_by(faculty_id=faculty_id, skill_id=skill_id).first()
            if existing_s:
                existing_s.proficiency_level = s_level
            else:
                db.session.add(FacultySkillExpertise(faculty_id=faculty_id, skill_id=skill_id, proficiency_level=s_level))

        db.session.commit()
        return success_response(None, "Expertise updated successfully.")

    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to update expertise: {str(e)}", 500)


# ---------------------------------------------------------------------
# 3. Project Proposals
# ---------------------------------------------------------------------

@allocation_bp.route('/proposals', methods=['GET'])
def get_proposals():
    """List proposals with cycle and status filters."""
    cycle_id = request.args.get('cycle_id', type=int)
    status = request.args.get('status', '').upper()

    query = ProjectProposal.query
    if cycle_id:
        query = query.filter_by(cycle_id=cycle_id)
    if status in ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'ALLOCATED', 'REJECTED'):
        query = query.filter_by(status=status)

    proposals = query.order_by(ProjectProposal.submitted_at.desc()).all()
    return success_response([p.to_dict() for p in proposals])


@allocation_bp.route('/proposals/<int:proposal_id>', methods=['GET'])
def get_proposal_detail(proposal_id):
    """Retrieve full proposal detail with team preferences and allocation."""
    proposal = db.session.get(ProjectProposal, proposal_id)
    if not proposal:
        return error_response("Proposal not found.", 404)
    return success_response(proposal.to_dict(include_details=True))


@allocation_bp.route('/proposals', methods=['POST'])
@jwt_required()
@role_required('STUDENT')
def submit_proposal():
    """Team leader submits formal project proposal for allocation."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    student_id = user.student_profile.student_id
    data = request.get_json() or {}
    team_id = data.get('team_id')
    cycle_id = data.get('cycle_id')
    domain_id = data.get('domain_id')
    title = data.get('title', '').strip()
    problem_statement = data.get('problem_statement', '').strip()
    objectives = data.get('objectives', '').strip()

    if not team_id or not cycle_id or not domain_id or not title or not problem_statement or not objectives:
        return error_response("All proposal fields are required.", 400)

    team = db.session.get(ProjectTeam, team_id)
    if not team:
        return error_response("Team not found.", 404)

    if team.leader_id != student_id:
        return error_response("Only the team leader can submit the formal proposal.", 403)

    cycle = db.session.get(AllocationCycle, cycle_id)
    if not cycle or cycle.status != 'OPEN':
        return error_response("Selected allocation cycle is not open for submissions.", 400)

    if ProjectProposal.query.filter_by(team_id=team_id).first():
        return error_response("A proposal has already been submitted for this team.", 409)

    try:
        proposal = ProjectProposal(
            team_id=team_id,
            cycle_id=cycle_id,
            domain_id=domain_id,
            title=title,
            problem_statement=problem_statement,
            objectives=objectives,
            status='SUBMITTED'
        )
        db.session.add(proposal)
        db.session.commit()
        return success_response(proposal.to_dict(), "Project proposal submitted successfully.", 201)

    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to submit proposal: {str(e)}", 500)


@allocation_bp.route('/proposals/<int:proposal_id>/preferences', methods=['POST'])
@jwt_required()
@role_required('STUDENT')
def set_mentor_preferences(proposal_id):
    """Team leader specifies ranked faculty preferences (Rank 1 to 3)."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    proposal = db.session.get(ProjectProposal, proposal_id)
    if not proposal:
        return error_response("Proposal not found.", 404)

    if proposal.team.leader_id != user.student_profile.student_id:
        return error_response("Only the team leader can set faculty preferences.", 403)

    if proposal.status == 'ALLOCATED':
        return error_response("Cannot modify preferences on an already allocated project.", 400)

    data = request.get_json() or {}
    preferences_data = data.get('preferences', [])  # list of { faculty_id, preference_rank }

    if not preferences_data:
        return error_response("Preferences list cannot be empty.", 400)

    try:
        # Clear existing preferences
        MentorPreference.query.filter_by(proposal_id=proposal_id).delete()

        seen_faculty = set()
        seen_ranks = set()

        for p in preferences_data:
            fac_id = p.get('faculty_id')
            rank = int(p.get('preference_rank', 1))

            if not fac_id or not (1 <= rank <= 5):
                continue
            if fac_id in seen_faculty or rank in seen_ranks:
                return error_response("Duplicate faculty selection or duplicate rank is not allowed.", 400)

            seen_faculty.add(fac_id)
            seen_ranks.add(rank)

            db.session.add(MentorPreference(
                proposal_id=proposal_id,
                faculty_id=fac_id,
                preference_rank=rank
            ))

        db.session.commit()
        return success_response([p.to_dict() for p in proposal.preferences], "Mentor preferences saved.")

    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to save preferences: {str(e)}", 500)


# ---------------------------------------------------------------------
# 4. Explainable Recommendation Scoring Engine
# ---------------------------------------------------------------------

@allocation_bp.route('/recommendations/<int:proposal_id>', methods=['GET'])
def get_mentor_recommendations(proposal_id):
    """
    Computes explainable multi-criteria scores for all eligible faculty mentors:
    Score = 0.40(Domain) + 0.25(Skill) + 0.15(Preference) + 0.10(Capacity) + 0.10(Workload)
    Persists results in mentor_recommendations table and returns transparent rankings.
    """
    proposal = db.session.get(ProjectProposal, proposal_id)
    if not proposal:
        return error_response("Proposal not found.", 404)

    # 1. Fetch required skills for proposal (via linked idea or team's idea)
    required_skill_ids = []
    if proposal.team and proposal.team.idea_id:
        reqs = ProjectSkillRequirement.query.filter_by(idea_id=proposal.team.idea_id).all()
        required_skill_ids = [r.skill_id for r in reqs]

    # 2. Fetch student preferences for this proposal
    pref_map = {p.faculty_id: p.preference_rank for p in proposal.preferences}

    # 3. Query all faculty workload from vw_faculty_workload
    workload_query = text("""
        SELECT 
            faculty_id,
            full_name,
            designation,
            department_name,
            max_project_capacity,
            active_projects_count,
            remaining_capacity
        FROM vw_faculty_workload;
    """)
    workload_rows = db.session.execute(workload_query).fetchall()

    if not workload_rows:
        return error_response("No faculty members found in database.", 404)

    # Calculate department average active projects for workload balance normalization
    total_active = sum(r.active_projects_count for r in workload_rows)
    avg_active = (total_active / len(workload_rows)) if workload_rows else 1.0

    recommendations = []

    for fac in workload_rows:
        f_id = fac.faculty_id

        # Criterion A: Domain Match (40%)
        # Look up faculty_expertise for proposal.domain_id
        exp = FacultyExpertise.query.filter_by(faculty_id=f_id, domain_id=proposal.domain_id).first()
        domain_points = (exp.expertise_level / 5.0) * 100.0 if exp else 0.0

        # Criterion B: Skill Match (25%)
        # Check overlap between project required skills and faculty skill expertise
        if required_skill_ids:
            fac_skills = FacultySkillExpertise.query.filter(
                FacultySkillExpertise.faculty_id == f_id,
                FacultySkillExpertise.skill_id.in_(required_skill_ids)
            ).all()
            if fac_skills:
                total_level = sum(s.proficiency_level for s in fac_skills)
                max_possible = len(required_skill_ids) * 5.0
                skill_points = min(100.0, (total_level / max_possible) * 100.0)
            else:
                skill_points = 0.0
        else:
            skill_points = domain_points  # Fallback to domain fit if no specific skills specified

        # Criterion C: Student Preference (15%)
        rank = pref_map.get(f_id)
        if rank == 1:
            pref_points = 100.0
        elif rank == 2:
            pref_points = 60.0
        elif rank == 3:
            pref_points = 30.0
        else:
            pref_points = 0.0

        # Criterion D: Capacity Availability (10%)
        cap_points = (fac.remaining_capacity / float(fac.max_project_capacity)) * 100.0 if fac.max_project_capacity > 0 else 0.0
        cap_points = max(0.0, min(100.0, cap_points))

        # Criterion E: Workload Balance (10%)
        # Inversely proportional to current active load vs average
        if fac.active_projects_count <= avg_active:
            workload_points = 100.0
        else:
            workload_points = max(0.0, 100.0 - ((fac.active_projects_count - avg_active) * 25.0))

        # Final Composite Weighted Score
        total_score = round(
            (0.40 * domain_points) +
            (0.25 * skill_points) +
            (0.15 * pref_points) +
            (0.10 * cap_points) +
            (0.10 * workload_points),
            2
        )

        breakdown = {
            'domain_match': round(domain_points, 1),
            'skill_match': round(skill_points, 1),
            'student_preference': round(pref_points, 1),
            'student_rank': rank if rank else 'Unranked',
            'remaining_capacity': round(cap_points, 1),
            'workload_balance': round(workload_points, 1),
            'active_projects': fac.active_projects_count,
            'max_capacity': fac.max_project_capacity
        }

        recommendations.append({
            'faculty_id': f_id,
            'faculty_name': fac.full_name,
            'designation': fac.designation,
            'department_name': fac.department_name,
            'remaining_capacity': fac.remaining_capacity,
            'match_score': total_score,
            'breakdown': breakdown
        })

    # Sort descending by match_score
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)

    # Persist or update into mentor_recommendations table
    try:
        MentorRecommendation.query.filter_by(proposal_id=proposal_id).delete()
        for idx, rec in enumerate(recommendations, start=1):
            db.session.add(MentorRecommendation(
                proposal_id=proposal_id,
                faculty_id=rec['faculty_id'],
                match_score=rec['match_score'],
                rank_order=idx,
                score_breakdown=rec['breakdown']
            ))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Warning: Failed to cache recommendations in DB: {e}")

    return success_response({
        'proposal_id': proposal.proposal_id,
        'title': proposal.title,
        'domain_name': proposal.domain.name,
        'recommendations': recommendations
    })


# ---------------------------------------------------------------------
# 5. Atomic Mentor Allocation (Invokes Stored Procedure)
# ---------------------------------------------------------------------

@allocation_bp.route('/allocate', methods=['POST'])
@jwt_required()
@role_required('ADMIN')
def execute_mentor_allocation():
    """
    Executes atomic mentor allocation via MySQL Stored Procedure:
    sp_allocate_mentor_transaction(p_proposal_id, p_faculty_id, p_admin_id, p_cycle_id, p_reason)
    Guarantees ACID properties, row-level locking (FOR UPDATE), capacity verification,
    audit logging, and status transitions.
    """
    admin_id = int(get_jwt_identity())
    data = request.get_json() or {}
    proposal_id = data.get('proposal_id')
    faculty_id = data.get('faculty_id')
    reason = data.get('reason', 'Admin allocation approval').strip()

    if not proposal_id or not faculty_id:
        return error_response("proposal_id and faculty_id are required.", 400)

    proposal = db.session.get(ProjectProposal, proposal_id)
    if not proposal:
        return error_response("Proposal not found.", 404)

    cycle_id = proposal.cycle_id

    # Call the MySQL Stored Procedure with OUT parameters
    connection = db.engine.raw_connection()
    try:
        cursor = connection.cursor()
        
        # Execute stored procedure call
        cursor.execute("SET @p_alloc_id = 0, @p_status_code = 0, @p_msg = '';")
        cursor.execute("""
            CALL sp_allocate_mentor_transaction(
                %s, %s, %s, %s, %s,
                @p_alloc_id, @p_status_code, @p_msg
            );
        """, (proposal_id, faculty_id, admin_id, cycle_id, reason))
        
        cursor.execute("SELECT @p_alloc_id, @p_status_code, @p_msg;")
        res = cursor.fetchone()
        cursor.close()
        connection.commit()

        alloc_id, status_code, message = res[0], res[1], res[2]

        if status_code != 200:
            return error_response(message, status_code)

        # Commit/expire session to close snapshot and reload fresh data from database
        db.session.commit()
        allocation = db.session.get(MentorAllocation, alloc_id)
        return success_response(
            allocation.to_dict() if allocation else {'allocation_id': alloc_id, 'status': 'ACTIVE'},
            message,
            201
        )

    except Exception as e:
        connection.rollback()
        return error_response(f"Allocation procedure failed: {str(e)}", 500)
    finally:
        connection.close()


# ---------------------------------------------------------------------
# 6. Allocation Audit Logs
# ---------------------------------------------------------------------

@allocation_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    """Retrieve history of mentor allocation actions and audit trails."""
    logs = AllocationAuditLog.query.order_by(AllocationAuditLog.created_at.desc()).limit(100).all()
    return success_response([l.to_dict() for l in logs])

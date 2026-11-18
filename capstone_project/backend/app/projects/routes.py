from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from backend.app.extensions import db
from backend.app.models.user import User, StudentProfile
from backend.app.models.project import (
    ProjectIdea,
    ProjectSkillRequirement,
    ProjectTeam,
    TeamMember,
    TeamJoinRequest
)
from backend.app.models.skill import Skill, UserSkill
from backend.app.models.academic import ResearchDomain
from backend.app.utils.decorators import role_required
from backend.app.utils.responses import success_response, error_response

projects_bp = Blueprint('projects', __name__, url_prefix='/api/projects')

# ---------------------------------------------------------------------
# Project Ideas Endpoints
# ---------------------------------------------------------------------

@projects_bp.route('/ideas', methods=['GET'])
def get_project_ideas():
    """List or search project ideas with domain filters."""
    domain_id = request.args.get('domain_id', type=int)
    difficulty = request.args.get('difficulty_level', '').upper()
    status = request.args.get('status', '').upper()
    search = request.args.get('search', '').strip()

    query = ProjectIdea.query
    if domain_id:
        query = query.filter_by(domain_id=domain_id)
    if difficulty in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'):
        query = query.filter_by(difficulty_level=difficulty)
    if status:
        query = query.filter_by(status=status)
    if search:
        query = query.filter(ProjectIdea.title.ilike(f'%{search}%'))

    ideas = query.order_by(ProjectIdea.created_at.desc()).all()
    return success_response([i.to_dict() for i in ideas])


@projects_bp.route('/ideas/<int:idea_id>', methods=['GET'])
def get_idea_detail(idea_id):
    """Retrieve full detail of a project idea and required skills."""
    idea = db.session.get(ProjectIdea, idea_id)
    if not idea:
        return error_response("Project idea not found.", 404)
    return success_response(idea.to_dict())


@projects_bp.route('/ideas', methods=['POST'])
@jwt_required()
def create_project_idea():
    """Create a new project idea with required skills (Student or Faculty)."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found.", 404)

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    abstract = data.get('abstract', '').strip()
    domain_id = data.get('domain_id')
    difficulty = data.get('difficulty_level', 'INTERMEDIATE').upper()
    skills_data = data.get('skills', [])  # list of {skill_id, importance_level}

    if not title or not abstract or not domain_id:
        return error_response("Title, abstract, and domain_id are required.", 400)

    domain = db.session.get(ResearchDomain, domain_id)
    if not domain:
        return error_response("Invalid research domain selected.", 400)

    try:
        idea = ProjectIdea(
            created_by=user_id,
            domain_id=domain_id,
            title=title,
            abstract=abstract,
            difficulty_level=difficulty if difficulty in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED') else 'INTERMEDIATE',
            status='OPEN_FOR_MEMBERS'
        )
        db.session.add(idea)
        db.session.flush()

        # Add skill requirements
        for s in skills_data:
            skill_id = s.get('skill_id')
            importance = s.get('importance_level', 'REQUIRED').upper()
            if skill_id:
                skill = db.session.get(Skill, skill_id)
                if skill:
                    req = ProjectSkillRequirement(
                        idea_id=idea.idea_id,
                        skill_id=skill_id,
                        importance_level=importance if importance in ('REQUIRED', 'NICE_TO_HAVE') else 'REQUIRED'
                    )
                    db.session.add(req)

        db.session.commit()
        return success_response(idea.to_dict(), "Project idea published successfully.", 201)

    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to create project idea: {str(e)}", 500)


# ---------------------------------------------------------------------
# Project Teams Endpoints
# ---------------------------------------------------------------------

@projects_bp.route('/teams', methods=['GET'])
def get_teams():
    """List all project teams."""
    status = request.args.get('status', '').upper()
    query = ProjectTeam.query
    if status in ('FORMING', 'READY', 'ALLOCATED', 'COMPLETED'):
        query = query.filter_by(status=status)
    teams = query.order_by(ProjectTeam.created_at.desc()).all()
    return success_response([t.to_dict() for t in teams])


@projects_bp.route('/teams/<int:team_id>', methods=['GET'])
def get_team_detail(team_id):
    """Get single team details with member roster."""
    team = db.session.get(ProjectTeam, team_id)
    if not team:
        return error_response("Team not found.", 404)
    return success_response(team.to_dict(include_members=True))


@projects_bp.route('/teams/my', methods=['GET'])
@projects_bp.route('/teams/my-teams', methods=['GET'])
@jwt_required()
@role_required('STUDENT')
def get_my_teams():
    """Get teams in which the authenticated student is an active member or leader."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    student_id = user.student_profile.student_id
    memberships = TeamMember.query.filter_by(student_id=student_id, status='ACTIVE').all()
    team_ids = [m.team_id for m in memberships]
    teams = ProjectTeam.query.filter(ProjectTeam.team_id.in_(team_ids)).all() if team_ids else []

    return success_response([t.to_dict(include_members=True) for t in teams])


@projects_bp.route('/teams', methods=['POST'])
@jwt_required()
@role_required('STUDENT')
def create_team():
    """Create a project team and assign the student as LEADER."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    student_id = user.student_profile.student_id
    data = request.get_json() or {}
    team_name = data.get('team_name', '').strip()
    idea_id = data.get('idea_id')
    max_members = int(data.get('max_members', 4))

    if not team_name:
        return error_response("Team name is required.", 400)

    if not (1 <= max_members <= 6):
        return error_response("Team capacity must be between 1 and 6 members.", 400)

    if ProjectTeam.query.filter_by(team_name=team_name).first():
        return error_response("A team with this name already exists.", 409)

    if idea_id:
        idea = db.session.get(ProjectIdea, idea_id)
        if not idea:
            return error_response("Selected project idea not found.", 404)

    try:
        team = ProjectTeam(
            idea_id=idea_id,
            team_name=team_name,
            leader_id=student_id,
            max_members=max_members,
            status='FORMING'
        )
        db.session.add(team)
        db.session.flush()

        # Add leader as first member
        membership = TeamMember(
            team_id=team.team_id,
            student_id=student_id,
            member_role='LEADER',
            status='ACTIVE'
        )
        db.session.add(membership)
        db.session.commit()

        return success_response(team.to_dict(include_members=True), "Team created successfully.", 201)

    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to create team: {str(e)}", 500)


@projects_bp.route('/teams/<int:team_id>/join-requests', methods=['POST'])
@jwt_required()
@role_required('STUDENT')
def request_to_join_team(team_id):
    """Submit a request to join a project team."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    student_id = user.student_profile.student_id
    team = db.session.get(ProjectTeam, team_id)
    if not team:
        return error_response("Team not found.", 404)

    if team.status != 'FORMING':
        return error_response("This team is no longer accepting new members.", 400)

    # Check if already a member
    if TeamMember.query.filter_by(team_id=team_id, student_id=student_id, status='ACTIVE').first():
        return error_response("You are already an active member of this team.", 409)

    # Check capacity
    active_count = TeamMember.query.filter_by(team_id=team_id, status='ACTIVE').count()
    if active_count >= team.max_members:
        return error_response("This team has already reached maximum capacity.", 400)

    # Check pending request
    existing_req = TeamJoinRequest.query.filter_by(team_id=team_id, student_id=student_id, status='PENDING').first()
    if existing_req:
        return error_response("You already have a pending join request for this team.", 409)

    data = request.get_json() or {}
    message = data.get('message', '').strip()

    req = TeamJoinRequest(
        team_id=team_id,
        student_id=student_id,
        message=message
    )
    db.session.add(req)
    db.session.commit()

    return success_response(req.to_dict(), "Join request submitted to team leader.", 201)


@projects_bp.route('/teams/<int:team_id>/join-requests', methods=['GET'])
@jwt_required()
@role_required('STUDENT')
def get_team_join_requests(team_id):
    """Team leader retrieves pending join requests."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    team = db.session.get(ProjectTeam, team_id)
    if not team:
        return error_response("Team not found.", 404)

    if team.leader_id != user.student_profile.student_id:
        return error_response("Only the team leader can review join requests.", 403)

    requests = TeamJoinRequest.query.filter_by(team_id=team_id, status='PENDING').order_by(TeamJoinRequest.created_at.desc()).all()
    return success_response([r.to_dict() for r in requests])


@projects_bp.route('/teams/<int:team_id>/join-requests/<int:req_id>/respond', methods=['POST'])
@jwt_required()
@role_required('STUDENT')
def respond_join_request(team_id, req_id):
    """Team leader approves or rejects a student join request."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    team = db.session.get(ProjectTeam, team_id)
    if not team:
        return error_response("Team not found.", 404)

    if team.leader_id != user.student_profile.student_id:
        return error_response("Only the team leader can take action on join requests.", 403)

    join_req = db.session.get(TeamJoinRequest, req_id)
    if not join_req or join_req.team_id != team_id:
        return error_response("Join request not found.", 404)

    if join_req.status != 'PENDING':
        return error_response("This request has already been processed.", 400)

    data = request.get_json() or {}
    action = data.get('action', '').upper()

    if action not in ('ACCEPT', 'REJECT'):
        return error_response("Action must be either ACCEPT or REJECT.", 400)

    try:
        if action == 'ACCEPT':
            active_count = TeamMember.query.filter_by(team_id=team_id, status='ACTIVE').count()
            if active_count >= team.max_members:
                return error_response("Cannot accept member: team capacity reached.", 400)

            join_req.status = 'ACCEPTED'

            # Add to team_members
            member = TeamMember(
                team_id=team_id,
                student_id=join_req.student_id,
                member_role='MEMBER',
                status='ACTIVE'
            )
            db.session.add(member)
        else:
            join_req.status = 'REJECTED'

        db.session.commit()
        return success_response(join_req.to_dict(), f"Join request {action.lower()}ed successfully.")

    except Exception as e:
        db.session.rollback()
        return error_response(f"Action failed: {str(e)}", 500)


# ---------------------------------------------------------------------
# Team Skill-Gap Analysis Engine (View + Function + Peer Suggestions)
# ---------------------------------------------------------------------

@projects_bp.route('/teams/<int:team_id>/skill-gap', methods=['GET'])
def get_team_skill_gap(team_id):
    """
    Computes comprehensive skill-gap analysis for a team by querying:
    1. SQL View: vw_team_skill_gaps
    2. Stored Function: fn_get_team_skill_gap_count
    3. Recommends available peer mentors for missing skills.
    """
    team = db.session.get(ProjectTeam, team_id)
    if not team:
        return error_response("Team not found.", 404)

    if not team.idea_id:
        return error_response("This team is not yet linked to a project idea. Select a project idea to view skill gaps.", 400)

    # 1. Query the SQL View `vw_team_skill_gaps`
    view_query = text("""
        SELECT 
            team_id,
            team_name,
            idea_id,
            idea_title,
            skill_id,
            skill_name,
            category_name,
            importance_level,
            is_covered,
            covered_by_members
        FROM vw_team_skill_gaps
        WHERE team_id = :team_id
        ORDER BY importance_level DESC, is_covered ASC, skill_name ASC;
    """)
    rows = db.session.execute(view_query, {'team_id': team_id}).fetchall()

    skills_breakdown = []
    missing_skill_ids = []
    covered_count = 0
    total_skills = len(rows)

    for row in rows:
        is_cov = bool(row.is_covered)
        if is_cov:
            covered_count += 1
        else:
            missing_skill_ids.append(row.skill_id)

        skills_breakdown.append({
            'skill_id': row.skill_id,
            'skill_name': row.skill_name,
            'category_name': row.category_name,
            'importance_level': row.importance_level,
            'is_covered': is_cov,
            'covered_by_members': row.covered_by_members
        })

    # 2. Call the MySQL Stored Function `fn_get_team_skill_gap_count`
    func_query = text("SELECT fn_get_team_skill_gap_count(:team_id, :idea_id) AS missing_required_count;")
    func_res = db.session.execute(func_query, {'team_id': team_id, 'idea_id': team.idea_id}).fetchone()
    missing_required_count = func_res.missing_required_count if func_res else 0

    # 3. Find recommended peer mentors who offer the missing skills
    recommended_peers = []
    if missing_skill_ids:
        # Avoid recommending current team members
        team_member_ids = [m.student_id for m in team.members if m.status == 'ACTIVE']
        
        peer_query = text("""
            SELECT 
                sp.student_id,
                sp.full_name,
                sp.roll_no,
                d.code AS dept_code,
                sp.avg_peer_rating,
                s.skill_id,
                s.name AS skill_name,
                us.proficiency_level
            FROM user_skills us
            JOIN student_profiles sp ON us.student_id = sp.student_id
            JOIN departments d ON sp.department_id = d.department_id
            JOIN skills s ON us.skill_id = s.skill_id
            WHERE us.skill_id IN :skill_ids
              AND us.skill_type = 'OFFERED'
              AND sp.student_id NOT IN :team_member_ids
            ORDER BY us.proficiency_level DESC, sp.avg_peer_rating DESC
            LIMIT 6;
        """)
        # If team_member_ids is empty, use dummy (0) to avoid SQL syntax error
        member_ids_tuple = tuple(team_member_ids) if team_member_ids else (0,)
        peer_rows = db.session.execute(
            peer_query,
            {'skill_ids': tuple(missing_skill_ids), 'team_member_ids': member_ids_tuple}
        ).fetchall()

        for pr in peer_rows:
            recommended_peers.append({
                'student_id': pr.student_id,
                'full_name': pr.full_name,
                'roll_no': pr.roll_no,
                'department_code': pr.dept_code,
                'avg_peer_rating': float(pr.avg_peer_rating) if pr.avg_peer_rating else 0.0,
                'skill_id': pr.skill_id,
                'skill_name': pr.skill_name,
                'proficiency_level': pr.proficiency_level
            })

    coverage_percent = round((covered_count / total_skills * 100), 1) if total_skills > 0 else 100.0

    return success_response({
        'team_id': team.team_id,
        'team_name': team.team_name,
        'idea_id': team.idea_id,
        'idea_title': team.idea.title if team.idea else None,
        'total_required_skills': total_skills,
        'covered_skills_count': covered_count,
        'missing_required_count': missing_required_count,
        'coverage_percentage': coverage_percent,
        'skills_breakdown': skills_breakdown,
        'recommended_peers': recommended_peers
    })

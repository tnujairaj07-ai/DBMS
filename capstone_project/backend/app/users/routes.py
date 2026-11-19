from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.extensions import db
from backend.app.models.user import User, StudentProfile, FacultyProfile, StudentProject
from backend.app.models.skill import UserSkill
from backend.app.models.project import TeamMember
from backend.app.models.peer_learning import PeerRequest, PeerSession, SessionReview
from backend.app.utils.decorators import role_required
from backend.app.utils.responses import success_response, error_response

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

VALID_PROJECT_TYPES = {'PERSONAL', 'ACADEMIC', 'HACKATHON', 'OPEN_SOURCE'}


def _normalize_optional_url(value):
    """Trim URL and ensure scheme if provided; return None when blank."""
    if value is None:
        return None
    cleaned = str(value).strip()
    if not cleaned:
        return None
    if not cleaned.startswith(('http://', 'https://')):
        cleaned = f'https://{cleaned}'
    return cleaned


@users_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    """Fetch public profile of any user."""
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found.", 404)
    return success_response(user.to_dict())


@users_bp.route('/profile/<int:user_id>/public', methods=['GET'])
def get_public_student_profile(user_id):
    """Fetch complete public portfolio, skills, teams, and peer reviews for a student."""
    user = db.session.get(User, user_id)
    if not user or user.role != 'STUDENT' or not user.student_profile:
        return error_response("Student profile not found.", 404)

    profile = user.student_profile
    student_id = profile.student_id

    # 1. Skills (Offered vs Wanted)
    all_skills = (
        UserSkill.query.filter_by(student_id=student_id)
        .order_by(UserSkill.proficiency_level.desc())
        .all()
    )
    offered_skills = [s.to_dict() for s in all_skills if s.skill_type == 'OFFERED']
    wanted_skills = [s.to_dict() for s in all_skills if s.skill_type == 'WANTED']

    # 2. Portfolio Projects (Proof of Work)
    projects = (
        StudentProject.query.filter_by(student_id=student_id)
        .order_by(StudentProject.created_at.desc())
        .all()
    )

    # 3. Active LearnLink Teams
    memberships = (
        TeamMember.query.filter_by(student_id=student_id, status='ACTIVE').all()
    )
    teams_data = []
    for m in memberships:
        if m.team:
            teams_data.append({
                'team_id': m.team.team_id,
                'team_name': m.team.team_name,
                'role_in_team': m.member_role,
                'status': m.team.status,
                'idea_id': m.team.idea_id,
                'idea_title': m.team.idea.title if m.team.idea else None,
                'domain_name': m.team.idea.domain.name if m.team.idea and m.team.idea.domain else None,
            })

    # 4. Sessions Taught & Verified Peer Reviews
    sessions_taught = (
        PeerSession.query.join(PeerRequest, PeerSession.request_id == PeerRequest.request_id)
        .filter(
            PeerRequest.peer_mentor_id == student_id,
            PeerSession.status == 'COMPLETED',
        )
        .count()
    )

    review_rows = (
        SessionReview.query.join(PeerSession, SessionReview.session_id == PeerSession.session_id)
        .join(PeerRequest, PeerSession.request_id == PeerRequest.request_id)
        .filter(PeerRequest.peer_mentor_id == student_id)
        .order_by(SessionReview.created_at.desc())
        .all()
    )
    reviews_data = []
    for rev in review_rows:
        req = rev.session.request if rev.session else None
        reviews_data.append({
            'review_id': rev.review_id,
            'rating': rev.rating,
            'feedback': rev.feedback,
            'reviewer_name': rev.reviewer.full_name if rev.reviewer else 'Student',
            'skill_name': req.skill.name if req and req.skill else None,
            'created_at': rev.created_at.isoformat() if rev.created_at else None,
        })

    return success_response({
        'user_id': user.user_id,
        'email': user.email,
        'student_profile': profile.to_dict(),
        'skills': {
            'offered': offered_skills,
            'wanted': wanted_skills,
        },
        'projects': [p.to_dict() for p in projects],
        'teams': teams_data,
        'reviews': reviews_data,
        'stats': {
            'avg_peer_rating': float(profile.avg_peer_rating) if profile.avg_peer_rating is not None else 0.0,
            'sessions_taught': sessions_taught,
            'reviews_count': len(reviews_data),
            'projects_count': len(projects),
            'teams_count': len(teams_data),
        },
    })


@users_bp.route('/profile/student', methods=['PUT'])
@jwt_required()
@role_required('STUDENT')
def update_student_profile():
    """Update current student's profile details, links, and mentoring flags."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    profile = user.student_profile
    data = request.get_json() or {}

    if 'full_name' in data and str(data['full_name']).strip():
        profile.full_name = str(data['full_name']).strip()
    if 'semester' in data and data['semester'] not in (None, ''):
        sem = int(data['semester'])
        if sem < 1 or sem > 12:
            return error_response("Semester must be between 1 and 12.", 400)
        profile.semester = sem
    if 'cgpa' in data:
        if data['cgpa'] in (None, ''):
            profile.cgpa = None
        else:
            cgpa_val = float(data['cgpa'])
            if cgpa_val < 0 or cgpa_val > 10:
                return error_response("CGPA must be between 0.00 and 10.00.", 400)
            profile.cgpa = cgpa_val
    if 'bio' in data:
        profile.bio = str(data['bio']).strip() if data['bio'] is not None else None
    if 'headline' in data:
        profile.headline = str(data['headline']).strip()[:150] if data['headline'] else None
    if 'github_url' in data:
        profile.github_url = _normalize_optional_url(data['github_url'])
    if 'linkedin_url' in data:
        profile.linkedin_url = _normalize_optional_url(data['linkedin_url'])
    if 'portfolio_url' in data:
        profile.portfolio_url = _normalize_optional_url(data['portfolio_url'])
    if 'open_to_mentor' in data:
        profile.open_to_mentor = bool(data['open_to_mentor'])
    if 'open_to_collaborate' in data:
        profile.open_to_collaborate = bool(data['open_to_collaborate'])

    db.session.commit()
    return success_response(user.to_dict(), "Profile updated successfully.")


@users_bp.route('/profile/projects', methods=['GET'])
@jwt_required()
@role_required('STUDENT')
def get_my_projects():
    """List current student's portfolio projects."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    projects = (
        StudentProject.query.filter_by(student_id=user.student_profile.student_id)
        .order_by(StudentProject.created_at.desc())
        .all()
    )
    return success_response([p.to_dict() for p in projects])


@users_bp.route('/profile/projects', methods=['POST'])
@jwt_required()
@role_required('STUDENT')
def add_my_project():
    """Add a proof-of-work GitHub project to the student's portfolio."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    data = request.get_json() or {}
    title = str(data.get('title', '')).strip()
    description = str(data.get('description', '')).strip()
    github_url = _normalize_optional_url(data.get('github_url'))

    if not title or not description or not github_url:
        return error_response("Project title, description, and GitHub URL are required.", 400)

    project_type = str(data.get('project_type', 'PERSONAL')).upper()
    if project_type not in VALID_PROJECT_TYPES:
        return error_response(f"Invalid project_type. Must be one of {sorted(VALID_PROJECT_TYPES)}.", 400)

    project = StudentProject(
        student_id=user.student_profile.student_id,
        title=title[:150],
        description=description,
        tech_stack=str(data.get('tech_stack', '')).strip()[:255] or None,
        github_url=github_url,
        live_demo_url=_normalize_optional_url(data.get('live_demo_url')),
        project_type=project_type,
    )
    db.session.add(project)
    db.session.commit()
    return success_response(project.to_dict(), "Project added to your portfolio.", 201)


@users_bp.route('/profile/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
@role_required('STUDENT')
def update_my_project(project_id):
    """Update an existing portfolio project owned by the current student."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    project = db.session.get(StudentProject, project_id)
    if not project or project.student_id != user.student_profile.student_id:
        return error_response("Portfolio project not found.", 404)

    data = request.get_json() or {}
    if 'title' in data and str(data['title']).strip():
        project.title = str(data['title']).strip()[:150]
    if 'description' in data and str(data['description']).strip():
        project.description = str(data['description']).strip()
    if 'tech_stack' in data:
        project.tech_stack = str(data['tech_stack']).strip()[:255] or None
    if 'github_url' in data:
        normalized = _normalize_optional_url(data['github_url'])
        if not normalized:
            return error_response("GitHub URL cannot be empty.", 400)
        project.github_url = normalized
    if 'live_demo_url' in data:
        project.live_demo_url = _normalize_optional_url(data['live_demo_url'])
    if 'project_type' in data:
        ptype = str(data['project_type']).upper()
        if ptype not in VALID_PROJECT_TYPES:
            return error_response("Invalid project_type.", 400)
        project.project_type = ptype

    db.session.commit()
    return success_response(project.to_dict(), "Portfolio project updated.")


@users_bp.route('/profile/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
@role_required('STUDENT')
def delete_my_project(project_id):
    """Delete a portfolio project owned by the current student."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    project = db.session.get(StudentProject, project_id)
    if not project or project.student_id != user.student_profile.student_id:
        return error_response("Portfolio project not found.", 404)

    db.session.delete(project)
    db.session.commit()
    return success_response(None, "Portfolio project removed.")


@users_bp.route('/profile/faculty', methods=['PUT'])
@jwt_required()
@role_required('FACULTY')
def update_faculty_profile():
    """Update current faculty's mentoring capacity and details."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.faculty_profile:
        return error_response("Faculty profile not found.", 404)

    profile = user.faculty_profile
    data = request.get_json() or {}

    if 'full_name' in data and data['full_name'].strip():
        profile.full_name = data['full_name'].strip()
    if 'designation' in data and data['designation'].strip():
        profile.designation = data['designation'].strip()
    if 'max_project_capacity' in data and data['max_project_capacity']:
        cap = int(data['max_project_capacity'])
        if cap < 1:
            return error_response("Max project capacity must be at least 1.", 400)
        profile.max_project_capacity = cap

    db.session.commit()
    return success_response(user.to_dict(), "Faculty profile updated successfully.")

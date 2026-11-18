from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.extensions import db
from backend.app.models.user import User, StudentProfile, FacultyProfile
from backend.app.utils.decorators import role_required
from backend.app.utils.responses import success_response, error_response

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    """Fetch public profile of any user."""
    user = db.session.get(User, user_id)
    if not user:
        return error_response("User not found.", 404)
    return success_response(user.to_dict())


@users_bp.route('/profile/student', methods=['PUT'])
@jwt_required()
@role_required('STUDENT')
def update_student_profile():
    """Update current student's profile details."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    profile = user.student_profile
    data = request.get_json() or {}

    if 'full_name' in data and data['full_name'].strip():
        profile.full_name = data['full_name'].strip()
    if 'semester' in data and data['semester']:
        profile.semester = int(data['semester'])
    if 'cgpa' in data:
        profile.cgpa = data['cgpa']
    if 'bio' in data:
        profile.bio = data['bio']

    db.session.commit()
    return success_response(user.to_dict(), "Profile updated successfully.")


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

from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from backend.app.extensions import db
from backend.app.models.user import User, StudentProfile, FacultyProfile
from backend.app.models.academic import Department
from backend.app.utils.responses import success_response, error_response

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new student or faculty user."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', '').upper()
    full_name = data.get('full_name', '').strip()
    department_id = data.get('department_id')

    # Basic validations
    if not email or not password or not role or not full_name or not department_id:
        return error_response("Missing required registration fields.", 400)

    if role not in ('STUDENT', 'FACULTY'):
        return error_response("Role must be either STUDENT or FACULTY.", 400)

    if len(password) < 6:
        return error_response("Password must be at least 6 characters long.", 400)

    # Check existing user
    if User.query.filter_by(email=email).first():
        return error_response("An account with this email already exists.", 409)

    # Check department
    dept = db.session.get(Department, department_id)
    if not dept:
        return error_response("Invalid department selected.", 400)

    try:
        user = User(email=email, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.flush()  # Flush to get user.user_id

        if role == 'STUDENT':
            roll_no = data.get('roll_no', '').strip().upper()
            semester = data.get('semester')
            if not roll_no or not semester:
                db.session.rollback()
                return error_response("Roll number and semester are required for students.", 400)

            if StudentProfile.query.filter_by(roll_no=roll_no).first():
                db.session.rollback()
                return error_response("Roll number is already registered.", 409)

            student_profile = StudentProfile(
                user_id=user.user_id,
                roll_no=roll_no,
                department_id=department_id,
                full_name=full_name,
                semester=int(semester),
                cgpa=data.get('cgpa'),
                bio=data.get('bio', '')
            )
            db.session.add(student_profile)

        elif role == 'FACULTY':
            employee_code = data.get('employee_code', '').strip().upper()
            designation = data.get('designation', '').strip()
            max_capacity = data.get('max_project_capacity', 3)

            if not employee_code or not designation:
                db.session.rollback()
                return error_response("Employee code and designation are required for faculty.", 400)

            if FacultyProfile.query.filter_by(employee_code=employee_code).first():
                db.session.rollback()
                return error_response("Employee code is already registered.", 409)

            faculty_profile = FacultyProfile(
                user_id=user.user_id,
                employee_code=employee_code,
                department_id=department_id,
                full_name=full_name,
                designation=designation,
                max_project_capacity=int(max_capacity)
            )
            db.session.add(faculty_profile)

        db.session.commit()

        # Generate tokens
        identity = str(user.user_id)
        additional_claims = {'role': user.role, 'email': user.email}
        access_token = create_access_token(identity=identity, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=identity, additional_claims=additional_claims)

        return success_response({
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }, "Registration successful.", 201)

    except Exception as e:
        db.session.rollback()
        return error_response(f"Registration failed: {str(e)}", 500)


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT tokens."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return error_response("Email and password are required.", 400)

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return error_response("Invalid email or password.", 401)

    if not user.is_active:
        return error_response("Account is deactivated. Contact department admin.", 403)

    identity = str(user.user_id)
    additional_claims = {'role': user.role, 'email': user.email}
    access_token = create_access_token(identity=identity, additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=identity, additional_claims=additional_claims)

    return success_response({
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }, "Login successful.")


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get profile of authenticated user."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return error_response("User not found.", 404)
    return success_response(user.to_dict())


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    """Issue a new access token using a valid refresh token."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.is_active:
        return error_response("User not found or inactive.", 401)

    additional_claims = {'role': user.role, 'email': user.email}
    new_access_token = create_access_token(identity=str(user.user_id), additional_claims=additional_claims)
    return success_response({'access_token': new_access_token}, "Token refreshed.")

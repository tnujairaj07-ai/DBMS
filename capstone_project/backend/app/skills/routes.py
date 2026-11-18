from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.extensions import db
from backend.app.models.skill import SkillCategory, Skill, UserSkill
from backend.app.models.user import User
from backend.app.utils.decorators import role_required
from backend.app.utils.responses import success_response, error_response

skills_bp = Blueprint('skills', __name__, url_prefix='/api/skills')

@skills_bp.route('/categories', methods=['GET'])
def get_categories():
    """List all skill categories."""
    categories = SkillCategory.query.order_by(SkillCategory.name.asc()).all()
    return success_response([c.to_dict() for c in categories])


@skills_bp.route('', methods=['GET'])
def get_skills():
    """List or search catalog skills."""
    category_id = request.args.get('category_id', type=int)
    search = request.args.get('search', '').strip()

    query = Skill.query
    if category_id:
        query = query.filter_by(category_id=category_id)
    if search:
        query = query.filter(Skill.name.ilike(f'%{search}%'))

    skills = query.order_by(Skill.name.asc()).all()
    return success_response([s.to_dict() for s in skills])


@skills_bp.route('/my', methods=['GET'])
@jwt_required()
@role_required('STUDENT')
def get_my_skills():
    """Retrieve offered and wanted skills for the authenticated student."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    skills = UserSkill.query.filter_by(student_id=user.student_profile.student_id).all()
    offered = [s.to_dict() for s in skills if s.skill_type == 'OFFERED']
    wanted = [s.to_dict() for s in skills if s.skill_type == 'WANTED']

    return success_response({
        'offered': offered,
        'wanted': wanted
    })


@skills_bp.route('/my', methods=['POST'])
@jwt_required()
@role_required('STUDENT')
def add_or_update_my_skill():
    """Add or update an offered or wanted skill on student profile."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    data = request.get_json() or {}
    skill_id = data.get('skill_id')
    skill_type = data.get('skill_type', '').upper()
    proficiency_level = data.get('proficiency_level')

    if not skill_id or skill_type not in ('OFFERED', 'WANTED') or not proficiency_level:
        return error_response("skill_id, skill_type (OFFERED/WANTED), and proficiency_level (1-5) are required.", 400)

    try:
        proficiency_level = int(proficiency_level)
        if not (1 <= proficiency_level <= 5):
            return error_response("proficiency_level must be an integer between 1 and 5.", 400)
    except ValueError:
        return error_response("proficiency_level must be an integer.", 400)

    skill = db.session.get(Skill, skill_id)
    if not skill:
        return error_response("Skill does not exist in master catalog.", 404)

    student_id = user.student_profile.student_id

    # Check existing
    existing = UserSkill.query.filter_by(
        student_id=student_id,
        skill_id=skill_id,
        skill_type=skill_type
    ).first()

    if existing:
        existing.proficiency_level = proficiency_level
        db.session.commit()
        return success_response(existing.to_dict(), "Skill proficiency updated.")
    else:
        new_skill = UserSkill(
            student_id=student_id,
            skill_id=skill_id,
            skill_type=skill_type,
            proficiency_level=proficiency_level
        )
        db.session.add(new_skill)
        db.session.commit()
        return success_response(new_skill.to_dict(), "Skill added to profile.", 201)


@skills_bp.route('/my/<int:user_skill_id>', methods=['DELETE'])
@jwt_required()
@role_required('STUDENT')
def delete_my_skill(user_skill_id):
    """Remove a skill from the authenticated student profile."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or not user.student_profile:
        return error_response("Student profile not found.", 404)

    user_skill = UserSkill.query.filter_by(
        user_skill_id=user_skill_id,
        student_id=user.student_profile.student_id
    ).first()

    if not user_skill:
        return error_response("Skill not found in profile.", 404)

    db.session.delete(user_skill)
    db.session.commit()
    return success_response(None, "Skill removed from profile.")

from flask import Blueprint
from backend.app.models.academic import Department, ResearchDomain
from backend.app.utils.responses import success_response

academic_bp = Blueprint('academic', __name__, url_prefix='/api/academic')

@academic_bp.route('/departments', methods=['GET'])
def get_departments():
    """Retrieve all academic departments."""
    depts = Department.query.order_by(Department.name.asc()).all()
    return success_response([d.to_dict() for d in depts])

@academic_bp.route('/domains', methods=['GET'])
def get_domains():
    """Retrieve all research domains."""
    domains = ResearchDomain.query.order_by(ResearchDomain.name.asc()).all()
    return success_response([d.to_dict() for d in domains])

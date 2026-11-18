from functools import wraps
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from backend.app.utils.responses import error_response

def role_required(*allowed_roles):
    """
    Decorator to restrict endpoint access to specific user roles.
    Expects JWT claims to contain 'role'.
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role', '')
            
            if user_role not in allowed_roles:
                return error_response(
                    message=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}",
                    status_code=403
                )
            return fn(*args, **kwargs)
        return decorator
    return wrapper

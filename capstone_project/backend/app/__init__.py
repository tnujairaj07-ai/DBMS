import os
from flask import Flask
from backend.config import config_by_name
from backend.app.extensions import db, migrate, jwt, cors
from backend.app.utils.responses import error_response

def create_app(config_name=None):
    """Application factory for LearnLink API."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name['default']))

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Configure CORS
    client_origin = os.environ.get('CLIENT_ORIGIN', 'http://localhost:5173')
    cors.init_app(app, resources={r"/api/*": {"origins": [client_origin, "http://localhost:5173", "http://127.0.0.1:5173"]}})

    # JWT Error handlers
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return error_response("Missing or invalid authorization token.", 401)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response("Authorization token has expired.", 401)

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return error_response("Invalid authorization token format.", 401)

    # Register blueprints
    from backend.app.auth.routes import auth_bp
    from backend.app.academic.routes import academic_bp
    from backend.app.skills.routes import skills_bp
    from backend.app.users.routes import users_bp
    from backend.app.projects.routes import projects_bp
    from backend.app.allocation.routes import allocation_bp
    from backend.app.milestones.routes import milestones_bp
    from backend.app.peer_learning.routes import peer_learning_bp, consultations_bp, reports_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(academic_bp)
    app.register_blueprint(skills_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(allocation_bp)
    app.register_blueprint(milestones_bp)
    app.register_blueprint(peer_learning_bp)
    app.register_blueprint(consultations_bp)
    app.register_blueprint(reports_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {"status": "ok", "service": "LearnLink API", "phase": "Phase 1"}, 200

    return app

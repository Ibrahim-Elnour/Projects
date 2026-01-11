from flask import Blueprint

api = Blueprint("api", __name__, url_prefix="/api")

from .auth import auth_bp
from .incidents import incidents_bp
from .analytics import analytics_bp

api.register_blueprint(auth_bp)
api.register_blueprint(incidents_bp)
api.register_blueprint(analytics_bp)
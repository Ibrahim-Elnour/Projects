from flask import Blueprint, jsonify
from sqlalchemy import func
from ..extensions import db
from ..models import Incident

analytics_bp = Blueprint("analytics", __name__, url_prefix="/analytics")

@analytics_bp.get("/top-categories")
def top_categories():
    # Interpret "category" as severity for now (simple + real).
    rows = (
        db.session.query(Incident.severity, func.count(Incident.id))
        .group_by(Incident.severity)
        .order_by(func.count(Incident.id).desc())
        .all()
    )
    return jsonify([{"severity": sev, "count": cnt} for sev, cnt in rows]), 200

@analytics_bp.get("/average-resolution-time")
def avg_resolution_time():
    # Average time from created_at to resolved_at in seconds for resolved incidents
    rows = (
        db.session.query(func.avg(func.extract("epoch", Incident.resolved_at - Incident.created_at)))
        .filter(Incident.status == "resolved")
        .filter(Incident.resolved_at.isnot(None))
        .all()
    )
    avg_seconds = rows[0][0]
    return jsonify({"average_resolution_seconds": float(avg_seconds) if avg_seconds else None}), 200

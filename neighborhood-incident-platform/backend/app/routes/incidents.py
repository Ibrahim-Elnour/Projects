from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Incident, Comment, User
from ..utils import error, parse_int

incidents_bp = Blueprint("incidents", __name__, url_prefix="/incidents")

VALID_STATUSES = {"open", "in_progress", "resolved"}
VALID_SEVERITIES = {"low", "medium", "high"}

def incident_to_dict(i: Incident):
    return {
        "id": i.id,
        "title": i.title,
        "description": i.description,
        "severity": i.severity,
        "status": i.status,
        "latitude": i.latitude,
        "longitude": i.longitude,
        "created_at": i.created_at.isoformat(),
        "resolved_at": i.resolved_at.isoformat() if i.resolved_at else None,
        "user_id": i.user_id,
    }

@incidents_bp.post("")
@jwt_required()
def create_incident():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    severity = (data.get("severity") or "").strip().lower()

    if not title or not description:
        return error("title and description are required", 400)
    if severity not in VALID_SEVERITIES:
        return error("severity must be one of: low, medium, high", 400)

    user_id = int(get_jwt_identity())

    inc = Incident(
        title=title,
        description=description,
        severity=severity,
        status="open",
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        user_id=user_id,
    )
    db.session.add(inc)
    db.session.commit()
    return jsonify(incident_to_dict(inc)), 201

@incidents_bp.get("")
def list_incidents():
    # Filters: severity, status, since, until
    severity = (request.args.get("severity") or "").lower()
    status = (request.args.get("status") or "").lower()
    page = parse_int(request.args.get("page"), 1) or 1
    page_size = min(parse_int(request.args.get("page_size"), 10) or 10, 50)

    q = Incident.query

    if severity:
        q = q.filter(Incident.severity == severity)
    if status:
        q = q.filter(Incident.status == status)

    # Time filters (ISO 8601)
    since = request.args.get("since")
    until = request.args.get("until")
    try:
        if since:
            q = q.filter(Incident.created_at >= datetime.fromisoformat(since))
        if until:
            q = q.filter(Incident.created_at <= datetime.fromisoformat(until))
    except ValueError:
        return error("since/until must be ISO 8601 timestamps", 400)

    q = q.order_by(Incident.created_at.desc())
    pagination = q.paginate(page=page, per_page=page_size, error_out=False)

    return jsonify({
        "items": [incident_to_dict(i) for i in pagination.items],
        "page": page,
        "page_size": page_size,
        "total": pagination.total,
    }), 200

@incidents_bp.get("/<int:incident_id>")
def get_incident(incident_id: int):
    inc = Incident.query.get(incident_id)
    if not inc:
        return error("incident not found", 404)
    return jsonify(incident_to_dict(inc)), 200

@incidents_bp.patch("/<int:incident_id>")
@jwt_required()
def update_incident(incident_id: int):
    inc = Incident.query.get(incident_id)
    if not inc:
        return error("incident not found", 404)

    user_id = int(get_jwt_identity())
    if inc.user_id != user_id:
        return error("forbidden", 403)

    data = request.get_json() or {}
    if "title" in data:
        inc.title = (data.get("title") or "").strip() or inc.title
    if "description" in data:
        inc.description = (data.get("description") or "").strip() or inc.description
    if "severity" in data:
        sev = (data.get("severity") or "").lower()
        if sev not in VALID_SEVERITIES:
            return error("invalid severity", 400)
        inc.severity = sev

    db.session.commit()
    return jsonify(incident_to_dict(inc)), 200

@incidents_bp.patch("/<int:incident_id>/status")
@jwt_required()
def update_status(incident_id: int):
    inc = Incident.query.get(incident_id)
    if not inc:
        return error("incident not found", 404)

    data = request.get_json() or {}
    new_status = (data.get("status") or "").lower()
    if new_status not in VALID_STATUSES:
        return error("status must be one of: open, in_progress, resolved", 400)

    inc.status = new_status
    inc.resolved_at = datetime.utcnow() if new_status == "resolved" else None

    db.session.commit()
    return jsonify(incident_to_dict(inc)), 200

@incidents_bp.delete("/<int:incident_id>")
@jwt_required()
def delete_incident(incident_id: int):
    inc = Incident.query.get(incident_id)
    if not inc:
        return error("incident not found", 404)

    user_id = int(get_jwt_identity())
    if inc.user_id != user_id:
        return error("forbidden", 403)

    db.session.delete(inc)
    db.session.commit()
    return jsonify({"deleted": True}), 200

@incidents_bp.post("/<int:incident_id>/comments")
@jwt_required()
def add_comment(incident_id: int):
    inc = Incident.query.get(incident_id)
    if not inc:
        return error("incident not found", 404)

    data = request.get_json() or {}
    body = (data.get("body") or "").strip()
    if not body:
        return error("body is required", 400)

    user_id = int(get_jwt_identity())

    c = Comment(body=body, incident_id=incident_id, user_id=user_id)
    db.session.add(c)
    db.session.commit()

    return jsonify({
        "id": c.id,
        "body": c.body,
        "incident_id": c.incident_id,
        "user_id": c.user_id,
        "created_at": c.created_at.isoformat()
    }), 201

@incidents_bp.get("/<int:incident_id>/comments")
def list_comments(incident_id: int):
    inc = Incident.query.get(incident_id)
    if not inc:
        return error("incident not found", 404)

    comments = Comment.query.filter_by(incident_id=incident_id).order_by(Comment.created_at.asc()).all()
    return jsonify([{
        "id": c.id,
        "body": c.body,
        "incident_id": c.incident_id,
        "user_id": c.user_id,
        "created_at": c.created_at.isoformat()
    } for c in comments]), 200

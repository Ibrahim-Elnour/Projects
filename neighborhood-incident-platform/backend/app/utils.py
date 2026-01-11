from flask import jsonify

def error(message: str, status_code: int = 400):
    return jsonify({"error": message}), status_code

def parse_int(value, default=None):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default
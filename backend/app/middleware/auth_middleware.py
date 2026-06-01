from functools import wraps

from flask import jsonify, request

from backend.app.services.auth_service import verify_admin_token


def admin_required(route_handler):
    @wraps(route_handler)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        parts = auth_header.split(" ", 1)

        token = None
        if len(parts) == 2 and parts[0] == "Bearer":
            token = parts[1].strip()
        else:
            # Support token via query for browser media tags (<img>/<video>)
            # that cannot attach custom Authorization headers.
            token = (request.args.get("access_token") or "").strip() or None

        if not token:
            return jsonify({"error": "Unauthorized"}), 401

        payload = verify_admin_token(token)
        if not payload:
            return jsonify({"error": "Unauthorized"}), 401

        request.admin = payload
        return route_handler(*args, **kwargs)

    return wrapper

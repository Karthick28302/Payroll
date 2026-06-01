from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash

from backend.app.models.user_model import get_admin_by_username
from backend.app.services.auth_service import generate_admin_token

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/login", methods=["POST"])
def login():
    body = request.json or {}
    username = body.get("username", "").strip()
    password = body.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    admin = get_admin_by_username(username)
    if not admin:
        return jsonify({"error": "Invalid credentials"}), 401

    stored = admin["password"]
    valid = (
        check_password_hash(stored, password)
        if stored.startswith("$2")
        else stored == password
    )

    if not valid:
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_admin_token(username)
    return jsonify({
        "message": "Login successful",
        "data": {
            "token": token,
            "admin": {"username": username, "role": "admin"},
        },
    })

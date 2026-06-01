from flask import Blueprint, request, jsonify
from backend.app.middleware.auth_middleware import admin_required

from backend.app.services.registration_service import (
    build_registration_details,
    register_user_from_image,
    sync_employee_account,
)
from backend.app.models.user_model import (
    get_all_users,
    get_user_by_id,
    update_user_compensation,
    delete_user_by_id,
)
from backend.app.models.attendance_model import get_user_attendance_summary
from backend.app.services.face_recognition_service import reload_encodings
from backend.app.utils.face_utils import remove_encodings_for_name

user_bp = Blueprint("users", __name__)


@user_bp.route("/register", methods=["POST"])
@admin_required
def register_user():
    body = request.json or {}
    name = body.get("name", "")
    image_data = body.get("image", "")
    employee_profile = {
        "employeeCode": body.get("employeeCode", ""),
        "email": body.get("email", ""),
        "password": body.get("password", ""),
        "department": body.get("department", ""),
        "designation": body.get("designation", ""),
        "phone": body.get("phone", ""),
        "address": body.get("address", ""),
    }

    response, status_code = register_user_from_image(name, image_data, employee_profile)
    return jsonify(response), status_code


@user_bp.route("/sync-employee", methods=["POST"])
@admin_required
def retry_employee_sync():
    body = request.json or {}
    payload = body.get("payload") if isinstance(body.get("payload"), dict) else body

    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid sync payload"}), 400

    required_fields = ("employeeCode", "fullName", "email", "password")
    missing = [field for field in required_fields if not str(payload.get(field, "")).strip()]
    if missing:
        return jsonify({"error": f"Missing sync fields: {', '.join(missing)}"}), 400

    synced, sync_response = sync_employee_account(payload)
    if synced:
        registration = build_registration_details(
            int(payload.get("userId") or 0),
            payload,
        )
        return jsonify({
            "message": "Employee account synced successfully.",
            "registration": registration,
            "employee_sync": {
                "status": "ok",
                "payload": payload,
                "employeeCode": payload.get("employeeCode"),
                "email": payload.get("email"),
                "temporaryPassword": payload.get("password"),
                "passwordGenerated": bool(payload.get("passwordGenerated", False)),
                "userId": payload.get("userId"),
                "role": "employee",
                "department": payload.get("department"),
            },
        }), 200

    return jsonify({
        "message": "Employee sync failed.",
        "registration": build_registration_details(
            int(payload.get("userId") or 0),
            payload,
        ),
        "employee_sync": {
            "status": "failed",
            "payload": payload,
            "reason": sync_response.get("message", "Unknown sync error"),
            "employeeCode": payload.get("employeeCode"),
            "email": payload.get("email"),
            "temporaryPassword": payload.get("password"),
            "passwordGenerated": bool(payload.get("passwordGenerated", False)),
            "userId": payload.get("userId"),
            "role": "employee",
            "department": payload.get("department"),
        },
    }), 502

@user_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    users = get_all_users()
    return jsonify(users), 200


@user_bp.route("/users/<int:user_id>", methods=["GET"])
@admin_required
def get_user_details(user_id):
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    summary = get_user_attendance_summary(user_id) or {}
    return jsonify({
        "user": user,
        "summary": {
            "total_records": summary.get("total_records", 0) or 0,
            "today_records": summary.get("today_records", 0) or 0,
            "currently_present": summary.get("currently_present", 0) or 0,
        }
    }), 200


@user_bp.route("/users/<int:user_id>/compensation", methods=["PUT"])
@admin_required
def update_compensation(user_id):
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    body = request.json or {}

    try:
        monthly_salary = float(body.get("monthly_salary", 0))
        pf_percent = float(body.get("pf_percent", 0))
        savings_percent = float(body.get("savings_percent", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid compensation values"}), 400

    if monthly_salary < 0:
        return jsonify({"error": "monthly_salary cannot be negative"}), 400
    if not 0 <= pf_percent <= 100:
        return jsonify({"error": "pf_percent must be between 0 and 100"}), 400
    if not 0 <= savings_percent <= 100:
        return jsonify({"error": "savings_percent must be between 0 and 100"}), 400

    updated = update_user_compensation(
        user_id=user_id,
        monthly_salary=monthly_salary,
        pf_percent=pf_percent,
        savings_percent=savings_percent,
    )
    if not updated:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"message": "Compensation updated"}), 200


@user_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    deleted = delete_user_by_id(user_id)
    if not deleted:
        return jsonify({"error": "User not found"}), 404

    # Remove this name from in-memory and persisted encodings.
    try:
        remove_encodings_for_name(user["name"])
        reload_encodings()
    except Exception as exc:
        print(f"[users.delete_user] warning: encoding cleanup failed: {exc}")

    return jsonify({"message": f"User '{user['name']}' deleted"}), 200

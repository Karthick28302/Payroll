from flask import Blueprint, jsonify

from backend.app.middleware.auth_middleware import admin_required
from backend.app.models.attendance_model import delete_all_attendance_records
from backend.app.services.face_recognition_service import reload_encodings
from backend.app.utils.face_utils import clear_all_encodings

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/admin/encodings/clear", methods=["POST"])
@admin_required
def clear_encodings():
    clear_all_encodings()
    reload_encodings()
    return jsonify({"message": "All face encodings cleared"}), 200


@admin_bp.route("/admin/attendance/reset", methods=["POST"])
@admin_required
def reset_attendance():
    deleted = delete_all_attendance_records()
    return jsonify({
        "message": "All attendance records deleted",
        "deleted": deleted,
    }), 200

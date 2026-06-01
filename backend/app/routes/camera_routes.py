import cv2
from flask import Blueprint, Response, jsonify, request

from backend.app.models.camera_source_model import (
    create_camera_source,
    delete_camera_source,
    get_camera_source_by_id,
    list_camera_health_logs,
    list_camera_recordings,
    list_camera_sources,
    set_active_camera_source,
    update_camera_source,
)
from backend.app.services.camera_service import (
    generate_frames,
    get_camera_status,
    get_recording_status,
    start_recording,
    stop_recording,
)
from backend.app.services.camera_service import release_camera
from backend.app.middleware.auth_middleware import admin_required

camera_bp = Blueprint("camera", __name__)


@camera_bp.route("/video_feed")
@admin_required
def video_feed():
    quality = request.args.get("quality", default=75, type=int)
    fps = request.args.get("fps", default=12, type=int)
    scale = request.args.get("scale", default=0.75, type=float)
    process_every = request.args.get("process_every", default=2, type=int)
    return Response(
        generate_frames(
            frame_scale=scale,
            jpeg_quality=quality,
            max_fps=fps,
            process_every_n=process_every,
        ),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@camera_bp.route("/camera/status", methods=["GET"])
@admin_required
def camera_status():
    return jsonify(get_camera_status())


@camera_bp.route("/camera/health-logs", methods=["GET"])
@admin_required
def camera_health_logs():
    limit = request.args.get("limit", default=20, type=int)
    return jsonify(list_camera_health_logs(limit=limit)), 200


@camera_bp.route("/camera/recordings", methods=["GET"])
@admin_required
def camera_recordings():
    limit = request.args.get("limit", default=50, type=int)
    return jsonify(list_camera_recordings(limit=limit)), 200


@camera_bp.route("/camera/recording/status", methods=["GET"])
@admin_required
def camera_recording_status():
    return jsonify(get_recording_status()), 200


@camera_bp.route("/camera/recording/start", methods=["POST"])
@admin_required
def camera_recording_start():
    result = start_recording()
    return jsonify(result), (200 if result.get("ok") else 400)


@camera_bp.route("/camera/recording/stop", methods=["POST"])
@admin_required
def camera_recording_stop():
    result = stop_recording()
    return jsonify(result), (200 if result.get("ok") else 400)


@camera_bp.route("/camera/release", methods=["POST"])
@admin_required
def release_camera_lock():
    release_camera()
    return jsonify({"message": "camera released"}), 200


def _validate_source_payload(body):
    name = (body.get("name") or "").strip()
    source_type = (body.get("source_type") or "usb").strip().lower()
    source_value = body.get("source_value")
    username = (body.get("username") or "").strip() or None
    password_ref = (body.get("password_ref") or "").strip() or None
    is_enabled = bool(body.get("is_enabled", True))

    if not name:
        return None, "name is required"
    if source_type not in ("usb", "rtsp", "http"):
        return None, "source_type must be one of usb, rtsp, http"
    if source_value is None or str(source_value).strip() == "":
        return None, "source_value is required"

    payload = {
        "name": name,
        "source_type": source_type,
        "source_value": str(source_value).strip(),
        "username": username,
        "password_ref": password_ref,
        "is_enabled": is_enabled,
    }
    return payload, None


def _open_test_camera(source_type, source_value):
    if source_type == "usb":
        try:
            stream = int(source_value)
        except (TypeError, ValueError):
            stream = 0
    else:
        stream = source_value

    cam = cv2.VideoCapture(stream)
    if not cam.isOpened():
        return False, "camera source could not be opened"

    ok, _ = cam.read()
    cam.release()
    if not ok:
        return False, "camera opened but no frame received"

    return True, "camera connection successful"


@camera_bp.route("/camera/sources", methods=["GET"])
@admin_required
def get_camera_sources():
    return jsonify(list_camera_sources()), 200


@camera_bp.route("/camera/sources", methods=["POST"])
@admin_required
def add_camera_source():
    payload, error = _validate_source_payload(request.json or {})
    if error:
        return jsonify({"error": error}), 400

    source_id = create_camera_source(
        payload["name"],
        payload["source_type"],
        payload["source_value"],
        payload["username"],
        payload["password_ref"],
        payload["is_enabled"],
    )
    return jsonify({"message": "camera source created", "id": source_id}), 201


@camera_bp.route("/camera/sources/<int:source_id>", methods=["PUT"])
@admin_required
def edit_camera_source(source_id):
    payload, error = _validate_source_payload(request.json or {})
    if error:
        return jsonify({"error": error}), 400

    updated = update_camera_source(
        source_id,
        payload["name"],
        payload["source_type"],
        payload["source_value"],
        payload["username"],
        payload["password_ref"],
        payload["is_enabled"],
    )
    if not updated:
        return jsonify({"error": "camera source not found"}), 404

    return jsonify({"message": "camera source updated"}), 200


@camera_bp.route("/camera/sources/<int:source_id>/activate", methods=["POST"])
@admin_required
def activate_camera_source(source_id):
    source = get_camera_source_by_id(source_id)
    if not source:
        return jsonify({"error": "camera source not found"}), 404

    ok, message = _open_test_camera(source["source_type"], source["source_value"])
    if not ok:
        return jsonify({"error": message}), 400

    activated = set_active_camera_source(source_id)
    if not activated:
        return jsonify({"error": "camera source is disabled or unavailable"}), 400

    release_camera()
    return jsonify({"message": "camera source activated"}), 200


@camera_bp.route("/camera/sources/<int:source_id>", methods=["DELETE"])
@admin_required
def remove_camera_source(source_id):
    source = get_camera_source_by_id(source_id)
    if not source:
        return jsonify({"error": "camera source not found"}), 404

    deleted = delete_camera_source(source_id)
    if not deleted:
        return jsonify({"error": "camera source not found"}), 404

    if source.get("is_active"):
        release_camera()

    return jsonify({"message": "camera source deleted"}), 200


@camera_bp.route("/camera/sources/test", methods=["POST"])
@admin_required
def test_camera_source():
    payload, error = _validate_source_payload(request.json or {})
    if error:
        return jsonify({"error": error}), 400

    ok, message = _open_test_camera(payload["source_type"], payload["source_value"])
    if not ok:
        return jsonify({"ok": False, "message": message}), 400

    return jsonify({"ok": True, "message": message}), 200

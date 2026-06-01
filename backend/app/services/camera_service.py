import cv2
import os
import time
import threading
from datetime import datetime

from backend.app.models.camera_source_model import (
    add_camera_health_log,
    complete_camera_recording,
    create_camera_recording,
    get_active_camera_source,
    list_enabled_camera_sources,
)
from backend.app.services.face_recognition_service import run_recognition_frame

_camera = None
_camera_source_cache = None
_camera_source_meta = None
_last_error_message = ""
_fallback_in_use = False
_camera_lock = threading.Lock()
_recording = {
    "enabled": False,
    "writer": None,
    "recording_id": None,
    "start_time": None,
    "file_path": None,
}


def _resolve_source_value(source):
    if not source:
        return 0

    source_type = (source.get("source_type") or "").lower()
    source_value = source.get("source_value")

    if source_type == "usb":
        try:
            return int(source_value)
        except (TypeError, ValueError):
            return 0

    return source_value


def _open_camera_from_source(source):
    source_value = _resolve_source_value(source)
    backend = cv2.CAP_DSHOW if os.name == "nt" and hasattr(cv2, "CAP_DSHOW") else 0
    cam = cv2.VideoCapture(source_value, backend) if backend else cv2.VideoCapture(source_value)
    return cam, str(source_value)


def _pick_open_camera():
    active_source = get_active_camera_source()
    enabled_sources = list_enabled_camera_sources()

    candidates = []
    if active_source:
        candidates.append(active_source)

    for source in enabled_sources:
        if not active_source or source["id"] != active_source["id"]:
            candidates.append(source)

    if not candidates:
        candidates = [None]

    for idx, source in enumerate(candidates):
        cam, signature = _open_camera_from_source(source)
        if cam.isOpened():
            return cam, signature, source, (idx > 0)

        source_id = source["id"] if source else None
        source_name = source["name"] if source else "Default USB camera"
        add_camera_health_log(source_id, "error", f"Failed to open source: {source_name}")
        cam.release()

    # Last fallback attempt: USB camera index 0
    backend = cv2.CAP_DSHOW if os.name == "nt" and hasattr(cv2, "CAP_DSHOW") else 0
    cam = cv2.VideoCapture(0, backend) if backend else cv2.VideoCapture(0)
    if cam.isOpened():
        return cam, "0", None, True

    cam.release()
    return None, "", None, False


def get_camera():
    global _camera, _camera_source_cache, _camera_source_meta, _fallback_in_use, _last_error_message

    with _camera_lock:
        if (
            _camera is None
            or not _camera.isOpened()
        ):
            if _camera is not None and _camera.isOpened():
                _camera.release()
            _camera = None
            _camera_source_cache = None
            _camera_source_meta = None
            _fallback_in_use = False

            opened_camera, source_signature, source_meta, fallback_used = _pick_open_camera()
            if opened_camera is None:
                _last_error_message = "No available camera source could be opened."
                print("[camera_service] ERROR: No available camera source.")
                return None

            _camera = opened_camera
            _camera_source_cache = source_signature
            _camera_source_meta = source_meta
            _fallback_in_use = fallback_used
            _last_error_message = ""

            source_name = source_meta["name"] if source_meta else "Default USB camera (index 0)"
            add_camera_health_log(source_meta["id"] if source_meta else None, "ok", f"Camera opened: {source_name}")
            print(f"[camera_service] Camera opened successfully ({source_signature})")

        return _camera


def _clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


def generate_frames(frame_scale=1.0, jpeg_quality=80, max_fps=15, process_every_n=1):
    frame_scale = float(_clamp(frame_scale, 0.4, 1.0))
    jpeg_quality = int(_clamp(jpeg_quality, 45, 90))
    max_fps = float(_clamp(max_fps, 5, 30))
    process_every_n = int(_clamp(process_every_n, 1, 5))
    frame_interval = 1.0 / max_fps if max_fps > 0 else 0
    last_emit_time = 0.0
    frame_count = 0
    consecutive_failures = 0

    while True:
        cam = get_camera()
        if cam is None:
            break

        success, frame = cam.read()
        if not success:
            consecutive_failures += 1
            print("[camera_service] Failed to grab frame. Reconnecting...")
            add_camera_health_log(_camera_source_meta["id"] if _camera_source_meta else None, "warning", "Frame read failed. Reconnecting.")
            if consecutive_failures >= 3:
                release_camera()
                consecutive_failures = 0
            time.sleep(0.15)
            continue
        consecutive_failures = 0

        frame_count += 1
        if process_every_n == 1 or (frame_count % process_every_n == 0):
            frame = run_recognition_frame(frame)

        if frame_scale < 1.0:
            frame = cv2.resize(frame, (0, 0), fx=frame_scale, fy=frame_scale, interpolation=cv2.INTER_LINEAR)

        _write_recording_frame(frame)

        ret, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality])
        if not ret:
            continue

        if frame_interval > 0:
            now = time.time()
            elapsed = now - last_emit_time
            if elapsed < frame_interval:
                time.sleep(frame_interval - elapsed)
            last_emit_time = time.time()

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
        )


def _write_recording_frame(frame):
    global _recording
    if not _recording["enabled"]:
        return

    writer = _recording.get("writer")
    if writer is None:
        return
    writer.write(frame)


def start_recording():
    global _recording
    if _recording["enabled"]:
        return {"ok": False, "message": "recording already in progress"}

    cam = get_camera()
    if cam is None or not cam.isOpened():
        return {"ok": False, "message": "camera is not available"}

    source_name = (_camera_source_meta.get("name") if _camera_source_meta else "default_usb").replace(" ", "_")
    now = datetime.now()
    day_folder = now.strftime("%Y-%m-%d")
    out_dir = os.path.join("backend", "recordings", source_name, day_folder)
    os.makedirs(out_dir, exist_ok=True)
    filename = now.strftime("%H%M%S") + ".mp4"
    file_path = os.path.join(out_dir, filename)

    width = int(cam.get(cv2.CAP_PROP_FRAME_WIDTH) or 640)
    height = int(cam.get(cv2.CAP_PROP_FRAME_HEIGHT) or 480)
    fps = cam.get(cv2.CAP_PROP_FPS) or 20.0
    if fps <= 1:
        fps = 20.0

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(file_path, fourcc, fps, (width, height))
    if not writer.isOpened():
        return {"ok": False, "message": "failed to open recording writer"}

    source_id = _camera_source_meta.get("id") if _camera_source_meta else None
    if not source_id:
        writer.release()
        return {"ok": False, "message": "active camera source is not mapped for recording"}
    recording_id = create_camera_recording(source_id, file_path, now)
    _recording.update({
        "enabled": True,
        "writer": writer,
        "recording_id": recording_id,
        "start_time": now,
        "file_path": file_path,
    })
    add_camera_health_log(source_id if source_id else None, "ok", f"Recording started: {file_path}")
    return {"ok": True, "message": "recording started", "file_path": file_path}


def stop_recording():
    global _recording
    if not _recording["enabled"]:
        return {"ok": False, "message": "no active recording"}

    writer = _recording.get("writer")
    if writer is not None:
        writer.release()

    end_time = datetime.now()
    start_time = _recording.get("start_time") or end_time
    duration_seconds = int((end_time - start_time).total_seconds())
    file_path = _recording.get("file_path")
    file_size = os.path.getsize(file_path) if file_path and os.path.exists(file_path) else None
    rec_id = _recording.get("recording_id")
    if rec_id:
        complete_camera_recording(rec_id, end_time, duration_seconds, file_size, "completed")

    add_camera_health_log(_camera_source_meta.get("id") if _camera_source_meta else None, "ok", "Recording stopped")
    _recording = {
        "enabled": False,
        "writer": None,
        "recording_id": None,
        "start_time": None,
        "file_path": None,
    }
    return {"ok": True, "message": "recording stopped", "duration_seconds": duration_seconds, "file_path": file_path}


def get_recording_status():
    return {
        "recording": bool(_recording["enabled"]),
        "file_path": _recording.get("file_path"),
        "started_at": _recording.get("start_time").isoformat() if _recording.get("start_time") else None,
    }


def release_camera():
    global _camera, _camera_source_cache, _camera_source_meta, _fallback_in_use

    with _camera_lock:
        if _camera is not None and _camera.isOpened():
            _camera.release()
            print("[camera_service] Camera released")
        _camera = None
        _camera_source_cache = None
        _camera_source_meta = None
        _fallback_in_use = False

def get_camera_status():
    global _camera, _last_error_message
    active_source = get_active_camera_source()
    source_label = (
        active_source.get("name")
        if active_source
        else "Default USB camera (index 0)"
    )

    if _camera is not None and _camera.isOpened():
        return {
            "available": True,
            "opened": True,
            "active_source": source_label,
            "current_stream_source": _camera_source_meta.get("name") if _camera_source_meta else "Default USB camera (index 0)",
            "fallback_in_use": _fallback_in_use,
            "message": "camera ready",
        }

    source_value = _resolve_source_value(active_source)
    backend = cv2.CAP_DSHOW if os.name == "nt" and hasattr(cv2, "CAP_DSHOW") else 0
    cam = cv2.VideoCapture(source_value, backend) if backend else cv2.VideoCapture(source_value)
    opened = cam.isOpened()
    if opened:
        cam.release()

    return {
        "available": opened,
        "opened": False,
        "active_source": source_label,
        "current_stream_source": None,
        "fallback_in_use": False,
        "message": "camera ready" if opened else (_last_error_message or "camera not accessible"),
    }

import base64
import cv2
import numpy as np
import json
import re
import secrets
import time
from urllib import request as urlrequest
from urllib import error as urlerror

try:
    import face_recognition  # type: ignore
    FACE_RECOGNITION_AVAILABLE = True
except BaseException:
    face_recognition = None
    FACE_RECOGNITION_AVAILABLE = False

from backend.app.models.user_model import create_user, user_exists
from backend.app.utils.face_utils import append_encoding
from backend.app.services.face_recognition_service import reload_encodings
from backend.app.config import (
    EMPLOYEE_SYNC_KEY,
    EMPLOYEE_SYNC_URL,
)


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", ".", text.strip().lower()).strip(".")


def _generate_temporary_password() -> str:
    # Keep the password strong enough for the employee backend validator.
    return f"Emp@{secrets.token_hex(4)}"


def build_employee_sync_payload(name: str, user_id: int, profile: dict):
    employee_code = (profile.get("employeeCode") or "").strip().upper()
    email = (profile.get("email") or "").strip().lower()
    password = (profile.get("password") or "").strip()
    department = (profile.get("department") or "").strip()
    designation = (profile.get("designation") or "").strip()
    phone = (profile.get("phone") or "").strip()
    address = (profile.get("address") or "").strip()

    if not employee_code:
        employee_code = f"EMP{1000 + user_id}"
    if not email:
        email = f"{_slug(name)}.{user_id}@company.com"
    password_was_provided = bool(password)
    if not password:
        password = _generate_temporary_password()

    return {
        "employeeCode": employee_code,
        "fullName": name.title(),
        "email": email,
        "password": password,
        "passwordGenerated": not password_was_provided,
        "department": department or None,
        "designation": designation or None,
        "phone": phone or None,
        "address": address or None,
    }


def build_registration_details(user_id: int, payload: dict):
    return {
        "userId": user_id,
        "role": "employee",
        "department": payload.get("department"),
        "designation": payload.get("designation"),
        "employeeCode": payload.get("employeeCode"),
        "email": payload.get("email"),
        "temporaryPassword": payload.get("password"),
        "passwordGenerated": bool(payload.get("passwordGenerated", False)),
    }


def sync_employee_account(payload: dict):
    body = json.dumps(payload).encode("utf-8")
    req = urlrequest.Request(
        EMPLOYEE_SYNC_URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-sync-key": EMPLOYEE_SYNC_KEY,
        },
        method="POST",
    )

    last_error = {"message": "Unknown sync error"}
    for attempt in range(1, 4):
        try:
            with urlrequest.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return True, data
        except urlerror.HTTPError as exc:
            try:
                raw = exc.read().decode("utf-8")
                parsed = json.loads(raw) if raw else {}
                msg = parsed.get("message") or parsed.get("error") or f"HTTP {exc.code}"
            except BaseException:
                msg = f"HTTP {exc.code}"

            last_error = {"message": msg}

            # Retry only on server-side errors; client errors need a payload fix.
            if exc.code < 500 or attempt == 3:
                return False, last_error
        except BaseException as exc:
            last_error = {"message": str(exc)}
            if attempt == 3:
                return False, last_error

        time.sleep(0.5 * attempt)

    return False, last_error


def register_user_from_image(name: str, image_data: str, profile: dict | None = None):
    name = name.strip().lower()
    profile = profile or {}

    if not name:
        return {"error": "Name is required"}, 400

    if not image_data:
        return {"error": "No image provided"}, 400

    if user_exists(name):
        return {"error": f"User '{name}' is already registered"}, 409

    if not FACE_RECOGNITION_AVAILABLE:
        return {"error": "Face recognition dependency is missing on server."}, 503

    try:
        img_bytes = base64.b64decode(image_data.split(",")[1])
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    except BaseException:
        return {"error": "Invalid image data"}, 400

    faces = face_recognition.face_locations(rgb)
    encodings = face_recognition.face_encodings(rgb, faces)

    if not encodings:
        return {"error": "No face detected in image"}, 400

    append_encoding(name, encodings[0])
    user_id = create_user(name)
    reload_encodings()

    sync_payload = build_employee_sync_payload(name, user_id, profile)
    registration_details = build_registration_details(user_id, sync_payload)
    synced, sync_response = sync_employee_account(sync_payload)

    if synced:
        return {
            "message": f"User '{name}' registered successfully",
            "registration": registration_details,
            "employee_sync": {
                "status": "ok",
                "payload": sync_payload,
                "employeeCode": sync_payload["employeeCode"],
                "email": sync_payload["email"],
                "temporaryPassword": sync_payload["password"],
                "passwordGenerated": sync_payload.get("passwordGenerated", False),
                "userId": user_id,
                "role": "employee",
                "department": sync_payload.get("department"),
            },
        }, 201

    return {
        "message": f"User '{name}' registered in admin system, but employee login sync failed",
        "registration": registration_details,
        "employee_sync": {
            "status": "failed",
            "payload": sync_payload,
            "reason": sync_response.get("message", "Unknown sync error"),
            "employeeCode": sync_payload["employeeCode"],
            "email": sync_payload["email"],
            "temporaryPassword": sync_payload["password"],
            "passwordGenerated": sync_payload.get("passwordGenerated", False),
            "userId": user_id,
            "role": "employee",
            "department": sync_payload.get("department"),
        },
    }, 201


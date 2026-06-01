import cv2
from datetime import datetime

try:
    import face_recognition  # type: ignore
    FACE_RECOGNITION_AVAILABLE = True
except BaseException as exc:
    face_recognition = None
    FACE_RECOGNITION_AVAILABLE = False
    _face_import_error = str(exc)

from backend.app.config import LOGOUT_DELAY
from backend.app.utils.face_utils import load_encodings
from backend.app.services.attendance_service import mark_attendance, mark_logout

_data = load_encodings()
known_encodings = _data["encodings"]
known_names = _data["names"]

marked_names = set()
last_seen_time = {}


def reload_encodings():
    global known_encodings, known_names

    data = load_encodings()
    known_encodings = data["encodings"]
    known_names = data["names"]
    print("[face_recognition_service] Encodings reloaded")


def run_recognition_frame(frame):
    global marked_names, last_seen_time

    # Graceful fallback so camera stream can still run when face-recognition
    # dependencies are missing on local setup.
    if not FACE_RECOGNITION_AVAILABLE:
        cv2.putText(
            frame,
            "Face recognition unavailable (dependency missing)",
            (10, 28),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 0, 255),
            2,
        )
        return frame

    small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
    rgb = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

    boxes = face_recognition.face_locations(rgb)
    encodings = face_recognition.face_encodings(rgb, boxes)

    detected_names = set()

    for (top, right, bottom, left), encoding in zip(boxes, encodings):
        name = "Unknown"

        if known_encodings:
            matches = face_recognition.compare_faces(known_encodings, encoding)
            face_distances = face_recognition.face_distance(known_encodings, encoding)
            best_idx = face_distances.argmin()

            if matches[best_idx]:
                name = known_names[best_idx].strip().lower()
                detected_names.add(name)
                last_seen_time[name] = datetime.now()

                if name not in marked_names:
                    mark_attendance(name)
                    marked_names.add(name)

        top *= 2
        right *= 2
        bottom *= 2
        left *= 2

        cv2.rectangle(frame, (left, top), (right, bottom), (0, 200, 0), 2)
        cv2.putText(
            frame,
            name,
            (left, top - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 200, 0),
            2,
        )

    now = datetime.now()
    for name in list(last_seen_time.keys()):
        if name not in detected_names:
            if (now - last_seen_time[name]).total_seconds() > LOGOUT_DELAY:
                mark_logout(name)
                del last_seen_time[name]
                marked_names.discard(name)

    return frame


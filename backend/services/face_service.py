import os
import face_recognition
from backend.app.config import DATASET_PATH
from backend.app.utils.face_utils import save_encodings


def encode_faces():
    """
    Walk dataset/<person_name>/ subfolders, encode every image,
    and save all encodings to disk in one shot.
    Uses subfolder-per-person structure for multi-image support.
    """
    known_encodings = []
    known_names = []

    if not os.path.exists(DATASET_PATH):
        print(f"[face_service] Dataset folder not found: {DATASET_PATH}")
        return

    for person_name in os.listdir(DATASET_PATH):
        person_path = os.path.join(DATASET_PATH, person_name)

        if not os.path.isdir(person_path):
            continue

        for image_name in os.listdir(person_path):
            image_path = os.path.join(person_path, image_name)

            print(f"[face_service] Processing {image_path}")

            try:
                image = face_recognition.load_image_file(image_path)
                encodings = face_recognition.face_encodings(image)

                if encodings:
                    known_encodings.append(encodings[0])
                    known_names.append(person_name.strip().lower())
                else:
                    print(f"[face_service] No face found in {image_path}, skipping")
            except Exception as e:
                print(f"[face_service] Error processing {image_path}: {e}")

    save_encodings({"encodings": known_encodings, "names": known_names})
    print(f"[face_service] Done — {len(known_names)} encodings saved")
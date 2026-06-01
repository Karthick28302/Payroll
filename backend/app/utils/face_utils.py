import os
import pickle
from backend.app.config import ENCODINGS_PATH



def load_encodings() -> dict:
    """
    Load face encodings from disk.
    Returns {"encodings": [...], "names": [...]}
    Returns empty dict if file not found (first run before any registration).
    """
    if not os.path.exists(ENCODINGS_PATH):
        print(f"[face_utils] No encodings file at {ENCODINGS_PATH}. Register users first.")
        return {"encodings": [], "names": []}

    with open(ENCODINGS_PATH, "rb") as f:
        return pickle.load(f)


def save_encodings(data: dict):
    """
    Persist face encodings to disk.
    data must be {"encodings": [...], "names": [...]}
    """
    os.makedirs(os.path.dirname(ENCODINGS_PATH), exist_ok=True)
    with open(ENCODINGS_PATH, "wb") as f:
        pickle.dump(data, f)
    print(f"[face_utils] Encodings saved to {ENCODINGS_PATH}")


def append_encoding(name: str, encoding):
    """Add a single new encoding+name to the existing pickle file."""
    data = load_encodings()
    data["encodings"].append(encoding)
    data["names"].append(name.strip().lower())
    save_encodings(data)


def remove_encodings_for_name(name: str):
    """Remove all saved encodings for a user name."""
    target = name.strip().lower()
    data = load_encodings()
    kept_encodings = []
    kept_names = []

    for enc, n in zip(data.get("encodings", []), data.get("names", [])):
        if n.strip().lower() != target:
            kept_encodings.append(enc)
            kept_names.append(n)

    save_encodings({"encodings": kept_encodings, "names": kept_names})


def clear_all_encodings():
    """Remove every saved face encoding from disk."""
    save_encodings({"encodings": [], "names": []})

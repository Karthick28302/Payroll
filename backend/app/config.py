import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

try:
    from dotenv import load_dotenv

    # Always load backend/.env, regardless of current working directory.
    load_dotenv(ENV_PATH)
except ImportError:
    pass


def get_db_config():
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "attendance_system"),
    }


def get_secret_key():
    return os.getenv("SECRET_KEY", "")


def get_encodings_path():
    return os.getenv(
        "ENCODINGS_PATH",
        os.path.join(BASE_DIR, "encodings", "face_encodings.pkl"),
    )


def get_dataset_path():
    return os.getenv(
        "DATASET_PATH",
        os.path.join(BASE_DIR, "dataset"),
    )


def get_logout_delay():
    return int(os.getenv("LOGOUT_DELAY", 5))


def get_employee_sync_url():
    return os.getenv("EMPLOYEE_SYNC_URL", "http://localhost:5001/api/v1/admin/sync-employee")


def get_employee_sync_key():
    return os.getenv("EMPLOYEE_SYNC_KEY", "change_this_sync_key")


def get_default_employee_password():
    return os.getenv("DEFAULT_EMPLOYEE_PASSWORD", "Emp@12345")


# Backwards-compatible snapshots for modules that still import constants.
DB_CONFIG = get_db_config()
SECRET_KEY = get_secret_key()
ENCODINGS_PATH = get_encodings_path()
DATASET_PATH = get_dataset_path()
LOGOUT_DELAY = get_logout_delay()
EMPLOYEE_SYNC_URL = get_employee_sync_url()
EMPLOYEE_SYNC_KEY = get_employee_sync_key()
DEFAULT_EMPLOYEE_PASSWORD = get_default_employee_password()


def validate_config():
    missing = []
    placeholder_like = []
    secret_key = get_secret_key()
    db_config = get_db_config()

    if not secret_key:
        missing.append("SECRET_KEY")

    if not db_config["password"]:
        missing.append("DB_PASSWORD")

    if db_config["password"] and "<" in db_config["password"]:
        placeholder_like.append("DB_PASSWORD")

    if secret_key and "<" in secret_key:
        placeholder_like.append("SECRET_KEY")

    if missing:
        raise RuntimeError(
            "Missing required environment variables: " + ", ".join(missing)
        )

    if placeholder_like:
        raise RuntimeError(
            "Placeholder values detected in .env for: "
            + ", ".join(placeholder_like)
            + ". Replace them with real values."
        )

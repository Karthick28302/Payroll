from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from backend.app.config import get_secret_key

TOKEN_SALT = "smart-attendance-admin-auth"
TOKEN_MAX_AGE_SECONDS = 60 * 60 * 8  # 8 hours


def _serializer():
    secret_key = get_secret_key()
    if not secret_key:
        raise RuntimeError("SECRET_KEY is required to generate admin tokens.")
    return URLSafeTimedSerializer(secret_key)


def generate_admin_token(username: str) -> str:
    return _serializer().dumps({"username": username, "role": "admin"}, salt=TOKEN_SALT)


def verify_admin_token(token: str):
    try:
        payload = _serializer().loads(
            token,
            salt=TOKEN_SALT,
            max_age=TOKEN_MAX_AGE_SECONDS,
        )
        if payload.get("role") != "admin":
            return None
        return payload
    except (BadSignature, SignatureExpired):
        return None

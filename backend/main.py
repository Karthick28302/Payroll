from flask import Flask
from flask_cors import CORS

from backend.app.config import get_secret_key, validate_config
from backend.app.routes.auth_routes import auth_bp
from backend.app.routes.user_routes import user_bp
from backend.app.routes.attendance_routes import attendance_bp
from backend.app.routes.camera_routes import camera_bp
from backend.app.routes.admin_routes import admin_bp
from backend.app.routes.report_routes import report_bp


def create_app():
    validate_config()

    app = Flask(__name__)
    app.secret_key = get_secret_key()

    CORS(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(camera_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(report_bp)

    @app.route("/")
    def home():
        return {"message": "Smart Attendance backend running"}

    @app.route("/health")
    def health():
        return {"status": "ok"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=False, use_reloader=False)

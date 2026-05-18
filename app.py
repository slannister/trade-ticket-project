from flask import Flask, render_template, send_from_directory
from flask_cors import CORS
from config import Config
from src.extensions import db, jwt, bcrypt


def create_app(config_class=Config):
    app = Flask(__name__, template_folder="templates", static_folder="static", static_url_path="/static")
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app)

    import os
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    from src.routes import register_routes
    register_routes(app)

    from src.utils.responses import register_error_handlers
    register_error_handlers(app)

    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        from flask import send_from_directory
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/detail")
    def detail():
        return render_template("detail.html")

    @app.route("/reset-password")
    def reset_password_page():
        return render_template("reset_password.html")

    @app.route("/reset-password", methods=["POST"])
    def reset_password_confirm():
        from flask import request
        from src.services import AuthService
        from src.utils.responses import success, error

        data = request.get_json() or {}
        try:
            user = AuthService.reset_password_with_token(
                token=data.get("token", ""),
                new_password=data.get("new_password", "")
            )
            return success({"user": user.to_dict()}, "Password has been reset")
        except ValueError as e:
            return error(str(e), 400)

    @app.route("/profile")
    def profile_page():
        return render_template("profile.html")

    with app.app_context():
        db.create_all()

    return app
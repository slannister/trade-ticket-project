from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.services import AuthService
from src.utils.responses import success, error

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    try:
        user, token = AuthService.register(
            email=data.get("email", ""),
            password=data.get("password", ""),
            display_name=data.get("display_name", "")
        )
        return success({
            "user": user.to_dict(),
            "access_token": token
        }, "Registration successful", 201)
    except ValueError as e:
        return error(str(e), 400)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    try:
        user, token = AuthService.login(
            email=data.get("email", ""),
            password=data.get("password", "")
        )
        return success({
            "user": user.to_dict(),
            "access_token": token
        }, "Login successful")
    except ValueError as e:
        return error(str(e), 401)


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = AuthService.get_user_by_id(user_id)
    if not user:
        return error("User not found", 404)
    return success({"user": user.to_dict()})


@auth_bp.route("/password/reset", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    try:
        AuthService.reset_password(data.get("email", ""))
        return success(message="If the email exists, a reset link has been sent")
    except ValueError as e:
        return error(str(e), 400)


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return success(message="Logged out successfully")
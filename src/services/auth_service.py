from flask_jwt_extended import create_access_token
from src.extensions import bcrypt, db
from src.models import User
from src.utils.validators import validate_email_format, validate_password


class AuthService:

    @staticmethod
    def register(email: str, password: str, display_name: str = None):
        email = email.strip().lower()
        password = password.strip()
        display_name = display_name.strip() if display_name else None

        valid, msg = validate_email_format(email)
        if not valid:
            raise ValueError(f"Invalid email: {msg}")

        valid, msg = validate_password(password)
        if not valid:
            raise ValueError(msg)

        existing = User.query.filter_by(email=email).first()
        if existing:
            raise ValueError("Email already registered")

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        user = User(
            email=email,
            password_hash=password_hash,
            display_name=display_name or email.split("@")[0]
        )
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=user.id)
        return user, token

    @staticmethod
    def login(email: str, password: str):
        email = email.strip().lower()
        password = password.strip()

        if not email or not password:
            raise ValueError("Email and password are required")

        user = User.query.filter_by(email=email).first()
        if not user or not bcrypt.check_password_hash(user.password_hash, password):
            raise ValueError("Invalid email or password")

        token = create_access_token(identity=user.id)
        return user, token

    @staticmethod
    def get_user_by_id(user_id: str):
        return User.query.get(user_id)

    @staticmethod
    def reset_password(email: str):
        email = email.strip().lower()
        if not email:
            raise ValueError("Email is required")
        return True
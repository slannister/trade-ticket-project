import secrets
from datetime import datetime, timedelta
from flask import current_app
from flask_jwt_extended import create_access_token
from src.extensions import bcrypt, db
from src.utils.validators import escape_html
from src.models import User, PasswordReset
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

        user = User.query.filter_by(email=email).first()
        if not user:
            return True

        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)

        password_reset = PasswordReset(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        db.session.add(password_reset)
        db.session.commit()

        reset_url = f"/reset-password?token={token}"
        reset_link = f"http://localhost:5000{reset_url}"

        return True

    @staticmethod
    def verify_reset_token(token: str):
        password_reset = PasswordReset.query.filter_by(token=token, used=False).first()
        if not password_reset:
            raise ValueError("Invalid or expired token")

        if password_reset.expires_at < datetime.utcnow():
            raise ValueError("Token has expired")

        return password_reset.user

    @staticmethod
    def reset_password_with_token(token: str, new_password: str):
        user = AuthService.verify_reset_token(token)

        valid, msg = validate_password(new_password)
        if not valid:
            raise ValueError(msg)

        password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
        user.password_hash = password_hash

        password_reset = PasswordReset.query.filter_by(token=token).first()
        if password_reset:
            password_reset.used = True

        db.session.commit()
        return user

    @staticmethod
    def update_profile(user_id: str, display_name: str = None, phone: str = None):
        user = User.query.get(user_id)
        if not user:
            raise ValueError("User not found")

        if display_name is not None:
            user.display_name = escape_html(display_name.strip())[:50] if display_name else None

        if phone is not None:
            # Only allow digits, spaces, hyphens, and plus sign in phone
            import re
            cleaned = re.sub(r'[^\d\s\-+]', '', phone)
            user.phone = cleaned.strip()[:20] if cleaned else None

        db.session.commit()
        return user

    @staticmethod
    def update_password(user_id: str, current_password: str, new_password: str):
        user = User.query.get(user_id)
        if not user:
            raise ValueError("User not found")

        if not current_password:
            raise ValueError("Current password is required")

        if not bcrypt.check_password_hash(user.password_hash, current_password):
            raise ValueError("Current password is incorrect")

        valid, msg = validate_password(new_password)
        if not valid:
            raise ValueError(msg)

        user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
        db.session.commit()
        return user
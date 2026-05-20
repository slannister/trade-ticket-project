from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import datetime, timedelta

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    from src.models import TokenBlacklist
    jti = jwt_payload["jti"]
    token = TokenBlacklist.query.filter_by(jti=jti).first()
    return token is not None


def revoke_token(jti, user_id, expires_delta=None):
    from src.models import TokenBlacklist
    if expires_delta is None:
        expires_delta = timedelta(days=7)
    expires_at = datetime.utcnow() + expires_delta
    blacklist_entry = TokenBlacklist(
        jti=jti,
        user_id=user_id,
        expires_at=expires_at
    )
    db.session.add(blacklist_entry)
    db.session.commit()
    return blacklist_entry
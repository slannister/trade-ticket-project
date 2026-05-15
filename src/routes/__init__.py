from flask import Flask
from .auth import auth_bp
from .listings import listings_bp
from .inquiries import inquiries_bp
from .favorites import favorites_bp
from .upload import upload_bp


def register_routes(app: Flask):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(listings_bp, url_prefix="/api/listings")
    app.register_blueprint(inquiries_bp, url_prefix="/api/inquiries")
    app.register_blueprint(favorites_bp, url_prefix="/api/favorites")
    app.register_blueprint(upload_bp, url_prefix="/api/upload")
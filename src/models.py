import uuid
from datetime import datetime
from src.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    listings = db.relationship("Listing", backref="owner", lazy="dynamic")
    inquiries = db.relationship("Inquiry", backref="sender", lazy="dynamic")
    favorites = db.relationship("Favorite", backref="user", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "display_name": self.display_name or self.email,
            "phone": self.phone,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Listing(db.Model):
    __tablename__ = "listings"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # auction, transfer, swap, request
    category = db.Column(db.String(50))
    quantity = db.Column(db.Integer, default=1)
    face_value = db.Column(db.Float)
    buy_now = db.Column(db.Float)
    delivery_method = db.Column(db.String(20))  # meetup, shipping
    location = db.Column(db.String(200))
    expires_at = db.Column(db.DateTime)
    swap_preferences = db.Column(db.Text)
    description = db.Column(db.Text)
    urgency = db.Column(db.String(20), default="normal")
    images = db.Column(db.JSON, default=list)
    owner_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    inquiries = db.relationship("Inquiry", backref="listing", lazy="dynamic")
    favorited_by = db.relationship("Favorite", backref="listing", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type,
            "category": self.category,
            "quantity": self.quantity,
            "face_value": self.face_value,
            "buy_now": self.buy_now,
            "delivery_method": self.delivery_method,
            "location": self.location,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "swap_preferences": self.swap_preferences,
            "description": self.description,
            "urgency": self.urgency,
            "images": self.images or [],
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "owner": {
                "id": self.owner.id,
                "display_name": self.owner.display_name or self.owner.email,
                "email": self.owner.email
            } if self.owner else None
        }


class Inquiry(db.Model):
    __tablename__ = "inquiries"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = db.Column(db.String(36), db.ForeignKey("listings.id"), nullable=False)
    sender_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    sender_contact = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "listing_id": self.listing_id,
            "sender_id": self.sender_id,
            "sender_contact": self.sender_contact,
            "message": self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "listing": {
                "id": self.listing.id,
                "title": self.listing.title,
                "category": self.listing.category,
                "type": self.listing.type,
                "images": self.listing.images or []
            } if self.listing else None
        }


class Favorite(db.Model):
    __tablename__ = "favorites"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    listing_id = db.Column(db.String(36), db.ForeignKey("listings.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "listing_id", name="unique_user_listing_favorite"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "listing_id": self.listing_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class PasswordReset(db.Model):
    __tablename__ = "password_resets"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="password_resets")
from src.extensions import db
from src.models import Inquiry, Listing


class InquiryService:

    @staticmethod
    def get_by_owner(owner_id: str):
        return Inquiry.query.filter(
            Inquiry.parent_id == None,
            Listing.owner_id == owner_id
        ).join(Listing).order_by(Inquiry.created_at.desc()).all()

    @staticmethod
    def get_by_sender(sender_id: str):
        return Inquiry.query.filter(
            Inquiry.sender_id == sender_id,
            Inquiry.parent_id == None
        ).order_by(Inquiry.created_at.desc()).all()

    @staticmethod
    def get_all_for_user(user_id: str):
        owned = Inquiry.query.filter(
            Inquiry.parent_id == None,
            Listing.owner_id == user_id
        ).join(Listing)
        sent = Inquiry.query.filter(
            Inquiry.sender_id == user_id,
            Inquiry.parent_id == None
        )
        combined = owned.union(sent)
        return combined.order_by(Inquiry.created_at.desc()).all()

    @staticmethod
    def get_replies(parent_id: str):
        return Inquiry.query.filter(
            Inquiry.parent_id == parent_id
        ).order_by(Inquiry.created_at.asc()).all()

    @staticmethod
    def create(listing_id: str, message: str, sender_id: str = None, sender_contact: str = "Guest", parent_id: str = None):
        if not message:
            raise ValueError("Message is required")
        if not listing_id:
            raise ValueError("listing_id is required")

        listing = Listing.query.get(listing_id)
        if not listing:
            raise ValueError("Listing not found")

        inquiry = Inquiry(
            listing_id=listing_id,
            sender_id=sender_id,
            sender_contact=sender_contact,
            message=message,
            parent_id=parent_id
        )
        db.session.add(inquiry)
        db.session.commit()
        return inquiry

    @staticmethod
    def reply(parent_id: str, message: str, sender_id: str = None, sender_contact: str = "Guest"):
        if not message:
            raise ValueError("Message is required")
        if not parent_id:
            raise ValueError("parent_id is required")

        parent = Inquiry.query.get(parent_id)
        if not parent:
            raise ValueError("Inquiry not found")

        reply = Inquiry(
            listing_id=parent.listing_id,
            sender_id=sender_id,
            sender_contact=sender_contact,
            message=message,
            parent_id=parent_id
        )
        db.session.add(reply)
        db.session.commit()
        return reply
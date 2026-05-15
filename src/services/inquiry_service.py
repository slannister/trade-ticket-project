from src.extensions import db
from src.models import Inquiry, Listing


class InquiryService:

    @staticmethod
    def get_by_owner(owner_id: str):
        return Inquiry.query.join(Listing).filter(
            Listing.owner_id == owner_id
        ).order_by(Inquiry.created_at.desc()).all()

    @staticmethod
    def create(listing_id: str, message: str, sender_id: str = None, sender_contact: str = "Guest"):
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
            message=message
        )
        db.session.add(inquiry)
        db.session.commit()
        return inquiry
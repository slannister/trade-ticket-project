from src.extensions import db
from src.models import Inquiry, Listing
from src.utils.validators import escape_html


def sanitize_text(text, max_length=2000):
    """Escape HTML and truncate text."""
    if text is None:
        return None
    escaped = escape_html(str(text))
    return escaped[:max_length] if max_length else escaped


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
            sender_contact=sanitize_text(sender_contact, 100),
            message=sanitize_text(message),
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
            sender_contact=sanitize_text(sender_contact, 100),
            message=sanitize_text(message),
            parent_id=parent_id
        )
        db.session.add(reply)
        db.session.commit()
        return reply

    @staticmethod
    def mark_as_read(inquiry_id: str, user_id: str):
        inquiry = Inquiry.query.get(inquiry_id)
        if not inquiry:
            raise ValueError("Inquiry not found")

        # User can mark as read if:
        # 1. They own the listing, OR
        # 2. They sent the original inquiry
        from src.models import Listing
        listing = Listing.query.get(inquiry.listing_id)
        is_owner = listing and listing.owner_id == user_id
        is_sender = inquiry.sender_id == user_id

        if not is_owner and not is_sender:
            raise ValueError("Access denied")

        # Mark the inquiry itself as read
        inquiry.read = True

        # Also mark all replies to this inquiry as read
        replies = Inquiry.query.filter(Inquiry.parent_id == inquiry_id).all()
        for reply in replies:
            reply.read = True

        db.session.commit()
        return inquiry

    @staticmethod
    def get_unread_count(user_id: str):
        from src.models import Listing
        count = 0

        # Count inquiries on user's listings that are unread (from senders, not user themselves)
        owned_inquiries = Inquiry.query.filter(
            Inquiry.parent_id == None,
            Inquiry.read == False,
            Listing.owner_id == user_id,
            Inquiry.sender_id != user_id
        ).join(Listing).all()

        count += len(owned_inquiries)

        # Count user's sent inquiries that have unread replies (from others, not self)
        sent_inquiries = Inquiry.query.filter(
            Inquiry.sender_id == user_id,
            Inquiry.parent_id == None
        ).all()

        for inq in sent_inquiries:
            replies = Inquiry.query.filter(
                Inquiry.parent_id == inq.id,
                Inquiry.read == False,
                Inquiry.sender_id != user_id
            ).all()
            if replies:
                count += 1

        return count
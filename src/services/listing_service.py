from datetime import datetime
from src.extensions import db
from src.models import Listing
from src.utils.validators import escape_html


def sanitize_text(text, max_length=1000):
    """Escape HTML and truncate text."""
    if text is None:
        return None
    escaped = escape_html(str(text))
    return escaped[:max_length] if max_length else escaped


class ListingService:

    @staticmethod
    def get_all(filters=None, page=1, per_page=20):
        query = Listing.query

        if filters:
            if filters.get('category') and filters['category'] != 'all':
                query = query.filter(Listing.category == filters['category'])
            if filters.get('type') and filters['type'] != 'all':
                query = query.filter(Listing.type == filters['type'])
            if filters.get('delivery') and filters['delivery'] != 'all':
                query = query.filter(Listing.delivery_method == filters['delivery'])
            if filters.get('search'):
                search = f"%{filters['search']}%"
                query = query.filter(
                    db.or_(
                        Listing.title.ilike(search),
                        Listing.description.ilike(search)
                    )
                )
            if filters.get('quantity_min'):
                query = query.filter(Listing.quantity >= filters['quantity_min'])
            if filters.get('created_start'):
                try:
                    start_date = datetime.fromisoformat(filters['created_start'])
                    query = query.filter(Listing.created_at >= start_date)
                except ValueError:
                    pass
            if filters.get('created_end'):
                try:
                    end_date = datetime.fromisoformat(filters['created_end'] + 'T23:59:59')
                    query = query.filter(Listing.created_at <= end_date)
                except ValueError:
                    pass
            if filters.get('expires_start'):
                try:
                    start_date = datetime.fromisoformat(filters['expires_start'])
                    query = query.filter(Listing.expires_at >= start_date)
                except ValueError:
                    pass
            if filters.get('expires_end'):
                try:
                    end_date = datetime.fromisoformat(filters['expires_end'] + 'T23:59:59')
                    query = query.filter(Listing.expires_at <= end_date)
                except ValueError:
                    pass

        query = query.order_by(Listing.created_at.desc())
        total = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total

    @staticmethod
    def get_by_id(listing_id: str):
        return Listing.query.get(listing_id)

    @staticmethod
    def get_by_owner(owner_id: str):
        return Listing.query.filter_by(owner_id=owner_id).order_by(Listing.created_at.desc()).all()

    @staticmethod
    def create(title: str, type: str, owner_id: str, data: dict = None):
        if not title or not type:
            raise ValueError("Title and type are required")

        expires_at = None
        if data and data.get('expires_at'):
            try:
                expires_at = datetime.fromisoformat(data['expires_at'].replace("Z", "+00:00"))
            except ValueError:
                raise ValueError("Invalid expires_at format")

        listing = Listing(
            title=sanitize_text(title, 200),
            type=type,
            owner_id=owner_id,
            category=sanitize_text(data.get('category'), 50) if data else None,
            quantity=data.get('quantity', 1) if data else 1,
            face_value=data.get('face_value') if data else None,
            buy_now=data.get('buy_now') if data else None,
            delivery_method=data.get('delivery_method') if data else None,
            location=sanitize_text(data.get('location'), 100) if data else None,
            expires_at=expires_at,
            swap_preferences=sanitize_text(data.get('swap_preferences'), 500) if data else None,
            description=sanitize_text(data.get('description'), 5000) if data else None,
            urgency=data.get('urgency', 'normal') if data else 'normal',
            images=data.get('images', []) if data else []
        )
        db.session.add(listing)
        db.session.commit()
        return listing

    @staticmethod
    def update(listing: Listing, data: dict):
        if 'title' in data:
            listing.title = data['title']
        if 'type' in data:
            listing.type = data['type']
        if 'category' in data:
            listing.category = data['category']
        if 'quantity' in data:
            listing.quantity = data['quantity']
        if 'face_value' in data:
            listing.face_value = data['face_value']
        if 'buy_now' in data:
            listing.buy_now = data['buy_now']
        if 'delivery_method' in data:
            listing.delivery_method = data['delivery_method']
        if 'location' in data:
            listing.location = data['location']
        if 'expires_at' in data:
            try:
                listing.expires_at = datetime.fromisoformat(data['expires_at'].replace("Z", "+00:00"))
            except ValueError:
                raise ValueError("Invalid expires_at format")
        if 'swap_preferences' in data:
            listing.swap_preferences = data['swap_preferences']
        if 'description' in data:
            listing.description = data['description']
        if 'urgency' in data:
            listing.urgency = data['urgency']
        if 'images' in data:
            listing.images = data['images']
        if 'status' in data:
            listing.status = data['status']

        db.session.commit()
        return listing

    @staticmethod
    def delete(listing: Listing):
        db.session.delete(listing)
        db.session.commit()
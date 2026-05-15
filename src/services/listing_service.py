from datetime import datetime
from src.extensions import db
from src.models import Listing


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
            title=title,
            type=type,
            owner_id=owner_id,
            category=data.get('category') if data else None,
            quantity=data.get('quantity', 1) if data else 1,
            face_value=data.get('face_value') if data else None,
            buy_now=data.get('buy_now') if data else None,
            delivery_method=data.get('delivery_method') if data else None,
            location=data.get('location') if data else None,
            expires_at=expires_at,
            swap_preferences=data.get('swap_preferences') if data else None,
            description=data.get('description') if data else None,
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

        db.session.commit()
        return listing

    @staticmethod
    def delete(listing: Listing):
        db.session.delete(listing)
        db.session.commit()
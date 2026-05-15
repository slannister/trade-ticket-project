from src.extensions import db
from src.models import Favorite, Listing


class FavoriteService:

    @staticmethod
    def get_by_user(user_id: str):
        favorites = Favorite.query.filter_by(user_id=user_id).order_by(Favorite.created_at.desc()).all()
        return [fav.listing for fav in favorites if fav.listing]

    @staticmethod
    def add(user_id: str, listing_id: str):
        listing = Listing.query.get(listing_id)
        if not listing:
            raise ValueError("Listing not found")

        existing = Favorite.query.filter_by(user_id=user_id, listing_id=listing_id).first()
        if existing:
            return existing

        favorite = Favorite(user_id=user_id, listing_id=listing_id)
        db.session.add(favorite)
        db.session.commit()
        return favorite

    @staticmethod
    def remove(user_id: str, listing_id: str):
        favorite = Favorite.query.filter_by(user_id=user_id, listing_id=listing_id).first()
        if not favorite:
            raise ValueError("Not in favorites")

        db.session.delete(favorite)
        db.session.commit()
        return True

    @staticmethod
    def is_favorite(user_id: str, listing_id: str):
        return Favorite.query.filter_by(user_id=user_id, listing_id=listing_id).first() is not None
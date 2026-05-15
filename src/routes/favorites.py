from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.services import FavoriteService
from src.utils.responses import success, error

favorites_bp = Blueprint("favorites", __name__)


@favorites_bp.route("", methods=["GET"])
@jwt_required()
def get_favorites():
    user_id = get_jwt_identity()
    listings = FavoriteService.get_by_user(user_id)
    return success({"favorites": [l.to_dict() for l in listings]})


@favorites_bp.route("/<listing_id>", methods=["POST"])
@jwt_required()
def add_favorite(listing_id):
    user_id = get_jwt_identity()
    try:
        FavoriteService.add(user_id, listing_id)
        return success(message="Added to favorites", status_code=201)
    except ValueError as e:
        return error(str(e), 404)


@favorites_bp.route("/<listing_id>", methods=["DELETE"])
@jwt_required()
def remove_favorite(listing_id):
    user_id = get_jwt_identity()
    try:
        FavoriteService.remove(user_id, listing_id)
        return success(message="Removed from favorites")
    except ValueError as e:
        return error(str(e), 404)
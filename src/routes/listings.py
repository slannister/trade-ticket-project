from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.services import ListingService
from src.utils.responses import success, error, paginated

listings_bp = Blueprint("listings", __name__)


@listings_bp.route("", methods=["GET"])
def get_listings():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    filters = {
        "category": request.args.get("category"),
        "type": request.args.get("type"),
        "delivery": request.args.get("delivery"),
        "search": request.args.get("search")
    }

    items, total = ListingService.get_all(filters, page, per_page)
    return success({
        "listings": [l.to_dict() for l in items],
        "pagination": paginated([l.to_dict() for l in items], total, page, per_page)
    })


@listings_bp.route("", methods=["POST"])
@jwt_required()
def create_listing():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    try:
        listing = ListingService.create(
            title=data.get("title"),
            type=data.get("type"),
            owner_id=user_id,
            data=data
        )
        return success({"listing": listing.to_dict()}, "Listing created", 201)
    except ValueError as e:
        return error(str(e), 400)


@listings_bp.route("/<listing_id>", methods=["GET"])
def get_listing(listing_id):
    listing = ListingService.get_by_id(listing_id)
    if not listing:
        return error("Listing not found", 404)
    return success({"listing": listing.to_dict()})


@listings_bp.route("/<listing_id>", methods=["PUT"])
@jwt_required()
def update_listing(listing_id):
    user_id = get_jwt_identity()
    listing = ListingService.get_by_id(listing_id)

    if not listing:
        return error("Listing not found", 404)
    if listing.owner_id != user_id:
        return error("Access denied", 403)

    data = request.get_json() or {}
    try:
        listing = ListingService.update(listing, data)
        return success({"listing": listing.to_dict()}, "Listing updated")
    except ValueError as e:
        return error(str(e), 400)


@listings_bp.route("/<listing_id>", methods=["DELETE"])
@jwt_required()
def delete_listing(listing_id):
    user_id = get_jwt_identity()
    listing = ListingService.get_by_id(listing_id)

    if not listing:
        return error("Listing not found", 404)
    if listing.owner_id != user_id:
        return error("Access denied", 403)

    ListingService.delete(listing)
    return success(message="Listing deleted")


@listings_bp.route("/mine", methods=["GET"])
@jwt_required()
def get_my_listings():
    user_id = get_jwt_identity()
    listings = ListingService.get_by_owner(user_id)
    return success({"listings": [l.to_dict() for l in listings]})
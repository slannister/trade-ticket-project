from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.services import InquiryService
from src.utils.responses import success, error

inquiries_bp = Blueprint("inquiries", __name__)


@inquiries_bp.route("", methods=["GET"])
@jwt_required()
def get_inquiries():
    user_id = get_jwt_identity()
    inquiries = InquiryService.get_by_owner(user_id)
    return success({"inquiries": [i.to_dict() for i in inquiries]})


@inquiries_bp.route("", methods=["POST"])
def create_inquiry():
    data = request.get_json() or {}

    user_id = None
    sender_contact = data.get("sender_contact", "Guest")

    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        if user_id:
            from src.services import AuthService
            user = AuthService.get_user_by_id(user_id)
            if user:
                sender_contact = user.email
    except Exception:
        pass

    try:
        inquiry = InquiryService.create(
            listing_id=data.get("listing_id"),
            message=data.get("message"),
            sender_id=user_id,
            sender_contact=sender_contact
        )
        return success({"inquiry": inquiry.to_dict()}, "Inquiry sent", 201)
    except ValueError as e:
        return error(str(e), 400)
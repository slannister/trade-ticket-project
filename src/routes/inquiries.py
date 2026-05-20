from flask import Blueprint, request, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.extensions import limiter
from src.services import InquiryService
from src.utils.responses import success, error
import json

inquiries_bp = Blueprint("inquiries", __name__)


@inquiries_bp.route("", methods=["GET"])
@limiter.limit("100 per hour")
@jwt_required()
def get_inquiries():
    user_id = get_jwt_identity()
    inquiries = InquiryService.get_all_for_user(user_id)
    return success({"inquiries": [i.to_dict() for i in inquiries]})


@inquiries_bp.route("/sent", methods=["GET"])
@jwt_required()
def get_sent_inquiries():
    user_id = get_jwt_identity()
    inquiries = InquiryService.get_by_sender(user_id)
    return success({"inquiries": [i.to_dict() for i in inquiries]})


@inquiries_bp.route("", methods=["POST"])
@limiter.limit("30 per hour")
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
        pass  # User is guest, use default sender_contact

    try:
        inquiry = InquiryService.create(
            listing_id=data.get("listing_id"),
            message=data.get("message"),
            sender_id=user_id,
            sender_contact=sender_contact,
            parent_id=data.get("parent_id")
        )
        return success({"inquiry": inquiry.to_dict()}, "Inquiry sent", 201)
    except ValueError as e:
        return error(str(e), 400)


@inquiries_bp.route("/<inquiry_id>/reply", methods=["POST"])
@jwt_required()
def reply_inquiry(inquiry_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    sender_contact = data.get("sender_contact", "Guest")
    if user_id:
        from src.services import AuthService
        user = AuthService.get_user_by_id(user_id)
        if user:
            sender_contact = user.email

    try:
        reply = InquiryService.reply(
            parent_id=inquiry_id,
            message=data.get("message"),
            sender_id=user_id,
            sender_contact=sender_contact
        )
        return success({"reply": reply.to_dict()}, "Reply sent", 201)
    except ValueError as e:
        return error(str(e), 400)


@inquiries_bp.route("/<inquiry_id>/replies", methods=["GET"])
@limiter.exempt
@jwt_required()
def get_replies(inquiry_id):
    try:
        replies = InquiryService.get_replies(inquiry_id)
        return success({"inquiries": [r.to_dict() for r in replies]})
    except ValueError as e:
        return error(str(e), 400)


@inquiries_bp.route("/unread-count", methods=["GET"])
@limiter.exempt
@jwt_required()
def get_unread_count():
    user_id = get_jwt_identity()
    count = InquiryService.get_unread_count(user_id)
    return success({"count": count})


@inquiries_bp.route("/<inquiry_id>/read", methods=["PUT"])
@limiter.exempt
@jwt_required()
def mark_inquiry_as_read(inquiry_id):
    user_id = get_jwt_identity()
    try:
        inquiry = InquiryService.mark_as_read(inquiry_id, user_id)
        return success({"inquiry": inquiry.to_dict()}, "Marked as read")
    except ValueError as e:
        return error(str(e), 400)


@inquiries_bp.route("/stream", methods=["GET"])
@limiter.exempt
def stream_inquiries():
    from flask import request
    from flask_jwt_extended import decode_token
    import jwt

    token = request.args.get('token')
    if not token:
        return error("Missing token", 401)

    try:
        # Manually decode JWT to get user_id
        # Split the token and decode the payload
        parts = token.split('.')
        if len(parts) != 3:
            return error("Invalid token format", 401)

        # Decode payload (second part) - it's base64url encoded
        import base64
        payload = parts[1]
        # Add padding if needed
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding

        import json as json_module
        decoded_payload = json_module.loads(base64.urlsafe_b64decode(payload))
        user_id = decoded_payload.get('sub')
        if not user_id:
            return error("Invalid token - no subject", 401)
    except Exception as e:
        return error(f"Invalid token: {str(e)}", 401)

    def generate():
        import time
        last_check = 0
        while True:
            # Check for new messages every 2 seconds
            time.sleep(2)
            try:
                count = InquiryService.get_unread_count(user_id)
                data = {
                    "type": "heartbeat",
                    "unread_count": count,
                    "timestamp": time.time()
                }
                yield f"data: {json.dumps(data)}\n\n"
            except Exception:
                pass

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )
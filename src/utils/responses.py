from flask import jsonify


def success(data=None, message=None, status_code=200):
    response = {"success": True}
    if message:
        response["message"] = message
    if data is not None:
        response["data"] = data
    return jsonify(response), status_code


def error(message="An error occurred", status_code=400, code=None):
    response = {
        "success": False,
        "error": message
    }
    if code:
        response["code"] = code
    return jsonify(response), status_code


def paginated(items, total, page, per_page):
    total_int = int(total) if total else 0
    return {
        "items": items,
        "total": total_int,
        "page": page,
        "per_page": per_page,
        "pages": (total_int + per_page - 1) // per_page if per_page > 0 else 0
    }


def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(e):
        return error(str(e.description) if hasattr(e, "description") else "Bad request", 400)

    @app.errorhandler(401)
    def unauthorized(e):
        return error("Authentication required", 401)

    @app.errorhandler(403)
    def forbidden(e):
        return error("Access denied", 403)

    @app.errorhandler(404)
    def not_found(e):
        from flask import request
        if request.path.startswith('/static/'):
            return e
        return error("Resource not found", 404)

    @app.errorhandler(500)
    def internal_error(e):
        return error("Internal server error", 500)
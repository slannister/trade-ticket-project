import re
import html


def escape_html(text):
    """Escape HTML characters to prevent XSS attacks."""
    if text is None:
        return None
    return html.escape(str(text), quote=True)


def sanitize_input(text, max_length=1000):
    """Sanitize text input: escape HTML and truncate to max length."""
    if not text:
        return text
    escaped = escape_html(text)
    return escaped[:max_length] if max_length else escaped


def validate_email_format(email):
    if re.match(pattern, email):
        return True, None
    return False, "Invalid email format"


def validate_password(password):
    if not password or len(password) < 6:
        return False, "Password must be at least 6 characters"
    return True, None


def validate_required_fields(data, required_fields):
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, None


def validate_listing_type(listing_type):
    valid_types = {"auction", "transfer", "swap", "request"}
    if listing_type not in valid_types:
        return False, f"Invalid listing type. Must be one of: {', '.join(valid_types)}"
    return True, None


def validate_delivery_method(method):
    valid_methods = {"meetup", "shipping"}
    if method not in valid_methods:
        return False, f"Invalid delivery method. Must be one of: {', '.join(valid_methods)}"
    return True, None


def validate_urgency(urgency):
    valid_levels = {"normal", "urgent"}
    if urgency not in valid_levels:
        return False, f"Invalid urgency. Must be one of: {', '.join(valid_levels)}"
    return True, None
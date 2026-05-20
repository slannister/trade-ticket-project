from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename
import os
import uuid
from src.extensions import db
from src.utils.responses import success, error

upload_bp = Blueprint("upload", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@upload_bp.route("/image", methods=["POST"])
@jwt_required()
def upload_image():
    if "file" not in request.files:
        return error("No file provided", 400)

    file = request.files["file"]
    if file.filename == "":
        return error("No file selected", 400)

    if not allowed_file(file.filename):
        return error("File type not allowed", 400)

    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_FILE_SIZE:
        return error(f"File size exceeds {MAX_FILE_SIZE // (1024 * 1024)}MB limit", 400)

    ext = file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4().hex}.{ext}"

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    listing_folder = os.path.join(upload_folder, "listings")
    os.makedirs(listing_folder, exist_ok=True)

    filepath = os.path.join(listing_folder, unique_filename)
    file.save(filepath)

    return success({
        "url": f"/uploads/listings/{unique_filename}",
        "filename": unique_filename
    }, "Image uploaded", 201)


@upload_bp.route("/images", methods=["POST"])
@jwt_required()
def upload_images():
    if "files" not in request.files:
        return error("No files provided", 400)

    files = request.files.getlist("files")
    if len(files) > 6:
        return error("Maximum 6 images allowed", 400)

    uploaded = []
    for file in files:
        if file and file.filename and allowed_file(file.filename):
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            if file_size > MAX_FILE_SIZE:
                continue
            ext = file.filename.rsplit(".", 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{ext}"

            upload_folder = current_app.config["UPLOAD_FOLDER"]
            listing_folder = os.path.join(upload_folder, "listings")
            os.makedirs(listing_folder, exist_ok=True)

            filepath = os.path.join(listing_folder, unique_filename)
            file.save(filepath)

            uploaded.append({
                "url": f"/uploads/listings/{unique_filename}",
                "filename": unique_filename
            })

    return success({"images": uploaded}, f"{len(uploaded)} images uploaded", 201)
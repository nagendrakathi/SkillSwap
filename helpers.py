import os
from werkzeug.utils import secure_filename
from flask import current_app

def save_file(file, upload_folder='uploads'):
    """
    Save an uploaded file to the specified folder and return the file path.
    """
    if not file:
        return None

    # Ensure the upload folder exists
    upload_path = os.path.join(current_app.root_path, upload_folder)
    os.makedirs(upload_path, exist_ok=True)

    # Secure the filename and save the file
    filename = secure_filename(file.filename)
    file_path = os.path.join(upload_path, filename)
    file.save(file_path)

    return os.path.join(upload_folder, filename)

def format_date(date, format='%B %d, %Y'):
    """
    Format a datetime object into a human-readable string.
    """
    return date.strftime(format) if date else None
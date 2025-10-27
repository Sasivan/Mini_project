
import cv2
import numpy as np
import base64
import dlib

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

print("Loading face detector...")
# Initialize dlib's frontal face detector. This is a built-in detector
# and does not require an external model file for basic face detection.
face_detector = dlib.get_frontal_face_detector()
print("Face detector loaded successfully.")


def readb64(uri):
    """Helper function to decode a base64 image URI."""
    try:
        encoded_data = uri.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        # Decode the image from the numpy array.
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except (IndexError, base64.binascii.Error) as e:
        print(f"Error decoding base64 string: {e}")
        return None

@app.route("/proctor", methods=['POST'])
def proctor():
    """Analyzes a single frame to ensure a face is present."""
    json_data = request.get_json()
    if not json_data or 'image' not in json_data:
        return jsonify({"status": "failed", "reason": "No image provided"}), 400

    frame = readb64(json_data['image'])
    if frame is None:
        return jsonify({"status": "failed", "reason": "Invalid image data"}), 400
    
    # Convert the frame to grayscale for dlib's face detector.
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # --- Face Detection ---
    # Detect faces in the grayscale image.
    faces = face_detector(gray, 0)
    
    # If no faces are detected, it's a violation.
    if len(faces) == 0:
        return jsonify({"status": "failed", "reason": "No Face Detected"})
    # If more than one face is detected, it could also be a violation.
    if len(faces) > 1:
        return jsonify({"status": "failed", "reason": "Multiple Faces Detected"})

    # If exactly one face is detected, everything is okay.
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    # The host is set to '0.0.0.0' to make the server accessible
    # from outside the container, which is necessary for the
    # Firebase Studio environment.
    app.run(host='0.0.0.0', port=8080)

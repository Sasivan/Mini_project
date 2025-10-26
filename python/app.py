import cv2
import numpy as np
import base64
import os

from flask import Flask, request, jsonify
from flask_cors import CORS

from models.mark_detector import MarkDetector
from models.pose_estimator import PoseEstimator
from models.phone_detector import PhoneDetector

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

print("Loading models, this may take a moment...")
# Introduce a variable to hold the path to the landmark model.
# This makes the code more readable and easier to maintain.
face_model_path = "python/models/assets/shape_predictor_68_face_landmarks.dat"

# Check if the model file exists before proceeding.
# This prevents the application from crashing if the file is missing.
if not os.path.exists(face_model_path):
    raise FileNotFoundError(f"Model file not found at {face_model_path}")

# Initialize the MarkDetector and PoseEstimator once when the app starts.
# This is a crucial optimization. Loading models on every request is very slow.
# By loading them once, we significantly speed up the processing of each frame.
mark_detector = MarkDetector(face_model_path)
pose_estimator = PoseEstimator(img_size=(240, 320))
phone_detector = PhoneDetector()
print("Models loaded successfully.")


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
    """Analyzes a single frame for proctoring violations."""
    json_data = request.get_json()
    if not json_data or 'image' not in json_data:
        return jsonify({"status": "failed", "reason": "No image provided"}), 400

    frame = readb64(json_data['image'])
    if frame is None:
        return jsonify({"status": "failed", "reason": "Invalid image data"}), 400
    
    # Resize frame for faster processing
    frame_small = cv2.resize(frame, (320, 240))
    
    # --- 1. Face Detection ---
    # The mark_detector is now used to find both the face and its landmarks.
    facebox, marks = mark_detector.get_marks(frame_small)
    
    # If no face is found (facebox is None), we can immediately stop.
    if facebox is None:
        return jsonify({"status": "failed", "reason": "No Face Detected"})

    # --- 2. Head Pose Estimation (Gaze) ---
    # The pose_estimator uses the landmarks to determine the head's rotation.
    pose = pose_estimator.solve_pose_by_68_points(marks)
    
    # Unpack the pose to get individual rotation angles.
    rmat, _ = cv2.Rodrigues(pose[0])
    _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(np.hstack((rmat, pose[1])))
    pitch, yaw, _ = euler_angles.flatten()
    
    # These thresholds determine how far the user can look away before it's
    # considered a violation. They may need tuning.
    if pitch > 20 or pitch < -30:
        return jsonify({"status": "failed", "reason": "Looking Down/Up"})
    if yaw > 25 or yaw < -25:
        return jsonify({"status": "failed", "reason": "Looking Away"})

    # --- 3. Phone Detection ---
    if phone_detector.detect(frame):
         return jsonify({"status": "failed", "reason": "Phone Detected"})

    # If all checks pass, return an "ok" status.
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    # The host is set to '0.0.0.0' to make the server accessible
    # from outside the container, which is necessary for the
    # Firebase Studio environment.
    app.run(host='0.0.0.0', port=8080)

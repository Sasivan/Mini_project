"""Human facial landmark detector based on dlib."""
import cv2
import numpy as np
import dlib

class MarkDetector:
    """Facial landmark detector by dlib."""

    def __init__(self, model_path):
        """Initialization"""
        # A face detector is required for mark detection.
        self.face_detector = dlib.get_frontal_face_detector()

        # The landmark predictor is loaded from the model file.
        self.landmark_predictor = dlib.shape_predictor(model_path)

        self.marks = None
        self.facebox = None

    def get_marks(self, image):
        """
        Detect facial marks from an image.
        
        Args:
            image: a BGR image from cv2.
            
        Returns:
            A tuple of (facebox, marks).
            facebox: the bounding box of the face as a dlib rectangle object.
            marks: the facial marks as a numpy array of shape [68, 2].
                   Returns None if no face is detected.
        """
        # dlib works with grayscale images for face detection.
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces in the image.
        faces = self.face_detector(gray, 0)

        # We assume only one face is present for this application.
        if len(faces) > 0:
            face = faces[0]
            self.facebox = face

            # Get the landmarks for the detected face.
            landmarks = self.landmark_predictor(gray, face)
            
            # Convert the landmark points to a numpy array.
            marks_list = []
            for i in range(0, 68):
                marks_list.append((landmarks.part(i).x, landmarks.part(i).y))
            
            self.marks = np.array(marks_list)
            return self.facebox, self.marks
        else:
            # If no face is found, return None for both.
            self.facebox = None
            self.marks = None
            return None, None

    @staticmethod
    def draw_marks(image, marks, color=(255, 255, 255)):
        """Draw mark points on image"""
        if marks is not None:
            for mark in marks:
                cv2.circle(image, (int(mark[0]), int(mark[1])), 1, color, -1, cv2.LINE_AA)
    
    @staticmethod
    def draw_box(image, boxes, box_color=(255, 255, 255)):
        """Draw bounding boxes on image"""
        if boxes is not None:
            # dlib returns rectangles, not a list of boxes.
            if isinstance(boxes, dlib.rectangle):
                boxes = [boxes] # Make it iterable
            for box in boxes:
                cv2.rectangle(image, (box.left(), box.top()), (box.right(), box.bottom()), box_color, 3)

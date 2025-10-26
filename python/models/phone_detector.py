import cv2
import numpy as np

class PhoneDetector:
    def __init__(self, proto_path='models/assets/MobileNetSSD_deploy.prototxt.txt', model_path='models/assets/MobileNetSSD_deploy.caffemodel'):
        self.net = cv2.dnn.readNetFromCaffe(proto_path, model_path)
        self.classes = ["background", "aeroplane", "bicycle", "bird", "boat",
                        "bottle", "bus", "car", "cat", "chair", "cow", "diningtable",
                        "dog", "horse", "motorbike", "person", "pottedplant", "sheep",
                        "sofa", "train", "tvmonitor", "cell phone"]

    def detect(self, image):
        (h, w) = image.shape[:2]
        blob = cv2.dnn.blobFromImage(cv2.resize(image, (300, 300)), 0.007843, (300, 300), 127.5)

        self.net.setInput(blob)
        detections = self.net.forward()

        for i in np.arange(0, detections.shape[2]):
            confidence = detections[0, 0, i, 2]

            if confidence > 0.5: # Confidence threshold
                idx = int(detections[0, 0, i, 1])
                if self.classes[idx] == "cell phone":
                    return True # Phone detected
        return False # No phone detected

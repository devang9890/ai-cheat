import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np

class FaceDetector:
    def __init__(self):
        base_options = python.BaseOptions(model_asset_path='face_landmarker.task')
        options = vision.FaceDetectorOptions(
            base_options=base_options,
            min_detection_confidence=0.5
        )
        self.detector = vision.FaceDetector.create_from_options(options)

    def detect_faces(self, image_np: np.ndarray):
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_np)
        detection_result = self.detector.detect(mp_image)
        if not detection_result.detections:
            return 0
        return len(detection_result.detections)

import mediapipe as mp

mp_face_mesh = mp.solutions.face_mesh

class FaceDetector:
    def __init__(self):
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=2,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def detect_faces(self, image):
        results = self.face_mesh.process(image)

        if not results.multi_face_landmarks:
            return 0

        return len(results.multi_face_landmarks)

import mediapipe as mp

mp_face_mesh = mp.solutions.face_mesh

class EyeTracker:
    def __init__(self):
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def get_head_direction(self, image):
        results = self.face_mesh.process(image)

        if not results.multi_face_landmarks:
            return "NO_FACE"

        landmarks = results.multi_face_landmarks[0].landmark

        nose = landmarks[1]
        left_eye = landmarks[33]
        right_eye = landmarks[263]
        chin = landmarks[152]

        eye_center_x = (left_eye.x + right_eye.x) / 2

        if nose.x < eye_center_x - 0.04:
            return "LEFT"
        elif nose.x > eye_center_x + 0.04:
            return "RIGHT"
        elif nose.y > chin.y - 0.06:
            return "DOWN"

        return "CENTER"

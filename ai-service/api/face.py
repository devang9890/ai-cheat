from fastapi import APIRouter, HTTPException, status
import cv2
from schemas.frame_schema import FrameRequest
from services.face_detection import FaceDetector
from utils.image_utils import base64_to_image

router = APIRouter()
detector = FaceDetector()

@router.post("/detect-face")
def detect_face(data: FrameRequest):
    try:
        # 1. Safely decode the image
        bgr_image = base64_to_image(data.image)
    except ValueError as e:
        # 2. Return 400 on decoding errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # 3. Convert BGR to RGB for MediaPipe
    rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)

    try:
        # 4. Run face detection
        face_count = detector.detect_faces(rgb_image)
    except Exception as e:
        # 5. Catch potential MediaPipe errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during face detection: {e}"
        )

    return {
        "face_count": face_count,
        "no_face": face_count == 0,
        "multiple_faces": face_count > 1,
        "status": (
            "NO_FACE" if face_count == 0 else
            "MULTIPLE_FACES" if face_count > 1 else
            "SINGLE_FACE"
        )
    }

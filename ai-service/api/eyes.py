from fastapi import APIRouter, HTTPException
from schemas.frame_schema import FrameRequest
from utils.image_utils import base64_to_image
from services.eye_tracking import EyeTracker

router = APIRouter()
tracker = EyeTracker()

@router.post("/detect-eyes")
def detect_eyes(data: FrameRequest):
    try:
        image = base64_to_image(data.image)

        if image is None:
            raise ValueError("Invalid image")

        direction = tracker.get_head_direction(image)

        return {
            "head_direction": direction,
            "looking_away": direction in ["LEFT", "RIGHT", "DOWN"]
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

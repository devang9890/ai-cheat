from pydantic import BaseModel

class FrameRequest(BaseModel):
    image: str  # base64 encoded image

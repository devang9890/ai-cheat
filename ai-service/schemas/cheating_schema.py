from pydantic import BaseModel

class CheatingUpdateRequest(BaseModel):
    face_count: int
    looking_away: bool
    tab_switches: int = 0

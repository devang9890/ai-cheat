from fastapi import APIRouter
from services.behavior_analysis import BehaviorAnalyzer
from schemas.cheating_schema import CheatingUpdateRequest

router = APIRouter()
analyzer = BehaviorAnalyzer()

@router.post("/update-score")
def update_score(data: CheatingUpdateRequest):
    analyzer.update(
        face_count=data.face_count,
        looking_away=data.looking_away
    )

    score, status = analyzer.calculate_score()

    return {
        "cheating_score": score,
        "risk_level": status
    }

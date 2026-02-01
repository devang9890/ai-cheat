from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.cheating_score import router as score_router

from api.face import router as face_router
from api.eyes import router as eyes_router

app = FastAPI(title="AI Exam Proctoring Service")

# 🌐 CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🧠 AI Face Proctoring Routes
app.include_router(
    face_router,
    prefix="/api/face",
    tags=["Face Proctoring"]
)

# 👀 Eye / Head Tracking Routes
app.include_router(
    eyes_router,
    prefix="/api/eyes",
    tags=["Eye Tracking"]
)

app.include_router(
    score_router,
    prefix="/api/cheating",
    tags=["Cheating Analysis"]
)

# ❤️ Health Check
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "ai-proctoring",
        "message": "FastAPI AI service is running 🚀"
    }

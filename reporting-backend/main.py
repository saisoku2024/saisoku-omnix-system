from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes.dashboard import router as dashboard_router
from app.routes.upload import router as upload_router
from app.routes.voice import router as voice_router
from app.routes.csat import router as csat_router

load_dotenv()

app = FastAPI(
    title="SAISOKU OMNIX Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# dashboard.py pakai route seperti /dashboard/summary
# hasil akhir jadi /api/dashboard/summary
app.include_router(dashboard_router, prefix="/api")

# upload.py diasumsikan pakai route tanpa prefix /api di dalam file
# hasil akhir jadi /api/...
app.include_router(upload_router, prefix="/api")

# voice.py sudah pakai:
# APIRouter(prefix="/api/dashboard/voice", tags=["voice"])
# jadi jangan tambah prefix lagi
app.include_router(voice_router)

# csat.py sudah pakai:
# APIRouter(prefix="/api/dashboard/csat", tags=["csat"])
# jadi jangan tambah prefix lagi
app.include_router(csat_router)

@app.get("/")
def root():
    return {
        "status": "backend ready",
        "service": "SAISOKU OMNIX Backend"
    }
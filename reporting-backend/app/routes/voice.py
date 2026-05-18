from fastapi import APIRouter, Query
from app.services.voice_service import VoiceService

router = APIRouter(prefix="/voice", tags=["Voice"])


# =========================
# SUMMARY
# =========================
@router.get("/summary")
def voice_summary(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_summary(mode, period, year)


# =========================
# MASTER ENDPOINT 🔥
# =========================
@router.get("/all")
def voice_all(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_all(mode, period, year)
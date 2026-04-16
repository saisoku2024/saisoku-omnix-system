from fastapi import APIRouter, Query
from app.services.voice_service import VoiceService

# Nama variabel 'router' selaras dengan modul lainnya
router = APIRouter(prefix="/voice", tags=["Voice"])

@router.get("/stats")
async def get_voice_stats(
    mode: str = Query("monthly"),
    period: str = Query("Apr"),
    year: int = Query(2026)
):
    # Mengambil data summary, daily, dan agent performance sekaligus
    return VoiceService.get_stats(mode, period, year)
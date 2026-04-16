from fastapi import APIRouter, Query
from app.services.csat_service import CsatService

# Nama variabel 'router' selaras dengan modul lainnya
router = APIRouter(prefix="/csat", tags=["CSAT"])

@router.get("/stats")
async def get_csat_stats(
    mode: str = Query("monthly"),
    period: str = Query("Apr"),
    year: int = Query(2026)
):
    # Mengolah rating_csat dari string ke numeric di level service
    return CsatService.get_stats(mode, period, year)
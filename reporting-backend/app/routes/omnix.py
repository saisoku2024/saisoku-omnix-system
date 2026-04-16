from fastapi import APIRouter, Query
from app.services.omnix_service import OmnixService

# Gunakan nama variabel 'router' agar selaras
router = APIRouter(prefix="/omnix", tags=["Omnix"])

@router.get("/stats")
async def get_omnix_stats(
    mode: str = Query("monthly"),
    period: str = Query("Apr"),
    year: int = Query(2026)
):
    return OmnixService.get_stats(mode, period, year)
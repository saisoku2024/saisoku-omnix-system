from fastapi import APIRouter, Query
from app.services.dashboard_service import (
    get_dashboard_summary,
    get_dashboard_trend,
    get_dashboard_by_channel,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def dashboard_summary(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return get_dashboard_summary(mode, period, year)

@router.get("/trend")
def dashboard_trend(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return get_dashboard_trend(mode, period, year)

@router.get("/by-channel")
def dashboard_by_channel(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return get_dashboard_by_channel(mode, period, year)
from fastapi import APIRouter, Query
from app.services.omnix_service import OmnixService

router = APIRouter(prefix="/omnix", tags=["Omnix"])


# =========================
# KPI SUMMARY
# =========================
@router.get("/summary")
def omnix_summary(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return OmnixService.get_summary(mode, period, year)


# =========================
# DAILY CHART
# =========================
@router.get("/daily")
def omnix_daily(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return OmnixService.get_daily(mode, period, year)


# =========================
# HOURLY CHART
# =========================
@router.get("/hourly")
def omnix_hourly(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return OmnixService.get_hourly(mode, period, year)


# =========================
# DAY OF WEEK
# =========================
@router.get("/by-day")
def omnix_by_day(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return OmnixService.get_by_day(mode, period, year)


# =========================
# CHANNEL
# =========================
@router.get("/by-channel")
def omnix_by_channel(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return OmnixService.get_by_channel(mode, period, year)


# =========================
# CATEGORY
# =========================
@router.get("/by-category")
def omnix_by_category(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return OmnixService.get_by_category(mode, period, year)


# =========================
# PRODUCT
# =========================
@router.get("/by-product")
def omnix_by_product(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return OmnixService.get_by_product(mode, period, year)


# =========================
# MASTER ENDPOINT 🔥
# =========================
@router.get("/all")
def omnix_all(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return OmnixService.get_all(mode, period, year)
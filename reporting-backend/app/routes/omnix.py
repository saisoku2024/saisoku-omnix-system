from fastapi import APIRouter, Query
from app.services.omnix_service import OmnixService

router = APIRouter(prefix="/omnix", tags=["Omnix"])


def _omnix_master(mode: str, period: str, year: int):
    return OmnixService.get_all(mode, period, year)


# =========================
# KPI SUMMARY
# =========================
@router.get("/summary")
def omnix_summary(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _omnix_master(mode, period, year).get("summary", {})


# =========================
# DAILY CHART
# =========================
@router.get("/daily")
def omnix_daily(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _omnix_master(mode, period, year).get("daily", [])


# =========================
# HOURLY CHART
# =========================
@router.get("/hourly")
def omnix_hourly(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _omnix_master(mode, period, year).get("hourly", [])


# =========================
# DAY OF WEEK
# =========================
@router.get("/by-day")
def omnix_by_day(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _omnix_master(mode, period, year).get("by_day", [])


# =========================
# CHANNEL
# =========================
@router.get("/by-channel")
def omnix_by_channel(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _omnix_master(mode, period, year).get("channel", [])


# =========================
# CATEGORY
# =========================
@router.get("/by-category")
def omnix_by_category(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _omnix_master(mode, period, year).get("category", [])


# =========================
# PRODUCT
# =========================
@router.get("/by-product")
def omnix_by_product(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _omnix_master(mode, period, year).get("product", [])


# =========================
# MASTER ENDPOINT
# =========================
@router.get("/all")
def omnix_all(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    raw = _omnix_master(mode, period, year)

    # SIVA Fix: Langsung ambil data dari service, karena format sudah sempurna dari DB
    trend = raw.get("daily") or []

    return {
        "summary": raw.get("summary") or {
            "total_ticket": 0,
            "aht": "0m 0s",
            "art": "0m 0s",
            "awt": "0m 0s",
        },
        "trend": trend,
        "channel": raw.get("channel") or [],
        "category": raw.get("category") or [],
        "product": raw.get("product") or [],
        "customer": raw.get("customer") or [],
        "top_cases": [],
    }

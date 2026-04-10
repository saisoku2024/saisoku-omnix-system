from fastapi import APIRouter
from app.services.dashboard_service import (
    get_dashboard_summary,
    get_dashboard_trend,
    get_dashboard_by_channel,
    get_voice_summary,
    get_voice_daily,
    get_voice_by_hour,
    get_voice_by_day,
    get_voice_by_agent,
    get_csat_summary,
    get_csat_rating_breakdown,
    get_csat_monthly_score,
    get_csat_by_agent,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# =========================================================
# HOME
# =========================================================

@router.get("/summary")
def dashboard_summary():
    return get_dashboard_summary()


@router.get("/trend")
def dashboard_trend():
    return get_dashboard_trend()


@router.get("/by-channel")
def dashboard_by_channel():
    return get_dashboard_by_channel()


# =========================================================
# VOICE
# =========================================================

@router.get("/voice/summary")
def dashboard_voice_summary():
    return get_voice_summary()


@router.get("/voice/daily")
def dashboard_voice_daily():
    return get_voice_daily()


@router.get("/voice/by-hour")
def dashboard_voice_by_hour():
    return get_voice_by_hour()


@router.get("/voice/by-day")
def dashboard_voice_by_day():
    return get_voice_by_day()


@router.get("/voice/by-agent")
def dashboard_voice_by_agent():
    return get_voice_by_agent()


# =========================================================
# CSAT
# =========================================================

@router.get("/csat/summary")
def dashboard_csat_summary():
    return get_csat_summary()


@router.get("/csat/rating-breakdown")
def dashboard_csat_rating_breakdown():
    return get_csat_rating_breakdown()


@router.get("/csat/monthly-score")
def dashboard_csat_monthly_score():
    return get_csat_monthly_score()


@router.get("/csat/by-agent")
def dashboard_csat_by_agent():
    return get_csat_by_agent()
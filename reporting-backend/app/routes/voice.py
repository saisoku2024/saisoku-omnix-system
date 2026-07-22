from fastapi import APIRouter, Query, Depends
from app.core.security import require_admin_token
from app.services.voice_service import VoiceService

router = APIRouter(
    prefix="/voice",
    tags=["Voice"],
    dependencies=[Depends(require_admin_token)],
)


def _voice_master(mode: str, period: str, year: int):
    return VoiceService.get_all(mode, period, year)


@router.get("/summary")
def voice_summary(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _voice_master(mode, period, year).get("summary", {})


@router.get("/daily")
def voice_daily(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _voice_master(mode, period, year).get("daily", [])


@router.get("/hourly")
def voice_hourly(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _voice_master(mode, period, year).get("hourly", [])


@router.get("/by-day")
def voice_by_day(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _voice_master(mode, period, year).get("byDay", [])


@router.get("/status")
def voice_status(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    summary = _voice_master(mode, period, year).get("summary", {})
    return [
        {"name": "Answered", "count": summary.get("answered", 0)},
        {"name": "Abandon", "count": summary.get("abandon", 0)},
    ]


@router.get("/agent")
def voice_agent(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    data = _voice_master(mode, period, year)
    return {
        "handling": data.get("agentHandling", []),
        "aht": data.get("agentAht", []),
        "awt": data.get("agentAwt", []),
    }


@router.get("/all")
def voice_all(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _voice_master(mode, period, year)

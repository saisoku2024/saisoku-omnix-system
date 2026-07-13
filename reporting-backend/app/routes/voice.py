from fastapi import APIRouter, Query

from app.services.voice_service import VoiceService

router = APIRouter(
    prefix="/voice",
    tags=["Voice"],
)


@router.get("/summary")
def voice_summary(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_summary(mode, period, year)


@router.get("/daily")
def voice_daily(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_daily(mode, period, year)


@router.get("/hourly")
def voice_hourly(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_hourly(mode, period, year)


@router.get("/by-day")
def voice_by_day(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_by_day(mode, period, year)


@router.get("/status")
def voice_status(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_by_status(mode, period, year)


@router.get("/agent")
def voice_agent(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return {
        "handling": VoiceService.get_agent_handling(mode, period, year),
        "aht": VoiceService.get_agent_aht(mode, period, year),
        "awt": VoiceService.get_agent_awt(mode, period, year),
    }


@router.get("/all")
def voice_all(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_all(mode, period, year)

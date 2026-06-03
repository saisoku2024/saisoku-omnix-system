from fastapi import APIRouter, Query  # type: ignore[reportMissingImports]
from app.services.voice_service import VoiceService

router = APIRouter(
    prefix="/voice",
    tags=["Voice"],
)


# =========================================================
# SUMMARY
# =========================================================
@router.get("/summary")
def voice_summary(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_summary(
        mode,
        period,
        year,
    )


# =========================================================
# DAILY
# =========================================================
@router.get("/daily")
def voice_daily(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_daily(
        mode,
        period,
        year,
    )


# =========================================================
# HOURLY
# =========================================================
@router.get("/hourly")
def voice_hourly(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_hourly(
        mode,
        period,
        year,
    )


# =========================================================
# BY DAY
# =========================================================
@router.get("/by-day")
def voice_by_day(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_by_day(
        mode,
        period,
        year,
    )


# =========================================================
# STATUS
# =========================================================
@router.get("/status")
def voice_status(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return VoiceService.get_by_status(
        mode,
        period,
        year,
    )


# =========================================================
# AGENT
# =========================================================
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


# =========================================================
# ALL
# =========================================================
@router.get("/all")
def voice_all(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    summary = VoiceService.get_summary(
        mode,
        period,
        year,
    )

    daily = VoiceService.get_daily(
        mode,
        period,
        year,
    )

    hourly = VoiceService.get_hourly(
        mode,
        period,
        year,
    )

    by_day = VoiceService.get_by_day(
        mode,
        period,
        year,
    )

    agent = {
        "handling": VoiceService.get_agent_handling(mode, period, year),
        "aht": VoiceService.get_agent_aht(mode, period, year),
        "awt": VoiceService.get_agent_awt(mode, period, year),
    }

    return {
        "summary": {
            "total_calls": summary.get(
                "total_calls",       # 🔧 FIX: was "total_ticket"
                0,
            ),
            "answered": summary.get(
                "answered",
                0,
            ),
            "abandon": summary.get(
                "abandon",
                0,
            ),
            "aht": summary.get(
                "aht",
                "0m",
            ),
            "awt": summary.get(
                "awt",
                "0m",
            ),
            "scr": summary.get(
                "scr",               # 🔧 FIX: was "csat"
                0,
            ),
        },

        "daily": daily,

        "hourly": hourly,

        "byDay": by_day,

        "agentHandling": agent["handling"],

        "agentAht": agent["aht"],

        "agentAwt": agent["awt"],
    }
from fastapi import APIRouter, Query
from app.services.csat_service import CsatService

router = APIRouter(prefix="/csat", tags=["CSAT"])


# =========================
# SUMMARY
# =========================
@router.get("/summary")
def csat_summary(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return CsatService.get_all(mode, period, year).get("summary", {})


# =========================
# TOP AGENT (TOTAL RESPONSE)
# =========================
@router.get("/top-agent-total")
def csat_top_agent_total(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return CsatService.get_all(mode, period, year).get("top_agent_total", [])


# =========================
# TOP AGENT (AVG CSAT)
# =========================
@router.get("/top-agent-avg")
def csat_top_agent_avg(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return CsatService.get_all(mode, period, year).get("top_agent_avg", [])


# =========================
# MASTER ENDPOINT 🔥
# =========================
@router.get("/all")
def csat_all(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return CsatService.get_all(mode, period, year)

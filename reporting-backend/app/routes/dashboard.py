from fastapi import APIRouter, Query, Depends
from app.core.security import require_admin_token
from app.services.dashboard_service import (
    get_dashboard_all,
    get_dashboard_years,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(require_admin_token)],
)


def _dashboard_master(mode: str, period: str, year: int):
    return get_dashboard_all(mode, period, year)


@router.get("/years")
def dashboard_years():
    return get_dashboard_years()


@router.get("/summary")
def dashboard_summary(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _dashboard_master(mode, period, year).get("summary", {})


@router.get("/trend")
def dashboard_trend(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _dashboard_master(mode, period, year).get("trend", [])


@router.get("/by-channel")
def dashboard_by_channel(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _dashboard_master(mode, period, year).get("channel", [])


@router.get("/by-category")
def dashboard_by_category(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _dashboard_master(mode, period, year).get("category", [])


@router.get("/by-brand")
def dashboard_by_brand(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _dashboard_master(mode, period, year).get("brand", [])


@router.get("/customer")
def dashboard_customer(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _dashboard_master(mode, period, year).get("customer", {"total": 0})


@router.get("/new-customer")
def dashboard_new_customer(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _dashboard_master(mode, period, year).get("new_customer", {"total": 0})


# 🔥 MASTER ENDPOINT
@router.get("/all")
def dashboard_all(
    mode: str = Query("monthly"),
    period: str = Query("Jan"),
    year: int = Query(2026),
):
    return _dashboard_master(mode, period, year)

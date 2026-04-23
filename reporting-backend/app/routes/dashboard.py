from fastapi import APIRouter, Query
from app.services.dashboard_service import (
    get_dashboard_summary,
    get_dashboard_trend,
    get_dashboard_by_channel,
    get_dashboard_by_category,
    get_dashboard_by_brand,
    get_dashboard_customer,
    get_dashboard_new_customer,
    get_dashboard_years,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/years")
def dashboard_years():
    return get_dashboard_years()

@router.get("/summary")
def dashboard_summary(
    mode:   str = Query("monthly"),
    period: str = Query("Jan"),
    year:   int = Query(2026),
):
    return get_dashboard_summary(mode, period, year)

@router.get("/trend")
def dashboard_trend(
    mode:   str = Query("monthly"),
    period: str = Query("Jan"),
    year:   int = Query(2026),
):
    return get_dashboard_trend(mode, period, year)

@router.get("/by-channel")
def dashboard_by_channel(
    mode:   str = Query("monthly"),
    period: str = Query("Jan"),
    year:   int = Query(2026),
):
    return get_dashboard_by_channel(mode, period, year)

@router.get("/by-category")
def dashboard_by_category(
    mode:   str = Query("monthly"),
    period: str = Query("Jan"),
    year:   int = Query(2026),
):
    return get_dashboard_by_category(mode, period, year)

@router.get("/by-brand")
def dashboard_by_brand(
    mode:   str = Query("monthly"),
    period: str = Query("Jan"),
    year:   int = Query(2026),
):
    return get_dashboard_by_brand(mode, period, year)

@router.get("/customer")
def dashboard_customer(
    mode:   str = Query("monthly"),
    period: str = Query("Jan"),
    year:   int = Query(2026),
):
    return get_dashboard_customer(mode, period, year)

@router.get("/new-customer")
def dashboard_new_customer(
    mode:   str = Query("monthly"),
    period: str = Query("Jan"),
    year:   int = Query(2026),
):
    return get_dashboard_new_customer(mode, period, year)
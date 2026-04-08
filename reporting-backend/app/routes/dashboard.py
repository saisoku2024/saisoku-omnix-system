from fastapi import APIRouter, HTTPException, Query
from app.services.dashboard_service import *

router = APIRouter()


@router.get("/dashboard/summary")
def summary(start_date: str = Query(None), end_date: str = Query(None)):
    try:
        return get_dashboard_summary(start_date, end_date)
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/dashboard/trend")
def trend(start_date: str = Query(None), end_date: str = Query(None)):
    return get_dashboard_trend(start_date, end_date)


@router.get("/dashboard/by-channel")
def by_channel(start_date: str = Query(None), end_date: str = Query(None)):
    return get_dashboard_by_channel(start_date, end_date)


@router.get("/dashboard/voice/summary")
def voice(start_date: str = Query(None), end_date: str = Query(None)):
    return get_voice_summary(start_date, end_date)


@router.get("/dashboard/csat/summary")
def csat(start_date: str = Query(None), end_date: str = Query(None)):
    return get_csat_summary(start_date, end_date)
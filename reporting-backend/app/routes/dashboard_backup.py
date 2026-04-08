from fastapi import APIRouter, HTTPException
from app.services.dashboard_service import (
    get_dashboard_summary,
    get_dashboard_trend,
    get_dashboard_by_channel,
    get_voice_summary,
    get_csat_summary,
)

router = APIRouter()


@router.get("/dashboard/summary")
def dashboard_summary():
    try:
        return get_dashboard_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/trend")
def dashboard_trend():
    try:
        return get_dashboard_trend()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/by-channel")
def dashboard_by_channel():
    try:
        return get_dashboard_by_channel()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/voice/summary")
def dashboard_voice_summary():
    try:
        return get_voice_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/csat/summary")
def dashboard_csat_summary():
    try:
        return get_csat_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
from fastapi import APIRouter, HTTPException, Query
from app.supabase_client import supabase
from app.utils.date_filter import get_date_range
from datetime import datetime
from collections import defaultdict
from typing import List, Dict

router = APIRouter(prefix="/api/dashboard/voice", tags=["voice"])

def safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default

@router.get("/summary")
async def get_voice_summary(
    granularity: str = Query("month"),
    year: int = Query(...),
    month: int | None = Query(None),
    quarter: int | None = Query(None),
):
    try:
        start_date, end_date = get_date_range(
            granularity=granularity,
            year=year,
            month=month,
            quarter=quarter,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    start_dt = f"{start_date}T00:00:00"
    end
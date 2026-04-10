from fastapi import APIRouter, HTTPException, Query
from app.supabase_client import supabase
from app.utils.date_filter import get_date_range
from datetime import datetime
from collections import defaultdict
from typing import List, Dict, Any

router = APIRouter(prefix="/api/dashboard/csat", tags=["csat"])

def safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(str(value).strip())
    except Exception:
        return default

@router.get("/summary")
async def get_csat_summary(
    granularity: str = Query("month"),
    year: int = Query(...),
    month: int | None = Query(None),
    quarter: int | None =
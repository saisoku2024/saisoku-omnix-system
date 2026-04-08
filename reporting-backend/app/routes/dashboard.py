from fastapi import APIRouter, HTTPException, Query
from app.services.dashboard_service import get_dashboard_summary

router = APIRouter()


@router.get("/dashboard/summary")
def dashboard_summary(
    start_date: str = Query(None),
    end_date: str = Query(None)
):
    try:
        return get_dashboard_summary(start_date, end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
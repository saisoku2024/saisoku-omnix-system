from fastapi import APIRouter, HTTPException, Query
from app.supabase_client import supabase
from app.utils.date_filter import get_date_range
from datetime import datetime
from collections import defaultdict
from typing import Any

router = APIRouter(prefix="/api/dashboard/csat", tags=["csat"])


def safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(str(value).strip())
    except Exception:
        return default


def month_label(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


@router.get("/summary")
async def get_csat_summary(
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
    end_dt = f"{end_date}T23:59:59"

    try:
        res = (
            supabase.table("csat_responses")
            .select("created_at_source,rating_csat,channel,account")
            .gte("created_at_source", start_dt)
            .lte("created_at_source", end_dt)
            .execute()
        )

        rows = res.data or []
        total_responses = len(rows)

        rating_sum = 0.0
        rating_count = 0
        high_score = 0
        low_score = 0

        for row in rows:
            rating = safe_float(row.get("rating_csat"), None)
            if rating is None:
                continue
            rating_sum += rating
            rating_count += 1
            if rating >= 4:
                high_score += 1
            else:
                low_score += 1

        average_csat = round(rating_sum / rating_count, 2) if rating_count else 0

        return {
            "total_csat_responses": total_responses,
            "high_score": high_score,
            "low_score": low_score,
            "average_csat": average_csat,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch CSAT summary: {str(e)}")


@router.get("/rating-breakdown")
async def get_csat_rating_breakdown(
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
    end_dt = f"{end_date}T23:59:59"

    try:
        res = (
            supabase.table("csat_responses")
            .select("created_at_source,rating_csat")
            .gte("created_at_source", start_dt)
            .lte("created_at_source", end_dt)
            .execute()
        )

        rows = res.data or []
        grouped = defaultdict(lambda: {"score1": 0, "score2": 0, "score3": 0, "score4": 0, "score5": 0})

        for row in rows:
            created_at = row.get("created_at_source")
            if not created_at:
                continue

            try:
                dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except Exception:
                continue

            label = month_label(dt)
            rating = int(safe_float(row.get("rating_csat"), 0))

            if rating == 1:
                grouped[label]["score1"] += 1
            elif rating == 2:
                grouped[label]["score2"] += 1
            elif rating == 3:
                grouped[label]["score3"] += 1
            elif rating == 4:
                grouped[label]["score4"] += 1
            elif rating == 5:
                grouped[label]["score5"] += 1

        data = [{"month": k, **v} for k, v in sorted(grouped.items())]
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch CSAT rating breakdown: {str(e)}")


@router.get("/monthly-score")
async def get_csat_monthly_score(
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
    end_dt = f"{end_date}T23:59:59"

    try:
        res = (
            supabase.table("csat_responses")
            .select("created_at_source,rating_csat")
            .gte("created_at_source", start_dt)
            .lte("created_at_source", end_dt)
            .execute()
        )

        rows = res.data or []
        grouped = defaultdict(lambda: {"sum": 0.0, "count": 0})

        for row in rows:
            created_at = row.get("created_at_source")
            if not created_at:
                continue

            try:
                dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except Exception:
                continue

            rating = safe_float(row.get("rating_csat"), None)
            if rating is None:
                continue

            label = month_label(dt)
            grouped[label]["sum"] += rating
            grouped[label]["count"] += 1

        data = []
        for label, item in sorted(grouped.items()):
            avg = round(item["sum"] / item["count"], 2) if item["count"] else 0
            data.append({"month": label, "score": avg})

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch monthly CSAT score: {str(e)}")


@router.get("/by-agent")
async def get_csat_by_agent(
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
    end_dt = f"{end_date}T23:59:59"

    try:
        res = (
            supabase.table("csat_responses")
            .select("account,rating_csat,created_at_source")
            .gte("created_at_source", start_dt)
            .lte("created_at_source", end_dt)
            .execute()
        )

        rows = res.data or []
        grouped = defaultdict(lambda: {"total_response": 0, "sum_score": 0.0})

        for row in rows:
            agent = (row.get("account") or "Unknown").strip()
            rating = safe_float(row.get("rating_csat"), None)
            grouped[agent]["total_response"] += 1
            if rating is not None:
                grouped[agent]["sum_score"] += rating

        data = []
        for agent, item in sorted(grouped.items(), key=lambda x: x[1]["total_response"], reverse=True):
            total = item["total_response"]
            score = round(item["sum_score"] / total, 2) if total else 0
            data.append({
                "agent": agent,
                "total_response": total,
                "score": score,
            })

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch CSAT by agent: {str(e)}")
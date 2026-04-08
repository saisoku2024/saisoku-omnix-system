from datetime import datetime

from fastapi import APIRouter, HTTPException, Query

from app.supabase_client import supabase
from app.utils.date_filter import get_date_range

router = APIRouter()


def safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default


@router.get("/dashboard/summary")
async def get_dashboard_summary(
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
        total_res = (
            supabase.table("omnix_cases")
            .select("*", count="exact")
            .gte("interaction_at", start_dt)
            .lte("interaction_at", end_dt)
            .execute()
        )

        total_cases = total_res.count or 0

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard summary: {str(e)}"
        )

    return {
        "filter": {
            "granularity": granularity,
            "year": year,
            "month": month,
            "quarter": quarter,
            "start_date": str(start_date),
            "end_date": str(end_date),
        },
        "summary": {
            "total_cases": total_cases,
            "open_cases": 0,
            "closed_cases": 0,
        },
    }


@router.get("/dashboard/trend")
async def get_dashboard_trend(
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
            supabase.table("omnix_cases")
            .select("interaction_at")
            .gte("interaction_at", start_dt)
            .lte("interaction_at", end_dt)
            .execute()
        )

        rows = res.data or []
        grouped = {}

        if granularity == "month":
            group_by = "day"
            for row in rows:
                interaction_at = row.get("interaction_at")
                if not interaction_at:
                    continue

                dt = datetime.fromisoformat(interaction_at.replace("Z", "+00:00"))
                label = dt.strftime("%Y-%m-%d")
                grouped[label] = grouped.get(label, 0) + 1
        else:
            group_by = "month"
            for row in rows:
                interaction_at = row.get("interaction_at")
                if not interaction_at:
                    continue

                dt = datetime.fromisoformat(interaction_at.replace("Z", "+00:00"))
                label = dt.strftime("%Y-%m")
                grouped[label] = grouped.get(label, 0) + 1

        data = [
            {"label": label, "total_cases": total}
            for label, total in sorted(grouped.items())
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard trend: {str(e)}"
        )

    return {
        "filter": {
            "granularity": granularity,
            "year": year,
            "month": month,
            "quarter": quarter,
            "start_date": str(start_date),
            "end_date": str(end_date),
        },
        "group_by": group_by,
        "data": data,
    }


@router.get("/dashboard/by-channel")
async def get_dashboard_by_channel(
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
            supabase.table("omnix_cases")
            .select("channel")
            .gte("interaction_at", start_dt)
            .lte("interaction_at", end_dt)
            .execute()
        )

        rows = res.data or []
        grouped = {}

        for row in rows:
            channel = row.get("channel") or "Unknown"
            grouped[channel] = grouped.get(channel, 0) + 1

        data = [
            {"channel": channel, "total_cases": total}
            for channel, total in sorted(grouped.items(), key=lambda x: x[1], reverse=True)
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch by channel: {str(e)}"
        )

    return {
        "filter": {
            "granularity": granularity,
            "year": year,
            "month": month,
            "quarter": quarter,
            "start_date": str(start_date),
            "end_date": str(end_date),
        },
        "data": data,
    }


@router.get("/dashboard/voice/summary")
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
    end_dt = f"{end_date}T23:59:59"

    try:
        res = (
            supabase.table("voice_interactions")
            .select(
                "interaction_at,wait_time_sec,talk_time_sec,hold_time_sec,call_status"
            )
            .gte("interaction_at", start_dt)
            .lte("interaction_at", end_dt)
            .execute()
        )

        rows = res.data or []
        total_calls = len(rows)

        total_wait = 0.0
        total_talk = 0.0
        total_hold = 0.0
        answered_calls = 0
        abandoned_calls = 0

        for row in rows:
            wait_time = safe_float(row.get("wait_time_sec"))
            talk_time = safe_float(row.get("talk_time_sec"))
            hold_time = safe_float(row.get("hold_time_sec"))
            call_status = (row.get("call_status") or "").upper()

            total_wait += wait_time
            total_talk += talk_time
            total_hold += hold_time

            if "ABANDON" in call_status:
                abandoned_calls += 1
            else:
                answered_calls += 1

        avg_wait_time_sec = round(total_wait / total_calls, 2) if total_calls else 0
        avg_talk_time_sec = round(total_talk / total_calls, 2) if total_calls else 0
        avg_hold_time_sec = round(total_hold / total_calls, 2) if total_calls else 0

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch voice summary: {str(e)}"
        )

    return {
        "filter": {
            "granularity": granularity,
            "year": year,
            "month": month,
            "quarter": quarter,
            "start_date": str(start_date),
            "end_date": str(end_date),
        },
        "summary": {
            "total_calls": total_calls,
            "avg_wait_time_sec": avg_wait_time_sec,
            "avg_talk_time_sec": avg_talk_time_sec,
            "avg_hold_time_sec": avg_hold_time_sec,
            "answered_calls": answered_calls,
            "abandoned_calls": abandoned_calls,
        },
    }


@router.get("/dashboard/csat/summary")
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
            .select("created_at_source,rating_csat,channel")
            .gte("created_at_source", start_dt)
            .lte("created_at_source", end_dt)
            .execute()
        )

        rows = res.data or []
        total_responses = len(rows)

        rating_distribution = {}
        rating_sum = 0.0
        rating_count = 0

        for row in rows:
            rating = row.get("rating_csat")
            rating_text = str(rating).strip() if rating is not None else None

            if rating_text:
                rating_distribution[rating_text] = rating_distribution.get(rating_text, 0) + 1

                try:
                    rating_sum += float(rating_text)
                    rating_count += 1
                except Exception:
                    pass

        avg_rating = round(rating_sum / rating_count, 2) if rating_count else 0

        distribution_data = [
            {"rating": rating, "total": total}
            for rating, total in sorted(rating_distribution.items(), key=lambda x: x[0])
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch CSAT summary: {str(e)}"
        )

    return {
        "filter": {
            "granularity": granularity,
            "year": year,
            "month": month,
            "quarter": quarter,
            "start_date": str(start_date),
            "end_date": str(end_date),
        },
        "summary": {
            "total_responses": total_responses,
            "avg_rating": avg_rating,
            "rating_distribution": distribution_data,
        },
    }
from fastapi import APIRouter, HTTPException, Query
from app.core.supabase import supabase
from app.utils.date_filter import get_date_range
from datetime import datetime
from collections import defaultdict

router = APIRouter(prefix="/api/dashboard/voice", tags=["voice"])


def safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default


def hour_label(dt: datetime) -> str:
    return dt.strftime("%H")


def month_label(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


def day_name_id(dt: datetime) -> str:
    names = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
    return names[dt.weekday()]


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
    end_dt = f"{end_date}T23:59:59"

    try:
        res = (
            supabase.table("voice_interactions")
            .select("interaction_at,wait_time_sec,talk_time_sec,call_status")
            .gte("interaction_at", start_dt)
            .lte("interaction_at", end_dt)
            .execute()
        )

        rows = res.data or []
        total_calls = len(rows)

        answered_calls = 0
        abandoned_calls = 0
        total_wait = 0.0
        total_talk = 0.0

        for row in rows:
            wait_time = safe_float(row.get("wait_time_sec"), 0)
            talk_time = safe_float(row.get("talk_time_sec"), 0)
            status = (row.get("call_status") or "").upper()

            total_wait += wait_time
            total_talk += talk_time

            if "ABANDON" in status:
                abandoned_calls += 1
            else:
                answered_calls += 1

        avg_waitingtime = round(total_wait / total_calls, 2) if total_calls else 0
        avg_handlingtime = round(total_talk / total_calls, 2) if total_calls else 0
        successrate = round((answered_calls / total_calls) * 100, 2) if total_calls else 0

        return {
            "total_voice_interactions": total_calls,
            "answered_calls": answered_calls,
            "abandoned_calls": abandoned_calls,
            "avg_waitingtime": avg_waitingtime,
            "avg_handlingtime": avg_handlingtime,
            "successrate": successrate,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch voice summary: {str(e)}")


@router.get("/daily")
async def get_voice_daily(
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
            .select("interaction_at")
            .gte("interaction_at", start_dt)
            .lte("interaction_at", end_dt)
            .execute()
        )

        rows = res.data or []
        grouped = defaultdict(int)

        for row in rows:
            interaction_at = row.get("interaction_at")
            if not interaction_at:
                continue
            try:
                dt = datetime.fromisoformat(interaction_at.replace("Z", "+00:00"))
            except Exception:
                continue

            label = dt.strftime("%Y-%m-%d")
            grouped[label] += 1

        data = [{"label": label, "total": total} for label, total in sorted(grouped.items())]
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch voice daily data: {str(e)}")


@router.get("/by-hour")
async def get_voice_by_hour(
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
            .select("interaction_at")
            .gte("interaction_at", start_dt)
            .lte("interaction_at", end_dt)
            .execute()
        )

        rows = res.data or []
        grouped = defaultdict(int)

        for row in rows:
            interaction_at = row.get("interaction_at")
            if not interaction_at:
                continue
            try:
                dt = datetime.fromisoformat(interaction_at.replace("Z", "+00:00"))
            except Exception:
                continue

            label = hour_label(dt)
            grouped[label] += 1

        data = [{"label": label, "total": total} for label, total in sorted(grouped.items())]
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch voice by hour: {str(e)}")


@router.get("/by-day")
async def get_voice_by_day(
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
            .select("interaction_at")
            .gte("interaction_at", start_dt)
            .lte("interaction_at", end_dt)
            .execute()
        )

        rows = res.data or []
        grouped = defaultdict(int)

        for row in rows:
            interaction_at = row.get("interaction_at")
            if not interaction_at:
                continue
            try:
                dt = datetime.fromisoformat(interaction_at.replace("Z", "+00:00"))
            except Exception:
                continue

            label = day_name_id(dt)
            grouped[label] += 1

        ordered_days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
        data = [{"label": day, "total": grouped.get(day, 0)} for day in ordered_days]
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch voice by day: {str(e)}")


@router.get("/by-agent")
async def get_voice_by_agent(
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
            .select("agent_name,talk_time_sec,wait_time_sec,interaction_at")
            .gte("interaction_at", start_dt)
            .lte("interaction_at", end_dt)
            .execute()
        )

        rows = res.data or []
        grouped = defaultdict(lambda: {"total_calls": 0, "total_talk": 0.0, "total_wait": 0.0})

        for row in rows:
            agent = (row.get("agent_name") or "Unknown").strip()
            grouped[agent]["total_calls"] += 1
            grouped[agent]["total_talk"] += safe_float(row.get("talk_time_sec"), 0)
            grouped[agent]["total_wait"] += safe_float(row.get("wait_time_sec"), 0)

        data = []
        for agent, item in sorted(grouped.items(), key=lambda x: x[1]["total_calls"], reverse=True):
            total_calls = item["total_calls"]
            avg_handlingtime = round(item["total_talk"] / total_calls, 2) if total_calls else 0
            avg_waitingtime = round(item["total_wait"] / total_calls, 2) if total_calls else 0

            data.append({
                "agent": agent,
                "total_calls": total_calls,
                "avg_handlingtime": avg_handlingtime,
                "avg_waitingtime": avg_waitingtime,
            })

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch voice by agent: {str(e)}")
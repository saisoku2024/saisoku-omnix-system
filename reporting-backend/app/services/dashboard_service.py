from collections import Counter, defaultdict
from app.supabase_client import supabase


def _safe_list(data):
    return data if isinstance(data, list) else []


def _month_key(dt_value):
    if not dt_value:
        return None
    try:
        return str(dt_value)[:7]
    except Exception:
        return None


def _apply_date_filter(query, column, start_date, end_date):
    if start_date:
        query = query.gte(column, start_date)
    if end_date:
        query = query.lte(column, end_date)
    return query


# =========================
# SUMMARY
# =========================
def get_dashboard_summary(start_date=None, end_date=None):
    voice_query = _apply_date_filter(
        supabase.table("voice_interactions").select("*"),
        "interaction_at", start_date, end_date
    )

    omnix_query = _apply_date_filter(
        supabase.table("omnix_cases").select("*"),
        "interaction_at", start_date, end_date
    )

    csat_query = _apply_date_filter(
        supabase.table("csat_responses").select("*"),
        "created_at_source", start_date, end_date
    )

    voice_rows = _safe_list(voice_query.execute().data)
    omnix_rows = _safe_list(omnix_query.execute().data)
    csat_rows = _safe_list(csat_query.execute().data)

    scores = []
    for row in csat_rows:
        try:
            score = row.get("rating_csat") or row.get("score")
            if score:
                scores.append(float(score))
        except:
            pass

    avg_csat = round(sum(scores) / len(scores), 2) if scores else 0

    return {
        "total_voice_interactions": len(voice_rows),
        "total_omnix_cases": len(omnix_rows),
        "total_csat_responses": len(csat_rows),
        "average_csat": avg_csat
    }


# =========================
# TREND
# =========================
def get_dashboard_trend(start_date=None, end_date=None):
    voice_rows = _safe_list(
        _apply_date_filter(
            supabase.table("voice_interactions").select("interaction_at"),
            "interaction_at", start_date, end_date
        ).execute().data
    )

    omnix_rows = _safe_list(
        _apply_date_filter(
            supabase.table("omnix_cases").select("interaction_at"),
            "interaction_at", start_date, end_date
        ).execute().data
    )

    csat_rows = _safe_list(
        _apply_date_filter(
            supabase.table("csat_responses").select("created_at_source"),
            "created_at_source", start_date, end_date
        ).execute().data
    )

    trend_map = defaultdict(lambda: {"voice": 0, "omnix": 0, "csat": 0})

    for row in voice_rows:
        key = _month_key(row.get("interaction_at"))
        if key:
            trend_map[key]["voice"] += 1

    for row in omnix_rows:
        key = _month_key(row.get("interaction_at"))
        if key:
            trend_map[key]["omnix"] += 1

    for row in csat_rows:
        key = _month_key(row.get("created_at_source"))
        if key:
            trend_map[key]["csat"] += 1

    return [
        {"month": m, **trend_map[m]}
        for m in sorted(trend_map.keys())
    ]


# =========================
# BY CHANNEL
# =========================
def get_dashboard_by_channel(start_date=None, end_date=None):
    rows = []

    rows += _safe_list(_apply_date_filter(
        supabase.table("omnix_cases").select("channel"),
        "interaction_at", start_date, end_date
    ).execute().data)

    rows += _safe_list(_apply_date_filter(
        supabase.table("voice_interactions").select("channel"),
        "interaction_at", start_date, end_date
    ).execute().data)

    rows += _safe_list(_apply_date_filter(
        supabase.table("csat_responses").select("channel"),
        "created_at_source", start_date, end_date
    ).execute().data)

    counter = Counter()

    for r in rows:
        channel = r.get("channel") or "unknown"
        counter[channel] += 1

    return [{"channel": k, "total": v} for k, v in counter.items()]


# =========================
# VOICE SUMMARY
# =========================
def get_voice_summary(start_date=None, end_date=None):
    rows = _safe_list(
        _apply_date_filter(
            supabase.table("voice_interactions").select("*"),
            "interaction_at", start_date, end_date
        ).execute().data
    )

    total_calls = len(rows)
    talk = sum(int(r.get("talk_time_sec") or 0) for r in rows)
    wait = sum(int(r.get("wait_time_sec") or 0) for r in rows)
    hold = sum(int(r.get("hold_time_sec") or 0) for r in rows)

    agent_counter = Counter()
    queue_counter = Counter()

    for r in rows:
        agent_counter[r.get("agent_name") or "unknown"] += 1
        queue_counter[r.get("queue_name") or "unknown"] += 1

    return {
        "total_calls": total_calls,
        "avg_talk_time_sec": round(talk / total_calls, 2) if total_calls else 0,
        "avg_wait_time_sec": round(wait / total_calls, 2) if total_calls else 0,
        "avg_hold_time_sec": round(hold / total_calls, 2) if total_calls else 0,
        "top_agents": [{"agent_name": k, "total_calls": v} for k, v in agent_counter.most_common(10)],
        "top_queues": [{"queue_name": k, "total_calls": v} for k, v in queue_counter.most_common(10)],
    }


# =========================
# CSAT SUMMARY
# =========================
def get_csat_summary(start_date=None, end_date=None):
    rows = _safe_list(
        _apply_date_filter(
            supabase.table("csat_responses").select("*"),
            "created_at_source", start_date, end_date
        ).execute().data
    )

    ratings = []
    rating_counter = Counter()
    channel_counter = Counter()

    for r in rows:
        rating = r.get("rating_csat") or r.get("score")
        channel = r.get("channel") or "unknown"

        if channel:
            channel_counter[channel] += 1

        try:
            if rating:
                val = float(rating)
                ratings.append(val)
                rating_counter[str(int(val))] += 1
        except:
            pass

    return {
        "total_responses": len(rows),
        "average_rating": round(sum(ratings)/len(ratings), 2) if ratings else 0,
        "rating_distribution": [{"rating": k, "total": v} for k, v in rating_counter.items()],
        "channel_distribution": [{"channel": k, "total": v} for k, v in channel_counter.items()],
    }
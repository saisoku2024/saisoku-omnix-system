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


def get_dashboard_summary(start_date=None, end_date=None):
    voice_query = supabase.table("voice_interactions").select("*")
    omnix_query = supabase.table("omnix_cases").select("*")
    csat_query = supabase.table("csat_responses").select("*")

    if start_date:
        voice_query = voice_query.gte("interaction_at", start_date)
        omnix_query = omnix_query.gte("interaction_at", start_date)
        csat_query = csat_query.gte("created_at_source", start_date)

    if end_date:
        voice_query = voice_query.lte("interaction_at", end_date)
        omnix_query = omnix_query.lte("interaction_at", end_date)
        csat_query = csat_query.lte("created_at_source", end_date)

    voice_rows = _safe_list(voice_query.execute().data)
    omnix_rows = _safe_list(omnix_query.execute().data)
    csat_rows = _safe_list(csat_query.execute().data)

    avg_csat = 0
    scores = []

    for row in csat_rows:
        try:
            score = row.get("rating_csat") or row.get("score")
            if score:
                scores.append(float(score))
        except:
            pass

    if scores:
        avg_csat = round(sum(scores) / len(scores), 2)

    return {
        "total_voice_interactions": len(voice_rows),
        "total_omnix_cases": len(omnix_rows),
        "total_csat_responses": len(csat_rows),
        "average_csat": avg_csat
    }
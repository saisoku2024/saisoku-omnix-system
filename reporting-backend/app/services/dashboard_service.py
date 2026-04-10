from collections import defaultdict
from datetime import datetime
from app.core.supabase import supabase


def safe_float(value, default=0.0):
    try:
        return float(value)
    except:
        return default


def sec_to_mmss(seconds):
    seconds = int(seconds or 0)
    minutes = seconds // 60
    remain = seconds % 60
    return f"{minutes:02d}:{remain:02d}"


# =========================================================
# HOME
# =========================================================

def get_dashboard_summary():
    voice = supabase.table("voice_interactions").select("id", count="exact").execute()
    omnix = supabase.table("omnix_cases").select("id", count="exact").execute()
    csat = supabase.table("csat_responses").select("id, rating_csat").execute()

    total_voice = voice.count or 0
    total_omnix = omnix.count or 0
    total_csat = len(csat.data or [])

    ratings = [safe_float(row.get("rating_csat")) for row in (csat.data or []) if row.get("rating_csat")]
    avg_csat = round(sum(ratings) / len(ratings), 2) if ratings else 0

    return {
        "total_voice_interactions": total_voice,
        "total_omnix_cases": total_omnix,
        "total_csat_responses": total_csat,
        "average_csat": avg_csat,
    }


def get_dashboard_trend():
    result = []

    voice_rows = supabase.table("voice_interactions").select("created_at").execute().data or []
    omnix_rows = supabase.table("omnix_cases").select("created_at").execute().data or []
    csat_rows = supabase.table("csat_responses").select("created_at").execute().data or []

    trend_map = defaultdict(lambda: {"voice": 0, "omnix": 0, "csat": 0})

    for row in voice_rows:
        created = row.get("created_at")
        if created:
            month = str(created)[:7]
            trend_map[month]["voice"] += 1

    for row in omnix_rows:
        created = row.get("created_at")
        if created:
            month = str(created)[:7]
            trend_map[month]["omnix"] += 1

    for row in csat_rows:
        created = row.get("created_at")
        if created:
            month = str(created)[:7]
            trend_map[month]["csat"] += 1

    for month in sorted(trend_map.keys()):
        result.append({
            "month": month,
            "voice": trend_map[month]["voice"],
            "omnix": trend_map[month]["omnix"],
            "csat": trend_map[month]["csat"],
        })

    return result


def get_dashboard_by_channel():
    result = []

    omnix_rows = supabase.table("omnix_cases").select("channel").execute().data or []
    csat_rows = supabase.table("csat_responses").select("channel").execute().data or []
    voice_rows = supabase.table("voice_interactions").select("channel").execute().data or []

    channel_map = defaultdict(int)

    for row in omnix_rows:
        channel = row.get("channel") or "Unknown"
        channel_map[channel] += 1

    for row in csat_rows:
        channel = row.get("channel") or "Unknown"
        channel_map[channel] += 1

    for row in voice_rows:
        channel = row.get("channel") or "Voice"
        channel_map[channel] += 1

    for channel, total in channel_map.items():
        result.append({
            "channel": channel,
            "total": total
        })

    return result


# =========================================================
# VOICE
# =========================================================

def get_voice_summary():
    rows = supabase.table("voice_interactions").select("*").execute().data or []

    total_calls = len(rows)
    answered_calls = sum(1 for r in rows if str(r.get("status", "")).lower() in ["answered", "completed", "success"])
    abandoned_calls = total_calls - answered_calls

    handling_times = [safe_float(r.get("talk_time_sec")) for r in rows if r.get("talk_time_sec") is not None]
    waiting_times = [safe_float(r.get("wait_time_sec")) for r in rows if r.get("wait_time_sec") is not None]

    avg_handling = round(sum(handling_times) / len(handling_times), 2) if handling_times else 0
    avg_waiting = round(sum(waiting_times) / len(waiting_times), 2) if waiting_times else 0

    success_rate = round((answered_calls / total_calls) * 100, 2) if total_calls else 0

    return {
        "total_voice_interactions": total_calls,
        "answered_calls": answered_calls,
        "abandoned_calls": abandoned_calls,
        "avg_handling_time": sec_to_mmss(avg_handling),
        "avg_waiting_time": sec_to_mmss(avg_waiting),
        "success_rate": success_rate,
    }


def get_voice_daily():
    rows = supabase.table("voice_interactions").select("created_at").execute().data or []
    daily_map = defaultdict(int)

    for row in rows:
        created = row.get("created_at")
        if created:
            day = str(created)[8:10]
            daily_map[day] += 1

    result = [{"label": day, "total": total} for day, total in sorted(daily_map.items())]
    return result


def get_voice_by_hour():
    rows = supabase.table("voice_interactions").select("created_at").execute().data or []
    hour_map = defaultdict(int)

    for row in rows:
        created = row.get("created_at")
        if created and len(str(created)) >= 13:
            hour = str(created)[11:13]
            hour_map[hour] += 1

    result = [{"label": hour, "total": total} for hour, total in sorted(hour_map.items())]
    return result


def get_voice_by_day():
    rows = supabase.table("voice_interactions").select("created_at").execute().data or []
    day_map = defaultdict(int)

    day_names = {
        0: "Sen",
        1: "Sel",
        2: "Rab",
        3: "Kam",
        4: "Jum",
        5: "Sab",
        6: "Min",
    }

    for row in rows:
        created = row.get("created_at")
        if created:
            try:
                dt = datetime.fromisoformat(str(created).replace("Z", "+00:00"))
                day_map[day_names[dt.weekday()]] += 1
            except:
                pass

    ordered_days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
    result = [{"label": d, "total": day_map.get(d, 0)} for d in ordered_days]
    return result


def get_voice_by_agent():
    rows = supabase.table("voice_interactions").select("agent_name, talk_time_sec, wait_time_sec").execute().data or []

    agent_map = defaultdict(lambda: {"total": 0, "talk_sum": 0, "wait_sum": 0})

    for row in rows:
        agent = row.get("agent_name") or "Unknown"
        agent_map[agent]["total"] += 1
        agent_map[agent]["talk_sum"] += safe_float(row.get("talk_time_sec"))
        agent_map[agent]["wait_sum"] += safe_float(row.get("wait_time_sec"))

    result = []
    for agent, data in agent_map.items():
        total = data["total"]
        avg_talk = data["talk_sum"] / total if total else 0
        avg_wait = data["wait_sum"] / total if total else 0

        result.append({
            "agent": agent,
            "total_calls": total,
            "avg_handling_time": sec_to_mmss(avg_talk),
            "avg_waiting_time": sec_to_mmss(avg_wait),
        })

    result.sort(key=lambda x: x["total_calls"], reverse=True)
    return result


# =========================================================
# CSAT
# =========================================================

def get_csat_summary():
    rows = supabase.table("csat_responses").select("*").execute().data or []

    total = len(rows)
    ratings = [safe_float(r.get("rating_csat")) for r in rows if r.get("rating_csat")]
    avg = round(sum(ratings) / len(ratings), 2) if ratings else 0

    high_score = sum(1 for r in ratings if r >= 4)
    low_score = sum(1 for r in ratings if r <= 3)

    return {
        "total_csat_responses": total,
        "average_csat": avg,
        "high_score": high_score,
        "low_score": low_score,
    }


def get_csat_rating_breakdown():
    rows = supabase.table("csat_responses").select("created_at, rating_csat").execute().data or []

    month_map = defaultdict(lambda: {"score1": 0, "score2": 0, "score3": 0, "score4": 0, "score5": 0})

    for row in rows:
        created = row.get("created_at")
        rating = str(row.get("rating_csat") or "").strip()

        if created:
            month = str(created)[:7]
            if rating == "1":
                month_map[month]["score1"] += 1
            elif rating == "2":
                month_map[month]["score2"] += 1
            elif rating == "3":
                month_map[month]["score3"] += 1
            elif rating == "4":
                month_map[month]["score4"] += 1
            elif rating == "5":
                month_map[month]["score5"] += 1

    result = []
    for month in sorted(month_map.keys()):
        result.append({
            "month": month,
            **month_map[month]
        })

    return result


def get_csat_monthly_score():
    rows = supabase.table("csat_responses").select("created_at, rating_csat").execute().data or []

    month_map = defaultdict(list)

    for row in rows:
        created = row.get("created_at")
        rating = safe_float(row.get("rating_csat"))

        if created:
            month = str(created)[:7]
            month_map[month].append(rating)

    result = []
    for month in sorted(month_map.keys()):
        ratings = month_map[month]
        avg = round(sum(ratings) / len(ratings), 2) if ratings else 0
        score_percent = round((avg / 5) * 100, 2) if avg else 0

        result.append({
            "month": month,
            "score": score_percent
        })

    return result


def get_csat_by_agent():
    rows = supabase.table("csat_responses").select("account, rating_csat").execute().data or []

    agent_map = defaultdict(list)

    for row in rows:
        agent = row.get("account") or "Unknown"
        rating = safe_float(row.get("rating_csat"))
        agent_map[agent].append(rating)

    result = []
    for agent, ratings in agent_map.items():
        avg = round(sum(ratings) / len(ratings), 2) if ratings else 0
        result.append({
            "agent": agent,
            "total_response": len(ratings),
            "score": avg
        })

    result.sort(key=lambda x: x["total_response"], reverse=True)
    return result
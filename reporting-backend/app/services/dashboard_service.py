from collections import defaultdict
from datetime import datetime
from app.core.supabase import supabase

def get_date_range(mode, period, year):
    month_map = {
        "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4,
        "May": 5, "Jun": 6, "Jul": 7, "Aug": 8,
        "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
    }

    try:
        if mode == "monthly":
            m = month_map.get(period, 1)
            start = datetime(year, m, 1)
            if m == 12:
                end = datetime(year + 1, 1, 1)
            else:
                end = datetime(year, m + 1, 1)

        elif mode == "quarter":
            q_map = {
                "Q1": (1, 4), "Q2": (4, 7), "Q3": (7, 10), "Q4": (10, 13),
            }
            sm, em = q_map.get(period, (1, 4))
            start = datetime(year, sm, 1)
            if em == 13:
                end = datetime(year + 1, 1, 1)
            else:
                end = datetime(year, em, 1)
        else: # yearly
            start = datetime(year, 1, 1)
            end = datetime(year + 1, 1, 1)

        # Kembalikan format string ISO (YYYY-MM-DDTHH:MM:SS)
        return start.isoformat(), end.isoformat()
    except Exception as e:
        print(f"DATE RANGE ERROR: {e}")
        return "2026-01-01T00:00:00", "2026-12-31T23:59:59"

def get_dashboard_summary(mode, period, year):
    start, end = get_date_range(mode, period, year)
    print(f"DEBUG: Querying Summary from {start} to {end}") # Cek ini di terminal

    try:
        # Voice Interactions
        voice = supabase.table("voice_interactions") \
            .select("id", count="exact") \
            .gte("created_at", start) \
            .lt("created_at", end) \
            .execute()

        # Omnix Cases
        omnix = supabase.table("omnix_cases") \
            .select("id", count="exact") \
            .gte("created_at", start) \
            .lt("created_at", end) \
            .execute()

        # CSAT (Ambil rating saja untuk hemat bandwidth)
        csat = supabase.table("csat_responses") \
            .select("rating_csat") \
            .gte("created_at", start) \
            .lt("created_at", end) \
            .execute()

        csat_data = csat.data or []
        
        # Hitung Average CSAT
        ratings = [float(x["rating_csat"]) for x in csat_data if x.get("rating_csat") is not None]
        avg = sum(ratings) / len(ratings) if ratings else 0

        result = {
            "total_voice_interactions": voice.count if voice.count is not None else 0,
            "total_omnix_cases": omnix.count if omnix.count is not None else 0,
            "total_csat_responses": len(csat_data),
            "average_csat": round(avg, 2),
        }
        print(f"DEBUG: Summary Result -> {result}")
        return result

    except Exception as e:
        print(f"DATABASE ERROR (Summary): {e}")
        return {"total_voice_interactions": 0, "total_omnix_cases": 0, "total_csat_responses": 0, "average_csat": 0}

def get_dashboard_trend(mode, period, year):
    start, end = get_date_range(mode, period, year)
    try:
        rows = supabase.table("csat_responses") \
            .select("created_at") \
            .gte("created_at", start) \
            .lt("created_at", end) \
            .execute().data or []

        counter = defaultdict(int)
        for r in rows:
            # Ambil tanggal saja YYYY-MM-DD
            d = str(r["created_at"])[:10]
            counter[d] += 1

        return sorted([{"date": k, "count": v} for k, v in counter.items()], key=lambda x: x['date'])
    except Exception as e:
        print(f"DATABASE ERROR (Trend): {e}")
        return []

def get_dashboard_by_channel(mode, period, year):
    start, end = get_date_range(mode, period, year)
    try:
        rows = supabase.table("omnix_cases") \
            .select("channel") \
            .gte("created_at", start) \
            .lt("created_at", end) \
            .execute().data or []

        counter = defaultdict(int)
        for r in rows:
            ch = r.get("channel") or "Unknown"
            counter[ch] += 1

        return [{"name": k, "count": v} for k, v in counter.items()]
    except Exception as e:
        print(f"DATABASE ERROR (Channel): {e}")
        return []
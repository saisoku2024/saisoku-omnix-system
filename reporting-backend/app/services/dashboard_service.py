from app.core.supabase import supabase
from app.utils.date_filter import get_date_range
from collections import defaultdict

def get_dashboard_summary(mode, period, year):
    start, end = get_date_range(mode, period, year)
    try:
        # 1. Voice
        voice_data = supabase.table("voice_interactions").select("id") \
            .gte("created_at", start).lt("created_at", end).execute().data or []
        
        # 2. Omnix
        omnix_data = supabase.table("omnix_cases") \
            .select("handling_time_sec") \
            .gte("created_at", start).lt("created_at", end).execute().data or []

        # 3. CSAT - Nama kolom 'score'
        csat_data = supabase.table("csat_responses").select("score") \
            .gte("created_at", start).lt("created_at", end).execute().data or []
        
        # Perhitungan Metrics
        avg_csat = sum([float(x["score"]) for x in csat_data if x.get("score")]) / len(csat_data) if csat_data else 0
        avg_aht = sum([x["handling_time_sec"] for x in omnix_data if x.get("handling_time_sec")]) / len(omnix_data) if omnix_data else 0

        return {
            "total_voice_interactions": len(voice_data),
            "total_omnix_cases": len(omnix_data),
            "total_csat_responses": len(csat_data),
            "average_csat": round(avg_csat, 2),
            "avg_aht_sec": round(avg_aht, 2)
        }
    except Exception as e:
        print(f"ERROR SUMMARY: {e}")
        return {"total_voice_interactions": 0, "total_omnix_cases": 0, "total_csat_responses": 0, "average_csat": 0}

def get_dashboard_trend(mode, period, year):
    start, end = get_date_range(mode, period, year)
    try:
        rows = supabase.table("omnix_cases").select("created_at") \
            .gte("created_at", start).lt("created_at", end).execute().data or []

        counter = defaultdict(int)
        for r in rows:
            # Ambil tanggal saja YYYY-MM-DD
            d = str(r["created_at"])[:10]
            counter[d] += 1

        return sorted([{"date": k, "count": v} for k, v in counter.items()], key=lambda x: x['date'])
    except Exception as e:
        print(f"ERROR TREND: {e}")
        return []

def get_dashboard_by_channel(mode, period, year):
    start, end = get_date_range(mode, period, year)
    try:
        rows = supabase.table("omnix_cases").select("channel") \
            .gte("created_at", start).lt("created_at", end).execute().data or []

        counter = defaultdict(int)
        for r in rows:
            ch = r.get("channel") or "Unknown"
            counter[ch] += 1

        return [{"name": k, "count": v} for k, v in counter.items()]
    except Exception as e:
        print(f"ERROR CHANNEL: {e}")
        return []
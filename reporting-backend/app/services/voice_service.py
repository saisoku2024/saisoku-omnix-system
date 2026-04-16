import pandas as pd
from app.core.supabase import supabase
from app.utils.date_filter import get_date_range

class VoiceService:
    @staticmethod
    def get_stats(mode, period, year):
        start, end = get_date_range(mode, period, year)
        # Ambil data sesuai kolom asli: talk_time_sec, wait_time_sec, call_status
        res = supabase.table("voice_interactions").select(
            "call_status, talk_time_sec, wait_time_sec, agent_name, created_at"
        ).gte("created_at", start).lt("created_at", end).execute().data
        
        df = pd.DataFrame(res)
        if df.empty: return {"kpi": {}, "charts": {}}

        total = len(df)
        # Hitung Answered berdasarkan status 'COMPLETE'
        answered = len(df[df['call_status'].str.contains('COMPLETE', na=False)])

        return {
            "kpi": {
                "total_calls": total,
                "answered": answered,
                "scr_percent": round((answered / total * 100), 2) if total > 0 else 0,
                "avg_talk_time": round(df['talk_time_sec'].mean(), 2)
            },
            "charts": {
                "agent_talk_time": df.groupby('agent_name')['talk_time_sec'].mean().round(2).to_dict(),
                "call_status_dist": df.groupby('call_status').size().to_dict()
            }
        }
import pandas as pd
from app.core.supabase import supabase
from app.utils.date_filter import get_date_range

class OmnixService:
    @staticmethod
    def get_stats(mode, period, year):
        start, end = get_date_range(mode, period, year)
        # Ambil data sesuai kolom asli: handling_time_sec, response_time_sec, waiting_time_sec
        res = supabase.table("omnix_cases").select(
            "channel, main_category, category, agent_name, handling_time_sec, response_time_sec, waiting_time_sec, created_at"
        ).gte("created_at", start).lt("created_at", end).execute().data
        
        df = pd.DataFrame(res)
        if df.empty: return {"kpi": {}, "charts": {}}

        return {
            "kpi": {
                "total_tickets": len(df),
                "avg_aht": round(df['handling_time_sec'].mean(), 2),
                "avg_art": round(df['response_time_sec'].mean(), 2),
                "avg_awt": round(df['waiting_time_sec'].mean(), 2)
            },
            "charts": {
                "by_channel": df.groupby('channel').size().to_dict(),
                "by_main_category": df.groupby('main_category').size().to_dict(),
                "by_agent": df.groupby('agent_name').size().to_dict()
            }
        }
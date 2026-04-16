import pandas as pd
from app.core.supabase import supabase
from app.utils.date_filter import get_date_range

class CsatService:
    @staticmethod
    def get_stats(mode, period, year):
        start, end = get_date_range(mode, period, year)
        # Ambil data sesuai kolom asli: rating_csat, account, feedback
        res = supabase.table("csat_responses").select(
            "rating_csat, account, channel, feedback, created_at"
        ).gte("created_at", start).lt("created_at", end).execute().data
        
        df = pd.DataFrame(res)
        if df.empty: return {"kpi": {}, "charts": {}}

        # Konversi String ke Numeric sesuai temuan audit data
        df['rating_csat'] = pd.to_numeric(df['rating_csat'], errors='coerce')
        df = df.dropna(subset=['rating_csat'])

        return {
            "kpi": {
                "avg_csat": round(df['rating_csat'].mean(), 2),
                "total_responses": len(df),
                "satisfaction_rate": round((len(df[df['rating_csat'] >= 4]) / len(df) * 100), 2) if len(df) > 0 else 0
            },
            "charts": {
                "rating_distribution": df['rating_csat'].value_counts().sort_index().to_dict(),
                "by_account": df.groupby('account').size().to_dict()
            }
        }
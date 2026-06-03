from app.core.supabase import supabase
from datetime import datetime

class AnalyticsService:
    @staticmethod
    def get_home_overview():
        try:
            # 1. Fetch data OMNIX
            omnix_res = supabase.table("omnix_cases").select(
                "handling_time_sec, response_time_sec, waiting_time_sec, agent_name, customer_name"
            ).execute()
            
            # 2. Fetch data VOICE
            voice_res = supabase.table("voice_interactions").select(
                "call_status, talk_time_sec, wait_time_sec"
            ).execute()

            # 3. Fetch data CSAT
            csat_res = supabase.table("csat_responses").select("score").execute()

            # --- LOGIC PERHITUNGAN OMNIX ---
            omnix_data = omnix_res.data or []
            total_case = len(omnix_data)
            
            # Gunakan .get() untuk menghindari KeyError
            art = sum(d.get('response_time_sec') or 0 for d in omnix_data) / total_case if total_case > 0 else 0
            aht = sum(d.get('handling_time_sec') or 0 for d in omnix_data) / total_case if total_case > 0 else 0
            awt = sum(d.get('waiting_time_sec') or 0 for d in omnix_data) / total_case if total_case > 0 else 0

            # --- LOGIC PERHITUNGAN CSAT ---
            csat_data = csat_res.data or []
            total_csat = len(csat_data)
            avg_csat = sum(float(c.get('score') or 0) for c in csat_data) / total_csat if total_csat > 0 else 0

            return {
                "total_case": total_case,
                "art_avg_sec": round(art, 2),
                "aht_avg_sec": round(aht, 2),
                "awt_avg_sec": round(awt, 2),
                "csat_score": round(avg_csat, 2),
                "status": "success"
            }
        except Exception as e:
            print(f"ERROR ANALYTICS OVERVIEW: {e}")
            # Kembalikan response default agar UI tidak blank
            return {
                "total_case": 0,
                "art_avg_sec": 0,
                "aht_avg_sec": 0,
                "awt_avg_sec": 0,
                "csat_score": 0,
                "status": "error"
            }
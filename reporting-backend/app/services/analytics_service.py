from app.core.supabase import supabase


def _rpc_json(data):
    if isinstance(data, dict):
        return data
    if isinstance(data, list) and data:
        first = data[0]
        return first if isinstance(first, dict) else {}
    return {}


class AnalyticsService:
    @staticmethod
    def get_home_overview():
        try:
            res = supabase.rpc(
                "get_dashboard_home",
                {
                    "p_start": "1900-01-01T00:00:00+00:00",
                    "p_end": "2999-12-31T00:00:00+00:00",
                    "p_mode": "yearly",
                    "p_year": 2026,
                }
            ).execute()

            data = _rpc_json(res.data)
            summary = data.get("summary") or {}

            return {
                "total_case": int(summary.get("total_ticket") or 0),
                "art_avg_sec": round(float(summary.get("avg_art") or 0), 2),
                "aht_avg_sec": round(float(summary.get("avg_aht") or 0), 2),
                "awt_avg_sec": round(float(summary.get("avg_awt") or 0), 2),
                "csat_score": round(float(summary.get("csat") or 0), 2),
                "status": "success",
            }

        except Exception as e:
            print(f"ERROR ANALYTICS OVERVIEW: {e}")
            return {
                "total_case": 0,
                "art_avg_sec": 0,
                "aht_avg_sec": 0,
                "awt_avg_sec": 0,
                "csat_score": 0,
                "status": "error",
            }

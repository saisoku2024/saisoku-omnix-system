import logging
from app.core.supabase import supabase
from app.utils.date_filter import get_date_range

logger = logging.getLogger(__name__)

class CsatService:

    # =========================
    # MASTER (ALL) - FINAL 🔥
    # =========================
    @staticmethod
    def get_all(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "get_csat_dashboard",
                {
                    "p_start": start,
                    "p_end": end
                }
            ).execute()

            data = res.data if res.data else {}

            return {
                "summary": data.get("summary", {
                    "total_response": 0,
                    "high_score": 0,
                    "low_score": 0,
                    "avg_csat": 0
                }),
                "distribution": data.get("distribution", []),
                "trend": data.get("trend", []),
                "top_agent_total": data.get("top_agent_total", []),
                "top_agent_avg": data.get("top_agent_avg", [])
            }

        except Exception as e:
            logger.error(f"ERROR CSAT MASTER ALL: {e}", exc_info=True)
            return {
                "summary": {
                    "total_response": 0,
                    "high_score": 0,
                    "low_score": 0,
                    "avg_csat": 0
                },
                "distribution": [],
                "trend": [],
                "top_agent_total": [],
                "top_agent_avg": []
            }
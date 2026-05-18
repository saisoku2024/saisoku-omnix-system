from app.core.supabase import supabase
from app.utils.date_filter import get_date_range


class CsatService:

    # =========================
    # SUMMARY
    # =========================
    @staticmethod
    def get_summary(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_csat_summary",
                {"start_date": start, "end_date": end}
            ).execute()

            data = res.data[0] if res.data else {}

            return {
                "total_response": int(data.get("total_response") or 0),
                "high_score": int(data.get("high_score") or 0),
                "low_score": int(data.get("low_score") or 0),
                "avg_csat": float(data.get("avg_csat") or 0)
            }

        except Exception as e:
            print(f"ERROR CSAT SUMMARY: {e}")
            return {
                "total_response": 0,
                "high_score": 0,
                "low_score": 0,
                "avg_csat": 0
            }


    # =========================
    # TOP AGENT (TOTAL RESPONSE)
    # =========================
    @staticmethod
    def get_top_agent_total(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_csat_top_agent_total",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"agent": r["agent_name"], "total": r["total"]}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR CSAT TOP TOTAL: {e}")
            return []


    # =========================
    # TOP AGENT (AVG CSAT)
    # =========================
    @staticmethod
    def get_top_agent_avg(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_csat_top_agent_avg",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {
                    "agent": r["agent_name"],
                    "avg_csat": float(r["avg_csat"]),
                    "total": r["total"]
                }
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR CSAT TOP AVG: {e}")
            return []


    # =========================
    # RATING DISTRIBUTION
    # =========================
    @staticmethod
    def get_distribution(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_csat_distribution",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"rating": int(r["rating"]), "count": r["total"]}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR CSAT DISTRIBUTION: {e}")
            return []


    # =========================
    # MASTER (ALL)
    # =========================
    @staticmethod
    def get_all(mode, period, year):
        return {
            "summary": CsatService.get_summary(mode, period, year),
            "top_agent_total": CsatService.get_top_agent_total(mode, period, year),
            "top_agent_avg": CsatService.get_top_agent_avg(mode, period, year),
            "distribution": CsatService.get_distribution(mode, period, year),
        }
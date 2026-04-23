from app.core.supabase import supabase
from app.utils.date_filter import get_date_range


class VoiceService:

    # =========================
    # KPI SUMMARY
    # =========================
    @staticmethod
    def get_summary(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_voice_summary",
                {"start_date": start, "end_date": end}
            ).execute()

            data = res.data[0] if res.data else {}

            def fmt(sec):
                sec = int(sec or 0)
                m, s = divmod(sec, 60)
                return f"{m}m {s}s"

            return {
                "total_call": int(data.get("total_call") or 0),
                "answered_call": int(data.get("answered_call") or 0),
                "abandon_call": int(data.get("abandon_call") or 0),
                "aht": fmt(data.get("avg_aht")),
                "awt": fmt(data.get("avg_awt")),
                "scr": f"{float(data.get('scr') or 0)}%"
            }

        except Exception as e:
            print(f"ERROR VOICE SUMMARY: {e}")
            return {
                "total_call": 0,
                "answered_call": 0,
                "abandon_call": 0,
                "aht": "0m 0s",
                "awt": "0m 0s",
                "scr": "0%"
            }


    # =========================
    # DAILY
    # =========================
    @staticmethod
    def get_daily(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_voice_daily",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"date": str(r["date"]), "count": r["total"]}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR VOICE DAILY: {e}")
            return []


    # =========================
    # HOURLY
    # =========================
    @staticmethod
    def get_hourly(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_voice_hourly",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"hour": r["hour"], "count": r["total"]}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR VOICE HOURLY: {e}")
            return []


    # =========================
    # BY DAY (MON-SUN)
    # =========================
    @staticmethod
    def get_by_day(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_voice_day",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"day": r["day"], "count": r["total"]}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR VOICE DAY: {e}")
            return []


    # =========================
    # STATUS DISTRIBUTION
    # =========================
    @staticmethod
    def get_by_status(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_voice_status",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"name": r["name"], "count": r["total"]}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR VOICE STATUS: {e}")
            return []


    # =========================
    # AGENT PERFORMANCE (AVG TALK TIME)
    # =========================
    @staticmethod
    def get_agent_performance(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_voice_agent",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {
                    "agent": r["agent"],
                    "avg_talk_time": int(r["avg_talk_time"] or 0)
                }
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR VOICE AGENT: {e}")
            return []


    # =========================
    # MASTER (ALL)
    # =========================
    @staticmethod
    def get_all(mode, period, year):
        return {
            "summary": VoiceService.get_summary(mode, period, year),
            "daily": VoiceService.get_daily(mode, period, year),
            "hourly": VoiceService.get_hourly(mode, period, year),
            "by_day": VoiceService.get_by_day(mode, period, year),
            "status": VoiceService.get_by_status(mode, period, year),
            "agent": VoiceService.get_agent_performance(mode, period, year),
        }
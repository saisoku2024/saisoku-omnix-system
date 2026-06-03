from app.core.supabase import supabase
from app.utils.date_filter import get_date_range


class VoiceService:
    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _fmt_duration(sec):
        sec = int(sec or 0)
        m, s = divmod(sec, 60)
        return f"{m}m {s}s"

    @staticmethod
    def _safe_int(v):
        try:
            return int(v or 0)
        except Exception:
            return 0

    @staticmethod
    def _safe_float(v):
        try:
            return float(v or 0)
        except Exception:
            return 0.0

    @staticmethod
    def _rpc(fn_name, params):
        """Wrapper RPC supabase agar konsisten."""
        res = supabase.rpc(fn_name, params).execute()
        return res.data or []

    @staticmethod
    def _date_params(mode, period, year, extra=None):
        """Generate parameter standar start_date & end_date."""
        start, end = get_date_range(mode, period, year)
        params = {"start_date": start, "end_date": end}
        if extra:
            params.update(extra)
        return params

    # =========================================================
    # SUMMARY KPI
    # =========================================================

    @staticmethod
    def get_summary(mode, period, year):
        try:
            params = VoiceService._date_params(mode, period, year)
            data_list = VoiceService._rpc("kpi_voice_summary", params)
            data = data_list[0] if data_list else {}

            return {
                "total_calls": VoiceService._safe_int(data.get("total_call")),
                "answered": VoiceService._safe_int(data.get("answered_call")),
                "abandon": VoiceService._safe_int(data.get("abandon_call")),
                "aht": VoiceService._fmt_duration(data.get("avg_aht")),
                "awt": VoiceService._fmt_duration(data.get("avg_awt")),
                "scr": round(VoiceService._safe_float(data.get("scr")), 1),
            }

        except Exception as e:
            print(f"ERROR VOICE SUMMARY: {e}")
            return {
                "total_calls": 0,
                "answered": 0,
                "abandon": 0,
                "aht": "0m 0s",
                "awt": "0m 0s",
                "scr": 0,
            }

    # =========================================================
    # DAILY
    # =========================================================

    @staticmethod
    def get_daily(mode, period, year):
        try:
            params = VoiceService._date_params(
                mode, period, year, extra={"mode": mode}
            )
            rows = VoiceService._rpc("kpi_voice_daily", params)

            return [
                {
                    "label": r.get("label"),
                    "count": VoiceService._safe_int(r.get("count")),
                }
                for r in rows
            ]

        except Exception as e:
            print(f"ERROR VOICE DAILY: {e}")
            return []

    # =========================================================
    # HOURLY
    # =========================================================

    @staticmethod
    def get_hourly(mode, period, year):
        try:
            params = VoiceService._date_params(mode, period, year)
            rows = VoiceService._rpc("kpi_voice_hourly", params)

            hour_map = {
                int(r["hour"]): VoiceService._safe_int(r["total"])
                for r in rows
            }

            return [
                {
                    "label": f"{str(h).zfill(2)}:00",
                    "count": hour_map.get(h, 0),
                }
                for h in range(24)
            ]

        except Exception as e:
            print(f"ERROR VOICE HOURLY: {e}")
            return []

    # =========================================================
    # BY DAY
    # =========================================================

    DAY_MAP = {
        "Monday": "Sen",
        "Tuesday": "Sel",
        "Wednesday": "Rab",
        "Thursday": "Kam",
        "Friday": "Jum",
        "Saturday": "Sab",
        "Sunday": "Min",
    }

    DAY_ORDER = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]

    @staticmethod
    def get_by_day(mode, period, year):
        try:
            params = VoiceService._date_params(mode, period, year)
            rows = VoiceService._rpc("kpi_voice_day", params)

            row_map = {
                r["day"]: VoiceService._safe_int(r["total"])
                for r in rows
            }

            return [
                {
                    "label": VoiceService.DAY_MAP[d],
                    "count": row_map.get(d, 0),
                }
                for d in VoiceService.DAY_ORDER
            ]

        except Exception as e:
            print(f"ERROR VOICE DAY: {e}")
            return []

    # =========================================================
    # AGENT HANDLING
    # =========================================================

    @staticmethod
    def get_agent_handling(mode, period, year):
        try:
            params = VoiceService._date_params(mode, period, year)
            rows = VoiceService._rpc("kpi_voice_agent_handling", params)

            return [
                {
                    "agent": r.get("agent"),
                    "total": VoiceService._safe_int(r.get("total")),
                }
                for r in rows
            ]

        except Exception as e:
            print(f"ERROR VOICE AGENT HANDLING: {e}")
            return []

    # =========================================================
    # AGENT AHT
    # =========================================================

    @staticmethod
    def get_agent_aht(mode, period, year):
        try:
            params = VoiceService._date_params(mode, period, year)
            rows = VoiceService._rpc("kpi_voice_agent_aht", params)

            return [
                {
                    "agent": r.get("agent"),
                    "value": VoiceService._fmt_duration(r.get("avg_talk_sec")),
                }
                for r in rows
            ]

        except Exception as e:
            print(f"ERROR VOICE AGENT AHT: {e}")
            return []

    # =========================================================
    # AGENT AWT
    # =========================================================

    @staticmethod
    def get_agent_awt(mode, period, year):
        try:
            params = VoiceService._date_params(mode, period, year)
            rows = VoiceService._rpc("kpi_voice_agent_awt", params)

            return [
                {
                    "agent": r.get("agent"),
                    "value": VoiceService._fmt_duration(r.get("avg_wait_sec")),
                }
                for r in rows
            ]

        except Exception as e:
            print(f"ERROR VOICE AGENT AWT: {e}")
            return []

    # =========================================================
    # MASTER ENDPOINT
    # =========================================================

    @staticmethod
    def get_all(mode, period, year):
        return {
            "summary": VoiceService.get_summary(mode, period, year),
            "daily": VoiceService.get_daily(mode, period, year),
            "hourly": VoiceService.get_hourly(mode, period, year),
            "byDay": VoiceService.get_by_day(mode, period, year),
            "agentHandling": VoiceService.get_agent_handling(mode, period, year),
            "agentAht": VoiceService.get_agent_aht(mode, period, year),
            "agentAwt": VoiceService.get_agent_awt(mode, period, year),
        }
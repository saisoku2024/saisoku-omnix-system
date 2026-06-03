from app.core.supabase import supabase
from app.utils.date_filter import get_date_range


class OmnixService:

    # =========================
    # KPI SUMMARY
    # =========================
    @staticmethod
    def get_summary(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_omnix_summary",
                {"start_date": start, "end_date": end}
            ).execute()

            data = res.data[0] if res.data else {}

            def fmt(sec):
                sec = int(sec or 0)
                m, s = divmod(sec, 60)
                return f"{m}m {s}s"

            return {
                "total_ticket": int(data.get("total_ticket") or 0),
                "aht": fmt(data.get("avg_aht")),
                "art": fmt(data.get("avg_art")),
                "awt": fmt(data.get("avg_awt")),
            }

        except Exception as e:
            print(f"ERROR OMNIX SUMMARY: {e}")
            return {
                "total_ticket": 0,
                "aht": "0m 0s",
                "art": "0m 0s",
                "awt": "0m 0s",
            }


    # =========================
    # DAILY CHART (ADAPTIVE TREND)
    # =========================
    @staticmethod
    def get_daily(mode, period, year):
        # SIVA FIX: Jika kuartal/tahun, paksa tarik 12 bulan (Jan-Dec) agar grafik utuh
        if mode in ["quarterly", "yearly"]:
            start = f"{year}-01-01"
            end = f"{int(year) + 1}-01-01"
        else:
            # Mode bulanan tetap tarik aslinya agar menghasilkan harian (01-31)
            start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_omnix_daily",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"label": str(r["label"]), "count": int(r["total"] or 0)}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR OMNIX DAILY: {e}")
            return []

    # =========================
    # HOURLY CHART
    # =========================
    @staticmethod
    def get_hourly(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_omnix_hourly",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"hour": r["hour"], "count": r["total"]}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR OMNIX HOURLY: {e}")
            return []


    # =========================
    # BY DAY (MON-SUN)
    # =========================
    @staticmethod
    def get_by_day(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_omnix_day",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"day": r["day"], "count": r["total"]}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR OMNIX DAY: {e}")
            return []


    # =========================
    # BY CHANNEL
    # =========================
    @staticmethod
    def get_by_channel(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_omnix_channel",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"name": r["name"], "count": r["total"]}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR OMNIX CHANNEL: {e}")
            return []


    # =========================
    # BY CATEGORY
    # =========================
    @staticmethod
    def get_by_category(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_omnix_category",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"name": r["name"], "count": r["total"]}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR OMNIX CATEGORY: {e}")
            return []


    # =========================
    # BY PRODUCT
    # =========================
    @staticmethod
    def get_by_product(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_omnix_product",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"name": r["name"], "count": r["total"]}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR OMNIX PRODUCT: {e}")
            return []


    # =========================
    # BY CUSTOMER (TOTAL & NEW)
    # =========================
    @staticmethod
    def get_customer(mode, period, year):
        # SIVA FIX: Selalu tarik 1 tahun penuh agar sumbu X selalu berisi 12 Bulan (Jan - Dec)
        start = f"{year}-01-01"
        end = f"{int(year) + 1}-01-01"

        try:
            res = supabase.rpc(
                "kpi_omnix_customers",
                {"start_date": start, "end_date": end}
            ).execute()

            return [
                {"label": str(r["label"]), "total": int(r["total"] or 0), "new": int(r["new"] or 0)}
                for r in (res.data or [])
            ]

        except Exception as e:
            print(f"ERROR OMNIX CUSTOMERS: {e}")
            return []

    # =========================
    # MASTER (ALL)
    # =========================
    @staticmethod
    def get_all(mode, period, year):
        return {
            "summary": OmnixService.get_summary(mode, period, year),
            "daily": OmnixService.get_daily(mode, period, year),
            "hourly": OmnixService.get_hourly(mode, period, year),
            "by_day": OmnixService.get_by_day(mode, period, year),
            "channel": OmnixService.get_by_channel(mode, period, year),
            "category": OmnixService.get_by_category(mode, period, year),
            "product": OmnixService.get_by_product(mode, period, year),
            "customer": OmnixService.get_customer(mode, period, year), # SIVA Fix: Integrasi RPC baru
        }
import logging
from app.core.supabase import supabase
from app.utils.date_filter import get_date_range

logger = logging.getLogger(__name__)


def _rpc_json(data):
    if isinstance(data, dict):
        return data
    if isinstance(data, list) and data:
        first = data[0]
        return first if isinstance(first, dict) else {}
    return {}


def _fmt_duration(sec):
    sec = int(float(sec or 0))
    minutes, seconds = divmod(sec, 60)
    return f"{minutes}m {seconds}s"


def _is_unknown_only(rows):
    return len(rows) == 1 and str(rows[0].get("name") or "").lower() == "unknown"


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
            logger.error(f"ERROR OMNIX SUMMARY: {e}", exc_info=True)
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
        if mode in ["quarterly", "yearly"]:
            start = f"{year}-01-01"
            end = f"{int(year) + 1}-01-01"
        else:
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
            logger.error(f"ERROR OMNIX DAILY: {e}", exc_info=True)
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
            logger.error(f"ERROR OMNIX HOURLY: {e}", exc_info=True)
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
            logger.error(f"ERROR OMNIX DAY: {e}", exc_info=True)
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
            logger.error(f"ERROR OMNIX CHANNEL: {e}", exc_info=True)
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
            logger.error(f"ERROR OMNIX CATEGORY: {e}", exc_info=True)
            return []


    # =========================
    # BY PRODUCT
    # =========================
    @staticmethod
    def _get_product_from_category(start, end):
        res = (
            supabase.table("omnix_cases")
            .select("category")
            .gte("interaction_at", start)
            .lt("interaction_at", end)
            .is_("deleted_at", "null")
            .execute()
        )

        counts = {}
        for row in res.data or []:
            name = str(row.get("category") or "").strip() or "Unknown"
            counts[name] = counts.get(name, 0) + 1

        return [
            {"name": name, "count": total}
            for name, total in sorted(
                counts.items(), key=lambda item: item[1], reverse=True
            )[:10]
        ]

    @staticmethod
    def get_by_product(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "kpi_omnix_product",
                {"start_date": start, "end_date": end}
            ).execute()

            product = [
                {"name": r["name"], "count": r["total"]}
                for r in (res.data or [])
            ]

            return (
                OmnixService._get_product_from_category(start, end)
                if not product or _is_unknown_only(product)
                else product
            )

        except Exception as e:
            logger.error(f"ERROR OMNIX PRODUCT: {e}", exc_info=True)
            try:
                return OmnixService._get_product_from_category(start, end)
            except Exception as fallback_error:
                logger.error(f"ERROR OMNIX PRODUCT FALLBACK: {fallback_error}", exc_info=True)
                return []


    # =========================
    # BY CUSTOMER (TOTAL & NEW)
    # =========================
    @staticmethod
    def get_customer(mode, period, year):
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
            logger.error(f"ERROR OMNIX CUSTOMERS: {e}", exc_info=True)
            return []

    # =========================
    # MASTER (ALL)
    # =========================
    @staticmethod
    def get_all(mode, period, year):
        start, end = get_date_range(mode, period, year)

        try:
            res = supabase.rpc(
                "get_omnix_dashboard",
                {
                    "p_start": start,
                    "p_end": end,
                    "p_mode": mode,
                    "p_year": year,
                }
            ).execute()

            data = _rpc_json(res.data)
            summary = data.get("summary") or {}

            product = [
                {
                    "name": row.get("name"),
                    "count": int(row.get("total") or 0),
                }
                for row in (data.get("product") or [])
            ]

            if not product or _is_unknown_only(product):
                product = OmnixService._get_product_from_category(start, end)

            return {
                "summary": {
                    "total_ticket": int(summary.get("total_ticket") or 0),
                    "aht": _fmt_duration(summary.get("avg_aht")),
                    "art": _fmt_duration(summary.get("avg_art")),
                    "awt": _fmt_duration(summary.get("avg_awt")),
                },
                "daily": [
                    {
                        "label": str(row.get("label") or ""),
                        "count": int(row.get("total") or 0),
                    }
                    for row in (data.get("daily") or [])
                ],
                "hourly": [
                    {
                        "hour": row.get("hour"),
                        "count": int(row.get("total") or 0),
                    }
                    for row in (data.get("hourly") or [])
                ],
                "by_day": [
                    {
                        "day": row.get("day"),
                        "count": int(row.get("total") or 0),
                    }
                    for row in (data.get("by_day") or [])
                ],
                "channel": [
                    {
                        "name": row.get("name"),
                        "count": int(row.get("total") or 0),
                    }
                    for row in (data.get("channel") or [])
                ],
                "category": [
                    {
                        "name": row.get("name"),
                        "count": int(row.get("total") or 0),
                    }
                    for row in (data.get("category") or [])
                ],
                "product": product,
                "customer": data.get("customer") or [],
            }

        except Exception as e:
            logger.error(f"ERROR OMNIX MASTER ALL: {e}", exc_info=True)
            return {
                "summary": {
                    "total_ticket": 0,
                    "aht": "0m 0s",
                    "art": "0m 0s",
                    "awt": "0m 0s",
                },
                "daily": [],
                "hourly": [],
                "by_day": [],
                "channel": [],
                "category": [],
                "product": [],
                "customer": [],
            }

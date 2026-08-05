import logging
from datetime import datetime
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
    if sec is None:
        return "0m 0s"
    if isinstance(sec, str) and ("m" in sec or "s" in sec or "h" in sec):
        return sec
    try:
        val = int(float(sec or 0))
        if val <= 0:
            return "0m 0s"
        hours, remainder = divmod(val, 3600)
        minutes, seconds = divmod(remainder, 60)
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        return f"{minutes}m {seconds}s"
    except Exception:
        return "0m 0s"


def _calculate_duration_fallback(start: str, end: str):
    """Calculates AHT, ART, AWT from timestamp differences if explicitly stored sec columns are 0 or null."""
    try:
        res = (
            supabase.table("omnix_cases")
            .select("handling_time_sec, response_time_sec, waiting_time_sec, interaction_at, date_end_interaction, date_first_response_interaction")
            .gte("interaction_at", start)
            .lt("interaction_at", end)
            .is_("deleted_at", "null")
            .limit(2000)
            .execute()
        )
        rows = res.data or []
        if not rows:
            return 0.0, 0.0, 0.0

        aht_list, art_list, awt_list = [], [], []

        for r in rows:
            # AHT
            aht = float(r.get("handling_time_sec") or 0)
            if not aht and r.get("date_end_interaction") and r.get("interaction_at"):
                try:
                    t_end = datetime.fromisoformat(r["date_end_interaction"])
                    t_start = datetime.fromisoformat(r["interaction_at"])
                    aht = max(0.0, (t_end - t_start).total_seconds())
                except Exception:
                    pass
            if aht > 0:
                aht_list.append(aht)

            # ART
            art = float(r.get("response_time_sec") or 0)
            if not art and r.get("date_first_response_interaction") and r.get("interaction_at"):
                try:
                    t_res = datetime.fromisoformat(r["date_first_response_interaction"])
                    t_start = datetime.fromisoformat(r["interaction_at"])
                    art = max(0.0, (t_res - t_start).total_seconds())
                except Exception:
                    pass
            if art > 0:
                art_list.append(art)

            # AWT
            awt = float(r.get("waiting_time_sec") or 0)
            if not awt and r.get("date_first_response_interaction") and r.get("interaction_at"):
                try:
                    t_res = datetime.fromisoformat(r["date_first_response_interaction"])
                    t_start = datetime.fromisoformat(r["interaction_at"])
                    awt = max(0.0, (t_res - t_start).total_seconds())
                except Exception:
                    pass
            if awt > 0:
                awt_list.append(awt)

        avg_aht = sum(aht_list) / len(aht_list) if aht_list else 0.0
        avg_art = sum(art_list) / len(art_list) if art_list else 0.0
        avg_awt = sum(awt_list) / len(awt_list) if awt_list else 0.0

        return avg_aht, avg_art, avg_awt

    except Exception as e:
        logger.error(f"ERROR CALCULATING DURATION FALLBACK: {e}", exc_info=True)
        return 0.0, 0.0, 0.0


def _is_unknown_only(rows):
    return len(rows) == 1 and str(rows[0].get("name") or "").lower() == "unknown"


def _get_brand_fallback(start, end):
    counts = {}
    total = 0
    page_size = 1000
    offset = 0
    max_pages = 10
    page_count = 0

    while page_count < max_pages:
        try:
            res = (
                supabase
                .table("omnix_cases")
                .select("category")
                .gte("interaction_at", start)
                .lt("interaction_at", end)
                .is_("deleted_at", "null")
                .range(offset, offset + page_size - 1)
                .execute()
            )
            rows = res.data or []
            if not rows:
                break

            for row in rows:
                name = str(row.get("category") or "").strip()
                if name and name.lower() != "unknown":
                    counts[name] = counts.get(name, 0) + 1
                    total += 1

            if len(rows) < page_size:
                break
            offset += page_size
            page_count += 1
        except Exception as e:
            logger.error(f"ERROR BRAND FALLBACK QUERY: {e}", exc_info=True)
            break

    if not total or not counts:
        return []

    return [
        {
            "name": name,
            "count": count,
            "pct": round((count / total) * 100, 2),
        }
        for name, count in sorted(counts.items(), key=lambda item: item[1], reverse=True)[:10]
    ]


# =========================
# SUMMARY KPI (RPC)
# =========================
def get_dashboard_summary(mode: str, period: str, year: int):
    start, end = get_date_range(mode, period, year)

    try:
        res = supabase.rpc(
            "kpi_dashboard_summary",
            {"start_date": start, "end_date": end}
        ).execute()

        data = res.data[0] if res.data else {}

        aht_raw = data.get("avg_aht") if data.get("avg_aht") is not None else data.get("aht")
        art_raw = data.get("avg_art") if data.get("avg_art") is not None else data.get("art")
        awt_raw = data.get("avg_awt") if data.get("avg_awt") is not None else data.get("awt")
        csat_raw = data.get("csat") if data.get("csat") is not None else data.get("avg_csat")

        aht_val = float(aht_raw or 0)
        art_val = float(art_raw or 0)
        awt_val = float(awt_raw or 0)

        if (not aht_val or not art_val or not awt_val) and int(data.get("total_ticket") or 0) > 0:
            fb_aht, fb_art, fb_awt = _calculate_duration_fallback(start, end)
            if not aht_val and fb_aht > 0:
                aht_raw = fb_aht
            if not art_val and fb_art > 0:
                art_raw = fb_art
            if not awt_val and fb_awt > 0:
                awt_raw = fb_awt

        return {
            "total_ticket": f"{int(data.get('total_ticket') or data.get('total') or 0):,}",
            "aht": _fmt_duration(aht_raw),
            "art": _fmt_duration(art_raw),
            "awt": _fmt_duration(awt_raw),
            "csat": str(csat_raw or 0)
        }

    except Exception as e:
        logger.error(f"ERROR SUMMARY SQL: {e}", exc_info=True)

        return {
            "total_ticket": "0",
            "aht": "0m 0s",
            "art": "0m 0s",
            "awt": "0m 0s",
            "csat": "0"
        }


# =========================
# DAILY TREND
# =========================
def get_dashboard_trend(mode, period, year):
    start, end = get_date_range(mode, period, year)

    try:
        fn_map = {
            "monthly": "kpi_dashboard_trend",
            "quarterly": "kpi_dashboard_trend_quarterly",
            "yearly": "kpi_dashboard_trend_yearly"
        }

        fn = fn_map.get(mode)

        if not fn:
            return []

        res = supabase.rpc(
            fn,
            {
                "start_date": start,
                "end_date": end
            }
        ).execute()

        return res.data or []

    except Exception as e:
        logger.error(f"ERROR TREND SQL ({mode}): {e}", exc_info=True)
        return []


# =========================
# CHANNEL
# =========================
def get_dashboard_by_channel(mode, period, year):
    start, end = get_date_range(mode, period, year)

    try:
        res = supabase.rpc(
            "kpi_channel",
            {"start_date": start, "end_date": end}
        ).execute()

        return [
            {
                "name": r.get("name"),
                "count": int(r.get("total") or 0)
            }
            for r in (res.data or [])
        ]

    except Exception as e:
        logger.error(f"ERROR CHANNEL SQL: {e}", exc_info=True)
        return []


# =========================
# CATEGORY
# =========================
def get_dashboard_by_category(mode, period, year):
    start, end = get_date_range(mode, period, year)

    try:
        res = supabase.rpc(
            "kpi_category",
            {"start_date": start, "end_date": end}
        ).execute()

        return [
            {
                "name": r.get("name"),
                "count": int(r.get("total") or 0)
            }
            for r in (res.data or [])
        ]

    except Exception as e:
        logger.error(f"ERROR CATEGORY SQL: {e}", exc_info=True)
        return []


# =========================
# BRAND
# =========================
def get_dashboard_by_brand(mode, period, year):
    start, end = get_date_range(mode, period, year)

    try:
        res = supabase.rpc(
            "kpi_brand",
            {"start_date": start, "end_date": end}
        ).execute()

        return [
            {
                "name": r.get("name"),
                "count": int(r.get("total") or 0),
                "pct": float(r.get("pct") or 0)
            }
            for r in (res.data or [])
        ]

    except Exception as e:
        logger.error(f"ERROR BRAND SQL: {e}", exc_info=True)
        return []


# =========================
# CUSTOMER SUMMARY
# =========================
def get_dashboard_customer_summary(mode, period, year):
    start, end = get_date_range(mode, period, year)

    try:
        res = supabase.rpc(
            "kpi_omnix_customers",
            {
                "start_date": start,
                "end_date": end
            }
        ).execute()

        rows = res.data or []

        total_customer = sum(int(r.get("total") or 0) for r in rows)
        total_new_customer = sum(int(r.get("new") or 0) for r in rows)

        return {
            "customer": {
                "total": total_customer
            },
            "new_customer": {
                "total": total_new_customer
            }
        }

    except Exception as e:
        logger.error(f"ERROR CUSTOMER SUMMARY SQL: {e}", exc_info=True)

        return {
            "customer": {
                "total": 0
            },
            "new_customer": {
                "total": 0
            }
        }


def get_dashboard_customer(mode, period, year):
    return get_dashboard_all(mode, period, year).get("customer", {"total": 0})


def get_dashboard_new_customer(mode, period, year):
    return get_dashboard_all(mode, period, year).get("new_customer", {"total": 0})


# =========================
# MASTER ENDPOINT
# =========================
def get_dashboard_all(mode, period, year):
    start, end = get_date_range(mode, period, year)

    try:
        res = supabase.rpc(
            "get_dashboard_home",
            {
                "p_start": start,
                "p_end": end,
                "p_mode": mode,
                "p_year": year,
            }
        ).execute()

        data = _rpc_json(res.data)
        summary = data.get("summary") or {}
        raw_brand = data.get("brand") or []
        brand = [
            {
                "name": row.get("name"),
                "count": int(row.get("total") or 0),
                "pct": float(row.get("pct") or 0),
            }
            for row in raw_brand
            if str(row.get("name") or "").strip() and str(row.get("name") or "").strip().lower() != "unknown"
        ]
        if not brand:
            brand = _get_brand_fallback(start, end)

        aht_raw = summary.get("avg_aht") if summary.get("avg_aht") is not None else summary.get("aht")
        art_raw = summary.get("avg_art") if summary.get("avg_art") is not None else summary.get("art")
        awt_raw = summary.get("avg_awt") if summary.get("avg_awt") is not None else summary.get("awt")
        csat_raw = summary.get("csat") if summary.get("csat") is not None else summary.get("avg_csat")

        aht_val = float(aht_raw or 0)
        art_val = float(art_raw or 0)
        awt_val = float(awt_raw or 0)

        if (not aht_val or not art_val or not awt_val) and int(summary.get("total_ticket") or 0) > 0:
            fb_aht, fb_art, fb_awt = _calculate_duration_fallback(start, end)
            if not aht_val and fb_aht > 0:
                aht_raw = fb_aht
            if not art_val and fb_art > 0:
                art_raw = fb_art
            if not awt_val and fb_awt > 0:
                awt_raw = fb_awt

        return {
            "summary": {
                "total_ticket": f"{int(summary.get('total_ticket') or summary.get('total') or 0):,}",
                "aht": _fmt_duration(aht_raw),
                "art": _fmt_duration(art_raw),
                "awt": _fmt_duration(awt_raw),
                "csat": str(csat_raw or 0),
            },
            "trend": [
                {
                    "day": str(row.get("label") or ""),
                    "count": int(row.get("total") or 0),
                }
                for row in (data.get("trend") or [])
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
            "brand": brand,
            "customer": data.get("customer") or {"total": 0},
            "new_customer": data.get("new_customer") or {"total": 0},
        }

    except Exception as e:
        logger.error(f"ERROR DASHBOARD ALL: {e}", exc_info=True)
        return {
            "summary": {
                "total_ticket": "0",
                "aht": "0m 0s",
                "art": "0m 0s",
                "awt": "0m 0s",
                "csat": "0",
            },
            "trend": [],
            "channel": [],
            "category": [],
            "brand": [],
            "customer": {"total": 0},
            "new_customer": {"total": 0},
        }


# =========================
# YEARS
# =========================
def get_dashboard_years():
    try:
        res = supabase.rpc("kpi_years").execute()
        return res.data if res.data else [2026]

    except Exception as e:
        logger.error(f"ERROR YEARS SQL: {e}", exc_info=True)
        return [2026]

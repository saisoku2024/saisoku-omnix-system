from app.core.supabase import supabase
from app.utils.date_filter import get_date_range


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


def _infer_brand(row):
    known_brands = ["Tineco", "Ecovacs", "Yoniev", "Laifen", "Usmile"]
    haystack = " ".join(
        str(row.get(key) or "")
        for key in ["brand", "category", "subcategory", "detail_subcategory", "subject"]
    ).lower()

    for brand in known_brands:
        if brand.lower() in haystack:
            return brand

    for key in ["brand", "category"]:
        value = str(row.get(key) or "").strip()
        if value:
            return value

    return "Unknown"


def _get_brand_fallback(start, end):
    counts = {}
    total = 0
    page_size = 1000
    offset = 0

    while True:
        res = (
            supabase
            .table("omnix_cases")
            .select("brand,category,subcategory,detail_subcategory,subject")
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
            name = _infer_brand(row)
            counts[name] = counts.get(name, 0) + 1
            total += 1

        if len(rows) < page_size:
            break
        offset += page_size

    if not total:
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

        aht = int(float(data.get("avg_aht") or 0))
        art = int(float(data.get("avg_art") or 0))
        awt = int(float(data.get("avg_awt") or 0))

        m_aht, s_aht = divmod(aht, 60)
        m_art, s_art = divmod(art, 60)
        m_awt, s_awt = divmod(awt, 60)

        return {
            "total_ticket": f"{int(data.get('total_ticket') or 0):,}",
            "aht": f"{m_aht}m {s_aht}s",
            "art": f"{m_art}m {s_art}s",
            "awt": f"{m_awt}m {s_awt}s",
            "csat": str(data.get("csat") or 0)
        }

    except Exception as e:
        print(f"ERROR SUMMARY SQL: {e}")

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
        print(f"ERROR TREND SQL ({mode}): {e}")
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
        print(f"ERROR CHANNEL SQL: {e}")
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
        print(f"ERROR CATEGORY SQL: {e}")
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
        print(f"ERROR BRAND SQL: {e}")
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
        print(f"ERROR CUSTOMER SUMMARY SQL: {e}")

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
        brand = [
            {
                "name": row.get("name"),
                "count": int(row.get("total") or 0),
                "pct": float(row.get("pct") or 0),
            }
            for row in (data.get("brand") or [])
        ]
        if not brand or _is_unknown_only(brand):
            brand = _get_brand_fallback(start, end)

        return {
            "summary": {
                "total_ticket": f"{int(summary.get('total_ticket') or 0):,}",
                "aht": _fmt_duration(summary.get("avg_aht")),
                "art": _fmt_duration(summary.get("avg_art")),
                "awt": _fmt_duration(summary.get("avg_awt")),
                "csat": str(summary.get("csat") or 0),
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
        print(f"ERROR DASHBOARD ALL: {e}")
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
        print(f"ERROR YEARS SQL: {e}")
        return [2026]

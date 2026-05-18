from app.core.supabase import supabase
from app.utils.date_filter import get_date_range
from datetime import timedelta   # 🔥 FIX tambahan (biar trend nggak error)


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
        awt = int(float(data.get("avg_awt") or 0))   # 🔥 TAMBAHAN

        m_aht, s_aht = divmod(aht, 60)
        m_art, s_art = divmod(art, 60)
        m_awt, s_awt = divmod(awt, 60)   # 🔥 TAMBAHAN

        return {
            "total_ticket": f"{int(data.get('total_ticket') or 0):,}",
            "aht": f"{m_aht}m {s_aht}s",
            "art": f"{m_art}m {s_art}s",
            "awt": f"{m_awt}m {s_awt}s",   # 🔥 FIX
            "csat": str(data.get("csat") or 0)
        }

    except Exception as e:
        print(f"ERROR SUMMARY SQL: {e}")
        return {
            "total_ticket": "0",
            "aht": "0m 0s",
            "art": "0m 0s",
            "awt": "0m 0s",   # 🔥 biar konsisten
            "csat": "0"
        }


# =========================
# DAILY TREND 🔥 FINAL (CLEAN & SAFE)
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
            print(f"[TREND] invalid mode: {mode}")
            return []

        res = supabase.rpc(fn, {
            "start_date": start,
            "end_date": end
        }).execute()

        data = res.data or []

        print(f"[TREND {mode.upper()}] rows:", len(data))

        return data

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
            {"name": r.get("name"), "count": int(r.get("total") or 0)}
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
            {"name": r.get("name"), "count": int(r.get("total") or 0)}
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
# TOTAL CUSTOMER
# =========================
def get_dashboard_customer(mode, period, year):
    start, end = get_date_range(mode, period, year)

    try:
        res = supabase.rpc(
            "kpi_customer",
            {"start_date": start, "end_date": end}
        ).execute()

        return {"total": int(res.data[0]["total"]) if res.data else 0}

    except Exception as e:
        print(f"ERROR CUSTOMER SQL: {e}")
        return {"total": 0}


# =========================
# NEW CUSTOMER
# =========================
def get_dashboard_new_customer(mode, period, year):
    start, end = get_date_range(mode, period, year)

    try:
        res = supabase.rpc(
            "kpi_new_customer",
            {"start_date": start, "end_date": end}
        ).execute()

        return {"total": int(res.data[0]["total"]) if res.data else 0}

    except Exception as e:
        print(f"ERROR NEW CUSTOMER SQL: {e}")
        return {"total": 0}


# =========================
# MASTER ENDPOINT 🔥
# =========================
def get_dashboard_all(mode, period, year):
    try:
        return {
            "summary": get_dashboard_summary(mode, period, year),
            "trend": get_dashboard_trend(mode, period, year),
            "channel": get_dashboard_by_channel(mode, period, year),
            "category": get_dashboard_by_category(mode, period, year),
            "brand": get_dashboard_by_brand(mode, period, year),
            "customer": get_dashboard_customer(mode, period, year),
            "new_customer": get_dashboard_new_customer(mode, period, year),
        }
    except Exception as e:
        print(f"ERROR DASHBOARD ALL: {e}")
        return {}


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
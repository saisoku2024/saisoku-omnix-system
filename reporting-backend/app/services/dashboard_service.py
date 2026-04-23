from app.core.supabase import supabase
from app.utils.date_filter import get_date_range


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

        aht = int(data.get("avg_aht") or 0)
        art = int(data.get("avg_art") or 0)

        m_aht, s_aht = divmod(aht, 60)
        m_art, s_art = divmod(art, 60)

        return {
            "total_ticket": f"{int(data.get('total_ticket') or 0):,}",
            "aht": f"{m_aht}m {s_aht}s",
            "art": f"{m_art}m {s_art}s",
            "awt": "-",  # optional kalau mau ditambah nanti
            "csat": str(data.get("csat") or 0)
        }

    except Exception as e:
        print(f"ERROR SUMMARY SQL: {e}")
        return {
            "total_ticket": "0",
            "aht": "0m 0s",
            "art": "0m 0s",
            "awt": "-",
            "csat": "0"
        }


# =========================
# DAILY TREND
# =========================
def get_dashboard_trend(mode, period, year):
    start, end = get_date_range(mode, period, year)

    try:
        start = start.strftime("%Y-%m-%d")
        end = end.strftime("%Y-%m-%d")

        res = supabase.rpc(
            "kpi_daily_trend",
            {"start_date": start, "end_date": end}
        ).execute()

        return [
            {
                "date": str(r["date"]),
                "count": r["total"]
            }
            for r in (res.data or [])
        ]

    except Exception as e:
        print(f"ERROR TREND SQL: {e}")
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
            {"name": r["name"], "count": r["total"]}
            for r in (res.data or [])
        ]

    except Exception as e:
        print(f"ERROR CHANNEL SQL: {e}")
        return []


# =========================
# CATEGORY (TOP 5)
# =========================
def get_dashboard_by_category(mode, period, year):
    start, end = get_date_range(mode, period, year)

    try:
        res = supabase.rpc(
            "kpi_category",
            {"start_date": start, "end_date": end}
        ).execute()

        return [
            {"name": r["name"], "count": r["total"]}
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
                "name": r["name"],
                "count": r["total"],
                "pct": float(r["pct"] or 0)
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

        return {"total": res.data[0]["total"] if res.data else 0}

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

        return {"total": res.data[0]["total"] if res.data else 0}

    except Exception as e:
        print(f"ERROR NEW CUSTOMER SQL: {e}")
        return {"total": 0}


# =========================
# AVAILABLE YEARS
# =========================
def get_dashboard_years():
    try:
        res = supabase.rpc("kpi_years").execute()
        return res.data if res.data else [2026]

    except Exception as e:
        print(f"ERROR YEARS SQL: {e}")
        return [2026]
from app.core.supabase import supabase


def get_principal_report(start_date, end_date):
    result = supabase.rpc(
        "get_principal_report",
        {
            "p_start_date": start_date,
            "p_end_date": end_date
        }
    ).execute()

    return result.data or []


def get_principal_summary(start_date, end_date):
    result = supabase.rpc(
        "get_principal_summary",
        {
            "p_start_date": start_date,
            "p_end_date": end_date
        }
    ).execute()

    if result.data and len(result.data) > 0:
        return result.data[0]

    return {"total_ticket": 0, "csat_response": 0}
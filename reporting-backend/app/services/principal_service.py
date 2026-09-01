from app.core.supabase import supabase


def _is_active_case(row):
    deleted_at = row.get("deleted_at")
    return deleted_at is None or deleted_at == "" or str(deleted_at).lower() == "null"


def _principal_case_query(start_date, end_date):
    return (
        supabase.table("omnix_cases")
        .select("*")
        .gte("interaction_at", start_date)
        .lt("interaction_at", end_date)
        .is_("deleted_at", "null")
    )


def _fallback_principal_rows(start_date, end_date):
    try:
        rows = _principal_case_query(start_date, end_date).execute()
        return [row for row in (rows.data or []) if _is_active_case(row)]
    except Exception:
        return []


def _compute_principal_summary_from_rows(rows):
    active_rows = [row for row in rows if _is_active_case(row)]
    total_ticket = len(active_rows)
    csat_response = sum(
        1
        for row in active_rows
        if (row.get("csat_response_status") or "").strip().lower() in {"responded", "response sent", "done", "answered"}
        or (row.get("rating_csat") not in (None, "", "nan", "None"))
    )

    return {
        "total_ticket": total_ticket,
        "csat_response": csat_response,
        "response_rate": round((csat_response / total_ticket) * 100, 2) if total_ticket > 0 else 0,
    }


def get_principal_report(start_date, end_date):
    try:
        result = supabase.rpc(
            "get_principal_report",
            {
                "p_start_date": start_date,
                "p_end_date": end_date
            }
        ).execute()
        if result and result.data:
            return result.data
    except Exception:
        pass

    return _fallback_principal_rows(start_date, end_date)


def get_principal_summary(start_date, end_date):
    try:
        result = supabase.rpc(
            "get_principal_summary",
            {
                "p_start_date": start_date,
                "p_end_date": end_date
            }
        ).execute()

        if result and result.data and len(result.data) > 0:
            row = dict(result.data[0])
            if "csat_response" in row or "total_ticket" in row:
                return row
    except Exception:
        pass

    rows = _fallback_principal_rows(start_date, end_date)
    summary = _compute_principal_summary_from_rows(rows)
    return summary
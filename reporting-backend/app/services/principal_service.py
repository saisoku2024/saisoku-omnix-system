from app.core.supabase import supabase
from app.services.principal_mapper import enrich_principal_row


def _is_active_case(row):
    deleted_at = row.get("deleted_at")
    return deleted_at is None or deleted_at == "" or str(deleted_at).lower() == "null"


BATCH_SIZE = 1000
MAX_ROWS = 500000


def _principal_case_query(start_date, end_date, offset=0, limit=BATCH_SIZE):
    query = (
        supabase.table("omnix_cases")
        .select("*")
        .gte("interaction_at", start_date)
        .lt("interaction_at", end_date)
        .is_("deleted_at", "null")
    )
    if hasattr(query, "order"):
        query = query.order("interaction_at")
    if hasattr(query, "range"):
        query = query.range(offset, offset + limit - 1)
    return query


def _fallback_principal_rows(start_date, end_date):
    rows = []
    offset = 0

    while True:
        try:
            query = _principal_case_query(start_date, end_date, offset=offset, limit=BATCH_SIZE)
            res = query.execute()
            data = res.data or []
            active_chunk = [row for row in data if _is_active_case(row)]
            rows.extend(active_chunk)

            if len(data) < BATCH_SIZE or offset >= MAX_ROWS or not hasattr(query, "range"):
                break

            offset += BATCH_SIZE
        except Exception:
            break

    return rows


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
    """Fetch principal report with conversion to Principal Group & Principal Category.

    Prefers the dedicated `get_principal_report` RPC which contains the standard
    conversion logic. Falls back to canonical `omnix_cases` rows with in-memory
    category enrichment so raw database rows are never modified.
    """
    try:
        res = supabase.rpc(
            "get_principal_report",
            {"p_start_date": start_date, "p_end_date": end_date}
        ).execute()
        if res.data is not None and len(res.data) > 0:
            return [enrich_principal_row(row) for row in res.data]
    except Exception:
        pass

    rows = _fallback_principal_rows(start_date, end_date)
    return [enrich_principal_row(row) for row in rows]


def get_principal_summary(start_date, end_date):
    """Use the same active ticket universe as the principal report."""
    rows = get_principal_report(start_date, end_date)
    return _compute_principal_summary_from_rows(rows)
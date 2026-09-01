import re
import pandas as pd
from app.core.supabase import supabase
from app.services.principal_mapper import enrich_principal_row


def _is_active_case(row):
    deleted_at = row.get("deleted_at")
    return deleted_at is None or deleted_at == "" or str(deleted_at).lower() == "null"


def _clean_phone_digits(val):
    if not val:
        return ""
    digits = re.sub(r"\D", "", str(val))
    if digits.startswith("0"):
        digits = "62" + digits[1:]
    return digits


BATCH_SIZE = 1000
MAX_ROWS = 500000


def _fetch_csat_responses_map(start_date: str, end_date: str) -> dict:
    """Fetch CSAT responses from public.csat_responses and index by clean phone number."""
    try:
        end_dt = pd.to_datetime(end_date) + pd.Timedelta(days=2)
        end_date_buffered = end_dt.strftime("%Y-%m-%d")

        query = (
            supabase.table("csat_responses")
            .select("id,unique_id,rating_csat,created_at,feedback")
            .gte("created_at", start_date)
            .lt("created_at", end_date_buffered)
            .is_("deleted_at", "null")
        )
        res = query.execute()
        data = res.data or []
    except Exception:
        data = []

    csat_map = {}
    for c in data:
        phone = _clean_phone_digits(c.get("unique_id"))
        rating = c.get("rating_csat")
        if phone and rating not in (None, "", "null", "nan"):
            rating_clean = str(rating).strip().replace(".0", "")
            try:
                dt = pd.to_datetime(c.get("created_at"))
            except Exception:
                dt = None

            csat_map.setdefault(phone, []).append({
                "rating": rating_clean,
                "dt": dt,
                "feedback": c.get("feedback"),
            })

    return csat_map


def enrich_rows_with_csat(rows: list, start_date: str, end_date: str) -> list:
    """Enrich case rows with CSAT dispatch status, response status, and score."""
    if not rows:
        return []

    csat_map = _fetch_csat_responses_map(start_date, end_date)

    for row in rows:
        phone = _clean_phone_digits(row.get("customer_hp"))
        channel = str(row.get("source_name") or row.get("channel") or "").strip().lower()

        # CSAT Dispatch Status: WhatsApp interactions automatically trigger survey
        current_dispatch = str(row.get("csat_dispatch_status") or "").strip().upper()
        if not current_dispatch or current_dispatch in {"NONE", "NULL"}:
            row["csat_dispatch_status"] = "Y" if "whatsapp" in channel or "wa" in channel else "N"

        # Check if CSAT rating already exists
        current_score = row.get("rating_csat")
        if not current_score or str(current_score).strip() in {"", "None", "null", "nan"}:
            if phone and phone in csat_map:
                candidates = csat_map[phone]
                row_time = row.get("date_end_interaction") or row.get("interaction_at")
                try:
                    r_dt = pd.to_datetime(row_time) if row_time else None
                except Exception:
                    r_dt = None

                if r_dt and len(candidates) > 1:
                    valid_candidates = [c for c in candidates if c["dt"] is not None]
                    if valid_candidates:
                        best = min(valid_candidates, key=lambda x: abs((x["dt"] - r_dt).total_seconds()))
                    else:
                        best = candidates[0]
                else:
                    best = candidates[0]

                row["csat_response_status"] = "Y"
                row["rating_csat"] = best["rating"]
                if not row.get("feedback") and best.get("feedback"):
                    row["feedback"] = best["feedback"]
            else:
                row["csat_response_status"] = "N"
                row["rating_csat"] = ""
        else:
            row["csat_response_status"] = "Y"
            row["rating_csat"] = str(current_score).strip().replace(".0", "")

    return rows


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
        if (row.get("csat_response_status") or "").strip().lower() in {"y", "yes", "responded", "response sent", "done", "answered"}
        or (row.get("rating_csat") not in (None, "", "nan", "None"))
    )

    scores = []
    for row in active_rows:
        val = row.get("rating_csat")
        if val not in (None, "", "nan", "None"):
            try:
                scores.append(float(str(val).strip()))
            except Exception:
                pass
    avg_csat = round(sum(scores) / len(scores), 2) if scores else 0.0

    return {
        "total_ticket": total_ticket,
        "csat_response": csat_response,
        "response_rate": round((csat_response / total_ticket) * 100, 2) if total_ticket > 0 else 0,
        "avg_csat": avg_csat,
    }


def get_principal_report(start_date, end_date):
    """Fetch principal report with conversion to Principal Group & Principal Category and CSAT enrichment.

    Prefers the dedicated `get_principal_report` RPC which contains the standard
    conversion logic. Falls back to canonical `omnix_cases` rows with in-memory
    category and CSAT enrichment so raw database rows are never modified.
    """
    try:
        res = supabase.rpc(
            "get_principal_report",
            {"p_start_date": start_date, "p_end_date": end_date}
        ).execute()
        if res.data is not None and len(res.data) > 0:
            enriched = [enrich_principal_row(row) for row in res.data]
            return enrich_rows_with_csat(enriched, start_date, end_date)
    except Exception:
        pass

    rows = _fallback_principal_rows(start_date, end_date)
    enriched = [enrich_principal_row(row) for row in rows]
    return enrich_rows_with_csat(enriched, start_date, end_date)


def get_principal_summary(start_date, end_date):
    """Use the same active ticket universe as the principal report."""
    rows = get_principal_report(start_date, end_date)
    return _compute_principal_summary_from_rows(rows)
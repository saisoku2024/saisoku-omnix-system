from app.utils.converters import safe_str, safe_datetime, duration_to_seconds
from app.utils.normalizers import normalize_phone


def parse_omnix_rows(df, upload_id):
    rows = []

    for _, row in df.iterrows():
        created_at = safe_datetime(row.get("date_origin_interaction"))

        rows.append({
            "upload_id": upload_id,
            "ticket_id": safe_str(row.get("ticketId_masking")),

            # 🔥 FIX UTAMA
            "interaction_at": created_at,
            "created_at": created_at,

            "customer_name": safe_str(row.get("customer_name")),
            "channel": safe_str(row.get("source_name")),
            "main_category": safe_str(row.get("mainCategory")),
            "category": safe_str(row.get("category")),
            "subcategory": safe_str(row.get("subCategory")),
            "detail_subcategory": safe_str(row.get("detailSubCategory")),
            "detail_subcategory2": safe_str(row.get("category_name")),
            "agent_name": safe_str(row.get("created_by_name")),
            "handling_time_sec": duration_to_seconds(row.get("handlingTime")),
            "response_time_sec": duration_to_seconds(row.get("responseTime")),
            "waiting_time_sec": duration_to_seconds(row.get("waitingTime")),
            "feedback": safe_str(row.get("feedback")),
        })

    return rows
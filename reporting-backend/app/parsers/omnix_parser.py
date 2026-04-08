from app.utils.converters import safe_str, safe_numeric, safe_datetime
from app.utils.normalizers import normalize_phone


def parse_omnix_rows(df, upload_id):
    rows = []

    for _, row in df.iterrows():
        rows.append({
            "upload_id": upload_id,
            "ticket_id": safe_str(row.get("Ticket ID")),
            "channel": safe_str(row.get("Channel")),
            "agent_name": safe_str(row.get("Agent Name")),
            "customer_name": safe_str(row.get("Customer Name")),
            "customer_phone": normalize_phone(row.get("Customer Phone")),
            "category": safe_str(row.get("Category")),
            "sub_category": safe_str(row.get("Sub Category")),
            "status": safe_str(row.get("Status")),
            "created_at": safe_datetime(row.get("Created At")),
            "resolved_at": safe_datetime(row.get("Resolved At")),
            "handling_time": safe_numeric(row.get("Handling Time")),
            "first_response_time": safe_numeric(row.get("First Response Time")),
        })

    return rows
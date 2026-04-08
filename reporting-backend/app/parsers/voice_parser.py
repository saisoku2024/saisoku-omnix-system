from app.utils.converters import safe_str, safe_datetime, duration_to_seconds
from app.utils.normalizers import normalize_phone


def parse_voice_rows(df, upload_id):
    rows = []

    for _, row in df.iterrows():
        rows.append({
            "upload_id": upload_id,
            "call_id": safe_str(row.get("Call ID")),
            "agent_name": safe_str(row.get("Agent Name")),
            "customer_phone": normalize_phone(row.get("Customer Phone")),
            "call_date": safe_datetime(row.get("Call Date")),
            "duration_seconds": duration_to_seconds(row.get("Duration")),
            "talk_time_seconds": duration_to_seconds(row.get("Talk Time")),
            "hold_time_seconds": duration_to_seconds(row.get("Hold Time")),
            "disposition": safe_str(row.get("Disposition")),
        })

    return rows
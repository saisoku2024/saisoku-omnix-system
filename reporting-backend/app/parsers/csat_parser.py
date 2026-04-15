from app.utils.converters import safe_str, safe_numeric, safe_datetime


def parse_csat_rows(df, upload_id):
    rows = []

    for _, row in df.iterrows():
        created_at = safe_datetime(row.get("Create At"))

        rows.append({
            "upload_id": upload_id,
            "source_id": safe_str(row.get("ID")),
            "sid": safe_str(row.get("Sid")),
            "unique_id": safe_str(row.get("Unique ID")),
            "channel": safe_str(row.get("Channel")),
            "account": safe_str(row.get("Account")),
            "response_type": safe_str(row.get("Type")),
            "score": safe_numeric(row.get("Score")),
            "message": safe_str(row.get("Message")),
            "additional_message": safe_str(row.get("Aditional Message")),
            "feedback": safe_str(row.get("Aditional Message → Feedback")),
            "flow_token": safe_str(row.get("Aditional Message → Flow Token")),
            "rating_csat": safe_str(row.get("Aditional Message → Rating Csat")),

            # 🔥 FIX UTAMA
            "created_at_source": created_at,
            "created_at": created_at,

            "updated_at_source": safe_datetime(row.get("Update At")),
        })

    return rows
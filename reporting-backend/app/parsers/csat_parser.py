from app.utils.converters import safe_str, safe_numeric, safe_datetime


def parse_csat_rows(df, upload_id):
    rows = []

    for _, row in df.iterrows():
        rows.append({
            "upload_id": upload_id,
            "ticket_id": safe_str(row.get("Ticket ID")),
            "agent_name": safe_str(row.get("Agent Name")),
            "customer_name": safe_str(row.get("Customer Name")),
            "rating": safe_numeric(row.get("Rating")),
            "feedback": safe_str(row.get("Feedback")),
            "survey_date": safe_datetime(row.get("Survey Date")),
        })

    return rows
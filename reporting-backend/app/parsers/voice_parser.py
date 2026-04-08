from app.utils.converters import safe_str, safe_datetime, duration_to_seconds
from app.utils.normalizers import normalize_phone


def parse_voice_rows(df, upload_id):
    rows = []

    for _, row in df.iterrows():
        rows.append({
            "upload_id": upload_id,
            "interaction_at": safe_datetime(row.get("datetime")),
            "connected_at": safe_datetime(row.get("datetimeconnect")),
            "ended_at": safe_datetime(row.get("datetimeend")),
            "queue_name": safe_str(row.get("queue")),
            "agent_name": safe_str(row.get("agent")),
            "call_event": safe_str(row.get("event")),
            "unique_id": safe_str(row.get("uniqueid")),
            "clid_raw": safe_str(row.get("clid")),
            "clid_normalized": normalize_phone(row.get("clid")),
            "wait_time_sec": duration_to_seconds(row.get("waittime")),
            "talk_time_sec": duration_to_seconds(row.get("talktime")),
            "ring_time_sec": duration_to_seconds(row.get("ringtime")),
            "hold_time_sec": duration_to_seconds(row.get("holdtime")),
            "dst": safe_str(row.get("dst")),
            "recording_file": safe_str(row.get("recordingfile")),
            "rec_ai": safe_str(row.get("rec_ai")),
            "channel": "voice",
            "call_status": safe_str(row.get("event")),
        })

    return rows
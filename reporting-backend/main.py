import os
from io import BytesIO
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.supabase_client import supabase
from dotenv import load_dotenv
from app.routes.dashboard import router as dashboard_router

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router, prefix="/api")

BUCKET = os.getenv("SUPABASE_BUCKET", "uploads")


def safe_str(value):
    if pd.isna(value):
        return None
    text = str(value).strip()
    return text if text else None


def safe_datetime(value):
    if pd.isna(value):
        return None

    dt = pd.to_datetime(value, errors="coerce")
    if pd.isna(dt):
        return None

    return dt.isoformat()


def safe_numeric(value):
    if pd.isna(value):
        return None
    try:
        return float(value)
    except Exception:
        return None


def duration_to_seconds(value):
    if pd.isna(value):
        return None

    if isinstance(value, (int, float)):
        return int(value)

    text = str(value).strip()
    if not text:
        return None

    try:
        parts = text.split(":")
        if len(parts) == 3:
            hours, minutes, seconds = parts
            return int(hours) * 3600 + int(minutes) * 60 + int(seconds)
        if len(parts) == 2:
            minutes, seconds = parts
            return int(minutes) * 60 + int(seconds)
        return int(float(text))
    except Exception:
        return None


def normalize_phone(value):
    raw = safe_str(value)
    if not raw:
        return None

    digits = "".join(ch for ch in raw if ch.isdigit())
    if not digits:
        return None

    if digits.startswith("0"):
        return "62" + digits[1:]

    if digits.startswith("62"):
        return digits

    return digits


def parse_omnix_rows(df: pd.DataFrame, upload_id: str):
    rows = []

    for _, row in df.iterrows():
        rows.append({
            "upload_id": upload_id,
            "ticket_id": safe_str(row.get("ticketId_masking")),
            "interaction_at": safe_datetime(row.get("date_origin_interaction")),
            "channel": safe_str(row.get("source_name")),
            "main_category": safe_str(row.get("mainCategory")),
            "category": safe_str(row.get("category")),
            "subcategory": safe_str(row.get("subCategory")),
            "detail_subcategory": safe_str(row.get("detailSubCategory")),
            "detail_subcategory2": safe_str(row.get("detailSubCategory2")),
            "agent_name": safe_str(row.get("created_by_name")),
        })

    return rows


def parse_voice_rows(df: pd.DataFrame, upload_id: str):
    rows = []

    for _, row in df.iterrows():
        rows.append({
            "upload_id": upload_id,
            "interaction_at": safe_datetime(row.get("datetime")),
            "connected_at": safe_datetime(row.get("datetimeconnect")),
            "ended_at": safe_datetime(row.get("datetimeend")),
            "agent_name": safe_str(row.get("agent")),
            "queue_name": safe_str(row.get("queue")),
            "clid_raw": safe_str(row.get("clid")),
            "clid_normalized": normalize_phone(row.get("clid")),
            "wait_time_sec": duration_to_seconds(row.get("waittime")),
            "talk_time_sec": duration_to_seconds(row.get("talktime")),
            "hold_time_sec": duration_to_seconds(row.get("holdtime")),
            "call_status": safe_str(row.get("event")),
            "call_event": safe_str(row.get("event")),
            "unique_id": safe_str(row.get("uniqueid")),
            "ring_time_sec": duration_to_seconds(row.get("ringtime")),
            "dst": safe_str(row.get("dst")),
            "recording_file": safe_str(row.get("recordingfile")),
            "rec_ai": safe_str(row.get("rec_ai")),
            "channel": "voice",
        })

    return rows


def parse_csat_rows(df: pd.DataFrame, upload_id: str):
    rows = []

    for _, row in df.iterrows():
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
            "created_at_source": safe_datetime(row.get("Create At")),
            "updated_at_source": safe_datetime(row.get("Update At")),
        })

    return rows


@app.get("/")
def root():
    return {"status": "backend ready"}


@app.post("/process/{upload_id}")
def process_upload(upload_id: str):
    upload_res = supabase.table("uploads").select("*").eq("id", upload_id).execute()

    if not upload_res.data:
        raise HTTPException(status_code=404, detail="Upload not found")

    upload = upload_res.data[0]

    supabase.table("uploads").update({
        "processing_status": "processing",
        "error_summary": None
    }).eq("id", upload_id).execute()

    try:
        file_bytes = supabase.storage.from_(BUCKET).download(upload["storage_path"])
        df = pd.read_excel(BytesIO(file_bytes))

        total_rows = len(df)
        rows = []
        target_table = None

        if upload["file_type"] == "omnix":
            rows = parse_omnix_rows(df, upload_id)
            target_table = "omnix_cases"

        elif upload["file_type"] == "voice":
            rows = parse_voice_rows(df, upload_id)
            target_table = "voice_interactions"

        elif upload["file_type"] == "csat":
            rows = parse_csat_rows(df, upload_id)
            target_table = "csat_responses"

        else:
            raise Exception(f'File type belum didukung: {upload["file_type"]}')

        if rows:
            supabase.table(target_table).insert(rows).execute()

        supabase.table("uploads").update({
            "processing_status": "success",
            "total_rows": total_rows,
            "valid_rows": len(rows),
            "invalid_rows": 0
        }).eq("id", upload_id).execute()

        return {
            "status": "processed",
            "file_name": upload["file_name"],
            "file_type": upload["file_type"],
            "total_rows": total_rows,
            "inserted_rows": len(rows),
            "target_table": target_table,
        }

    except Exception as e:
        supabase.table("uploads").update({
            "processing_status": "failed",
            "error_summary": str(e)
        }).eq("id", upload_id).execute()

        raise HTTPException(status_code=500, detail=str(e))
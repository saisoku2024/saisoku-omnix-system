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

# Security: Restricted Origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002", "http://127.0.0.1:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router, prefix="/api")

BUCKET = os.getenv("SUPABASE_BUCKET", "uploads")

# --- UTILS (KEPT AS IS PER RULE 1) ---
def safe_str(value):
    if pd.isna(value): return None
    return str(value).strip() or None

def safe_datetime(value):
    if pd.isna(value): return None
    dt = pd.to_datetime(value, errors="coerce")
    return None if pd.isna(dt) else dt.isoformat()

def safe_numeric(value):
    if pd.isna(value): return None
    try: return float(value)
    except: return None

def duration_to_seconds(value):
    if pd.isna(value): return None
    if isinstance(value, (int, float)): return int(value)
    text = str(value).strip()
    if not text: return None
    try:
        parts = text.split(":")
        if len(parts) == 3:
            h, m, s = parts
            return int(h) * 3600 + int(m) * 60 + int(s)
        if len(parts) == 2:
            m, s = parts
            return int(m) * 60 + int(s)
        return int(float(text))
    except: return None

def normalize_phone(value):
    raw = safe_str(value)
    if not raw: return None
    digits = "".join(ch for ch in raw if ch.isdigit())
    if not digits: return None
    if digits.startswith("0"): return "62" + digits[1:]
    return digits if digits.startswith("62") else digits

# --- PARSERS ---
def parse_rows(df, upload_id, file_type):
    rows = []
    for _, row in df.iterrows():
        if file_type == "omnix":
            rows.append({
                "upload_id": upload_id,
                "ticket_id": safe_str(row.get("ticketId_masking")),
                "interaction_at": safe_datetime(row.get("date_origin_interaction")),
                "channel": safe_str(row.get("source_name")),
                "main_category": safe_str(row.get("mainCategory")),
                "agent_name": safe_str(row.get("created_by_name")),
            })
        elif file_type == "voice":
            rows.append({
                "upload_id": upload_id,
                "interaction_at": safe_datetime(row.get("datetime")),
                "agent_name": safe_str(row.get("agent")),
                "clid_normalized": normalize_phone(row.get("clid")),
                "talk_time_sec": duration_to_seconds(row.get("talktime")),
                "call_status": safe_str(row.get("event")),
                "channel": "voice",
            })
        elif file_type == "csat":
            rows.append({
                "upload_id": upload_id,
                "score": safe_numeric(row.get("Score")),
                "rating_csat": safe_str(row.get("Aditional Message → Rating Csat")),
                "created_at_source": safe_datetime(row.get("Create At")),
            })
    return rows

@app.get("/")
def root():
    return {"status": "backend ready"}

@app.post("/process/{upload_id}")
async def process_upload(upload_id: str):
    # Rule 5: Check existing status to prevent double processing
    upload_res = supabase.table("uploads").select("*").eq("id", upload_id).single().execute()
    if not upload_res.data:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    if upload_res.data["processing_status"] == "processing":
        return {"status": "already_processing"}

    supabase.table("uploads").update({"processing_status": "processing"}).eq("id", upload_id).execute()

    try:
        file_bytes = supabase.storage.from_(BUCKET).download(upload_res.data["storage_path"])
        df = pd.read_excel(BytesIO(file_bytes))
        
        target_table = {
            "omnix": "omnix_cases",
            "voice": "voice_interactions",
            "csat": "csat_responses"
        }.get(upload_res.data["file_type"])

        if not target_table:
            raise Exception(f"Unsupported file type: {upload_res.data['file_type']}")

        rows = parse_rows(df, upload_id, upload_res.data["file_type"])
        
        # Rule 4: Batch Insert (Mencegah Payload Too Large / Timeout)
        batch_size = 500
        for i in range(0, len(rows), batch_size):
            supabase.table(target_table).insert(rows[i:i+batch_size]).execute()

        supabase.table("uploads").update({
            "processing_status": "success",
            "total_rows": len(df),
            "valid_rows": len(rows)
        }).eq("id", upload_id).execute()

        return {"status": "success", "rows_inserted": len(rows)}

    except Exception as e:
        supabase.table("uploads").update({
            "processing_status": "failed",
            "error_summary": str(e)
        }).eq("id", upload_id).execute()
        raise HTTPException(status_code=500, detail=str(e))
from fastapi import APIRouter, UploadFile, File, Form
from app.core.supabase import supabase
from app.parsers.voice_parser import parse_voice_rows
from app.parsers.omnix_parser import parse_omnix_rows
from app.parsers.csat_parser import parse_csat_rows
import pandas as pd
import uuid

router = APIRouter()


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form(...)
):
    try:
        upload_id = str(uuid.uuid4())

        # 🔥 READ FILE
        content = await file.read()
        df = pd.read_excel(content)

        # 🔥 INSERT LOG
        supabase.table("uploads").insert({
            "id": upload_id,
            "file_name": file.filename,
            "file_type": type,
            "storage_path": file.filename,
            "processing_status": "processing"
        }).execute()

        rows = []

        # =========================
        # 🔥 PROCESS BY TYPE
        # =========================

        if type == "voice":
            rows = parse_voice_rows(df, upload_id)
            supabase.table("voice_interactions").insert(rows).execute()

        elif type == "omnix":
            rows = parse_omnix_rows(df, upload_id)
            supabase.table("omnix_cases").insert(rows).execute()

        elif type == "csat":
            rows = parse_csat_rows(df, upload_id)
            supabase.table("csat_responses").insert(rows).execute()

        else:
            return {"error": "Invalid type"}

        # 🔥 UPDATE STATUS
        supabase.table("uploads").update({
            "processing_status": "success",
            "total_rows": len(rows)
        }).eq("id", upload_id).execute()

        return {
            "status": "ok",
            "upload_id": upload_id,
            "rows_inserted": len(rows)
        }

    except Exception as e:
        return {"error": str(e)}
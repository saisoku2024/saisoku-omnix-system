from fastapi import APIRouter, UploadFile, File, Form
from app.core.supabase import supabase
from app.parsers.voice_parser import parse_voice_rows
from app.parsers.omnix_parser import parse_omnix_rows
from app.parsers.csat_parser import parse_csat_rows
import pandas as pd
import uuid
import io

router = APIRouter(tags=["Upload"])

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form(...)
):
    try:
        upload_id = str(uuid.uuid4())
        content = await file.read()
        
        # Fix FutureWarning: wrap bytes with BytesIO
        df = pd.read_excel(io.BytesIO(content))
        
        # INSERT LOG (Dengan storage_path agar tidak Error)
        supabase.table("uploads").insert({
            "id": upload_id,
            "file_name": file.filename,
            "file_type": type,
            "storage_path": f"local_upload/{file.filename}", 
            "processing_status": "processing"
        }).execute()

        if type == "voice":
            rows = parse_voice_rows(df, upload_id)
            table_name = "voice_interactions"
        elif type == "omnix":
            rows = parse_omnix_rows(df, upload_id)
            table_name = "omnix_cases"
        elif type == "csat":
            rows = parse_csat_rows(df, upload_id)
            table_name = "csat_responses"
        else:
            return {"error": "Invalid type"}

        # BATCHING ENGINE
        batch_size = 100
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i + batch_size]
            supabase.table(table_name).insert(batch).execute()
            print(f"DEBUG: Sukses kirim batch {i//batch_size + 1}")

        # Final Update Status
        supabase.table("uploads").update({
            "processing_status": "success",
            "total_rows": len(rows)
        }).eq("id", upload_id).execute()

        return {"status": "ok", "rows_inserted": len(rows)}

    except Exception as e:
        print(f"UPLOAD ERROR: {str(e)}")
        return {"error": str(e)}
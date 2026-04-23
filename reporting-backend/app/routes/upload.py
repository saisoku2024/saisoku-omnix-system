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
    upload_id = str(uuid.uuid4())
    try:
        # 1. READ CONTENT
        content = await file.read()
        file_bytes = io.BytesIO(content)
        
        # 2. DETECT FORMAT (CSV vs EXCEL)
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(file_bytes)
        else:
            # Pastikan library 'openpyxl' sudah terinstall untuk .xlsx
            df = pd.read_excel(file_bytes)
        
        # 3. INITIAL LOG TO SUPABASE
        supabase.table("uploads").insert({
            "id": upload_id,
            "file_name": file.filename,
            "file_type": type,
            "storage_path": f"local_upload/{file.filename}", 
            "processing_status": "processing"
        }).execute()

        # 4. CHOOSE PARSER
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
            return {"error": f"Invalid type: {type}"}

        # 5. FILTER VALID ROWS (Mencegah baris kosong/null masuk database)
        valid_rows = [
            row for row in rows 
            if any(v not in [None, "", []] for k, v in row.items() if k != "upload_id")
        ]

        if not valid_rows:
            raise Exception("File kosong atau tidak ditemukan data yang valid.")

        # 6. BATCHING ENGINE (Kirim per 100 baris agar stabil)
        batch_size = 100
        for i in range(0, len(valid_rows), batch_size):
            batch = valid_rows[i:i + batch_size]
            supabase.table(table_name).insert(batch).execute()
            print(f"DEBUG: Sukses kirim batch {i//batch_size + 1} ke {table_name}")

        # 7. FINAL UPDATE STATUS
        supabase.table("uploads").update({
            "processing_status": "success",
            "total_rows": len(valid_rows)
        }).eq("id", upload_id).execute()

        return {
            "status": "ok", 
            "rows_inserted": len(valid_rows),
            "target_table": table_name
        }

    except Exception as e:
        error_msg = str(e)
        print(f"UPLOAD ERROR: {error_msg}")
        
        # Update status gagal jika upload_id sudah terbuat
        try:
            supabase.table("uploads").update({
                "processing_status": "failed",
                "error_summary": error_msg[:500]
            }).eq("id", upload_id).execute()
        except:
            pass
            
        return {"error": error_msg}
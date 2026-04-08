import io
import pandas as pd

from app.supabase_client import supabase
from app.parsers.omnix_parser import parse_omnix_rows
from app.parsers.voice_parser import parse_voice_rows
from app.parsers.csat_parser import parse_csat_rows


def process_upload(upload_id: str):
    # 1. Ambil metadata upload
    upload_res = supabase.table("uploads").select("*").eq("id", upload_id).single().execute()
    upload = upload_res.data

    if not upload:
        raise Exception("Upload not found")

    storage_path = upload.get("storage_path")
    file_type = upload.get("file_type")

    # 2. Update status jadi processing
    supabase.table("uploads").update({
        "processing_status": "processing"
    }).eq("id", upload_id).execute()

    # 3. Download file dari Supabase Storage
    file_bytes = supabase.storage.from_("uploads").download(storage_path)

    if not file_bytes:
        raise Exception("Failed to download file")

    # 4. Baca file
    if storage_path.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes))
    else:
        df = pd.read_excel(io.BytesIO(file_bytes))

    # 5. Tentukan parser berdasarkan file_type
    if file_type == "voice":
        rows = parse_voice_rows(df, upload_id)
        target_table = "voice_interactions"

    elif file_type == "omnix":
        rows = parse_omnix_rows(df, upload_id)
        target_table = "omnix_cases"

    elif file_type == "csat":
        rows = parse_csat_rows(df, upload_id)
        target_table = "csat_responses"

    else:
        raise Exception(f"Unknown file_type: {file_type}")

    # 6. Insert data
    if rows:
        supabase.table(target_table).insert(rows).execute()

    # 7. Update upload summary
    supabase.table("uploads").update({
        "processing_status": "processed",
        "total_rows": len(rows),
        "valid_rows": len(rows),
        "invalid_rows": 0
    }).eq("id", upload_id).execute()

    return {
        "success": True,
        "rows_inserted": len(rows),
        "target_table": target_table
    }
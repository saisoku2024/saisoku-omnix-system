import io
import pandas as pd

from app.supabase_client import supabase
from app.parsers.omnix_parser import parse_omnix_rows
from app.parsers.voice_parser import parse_voice_rows
from app.parsers.csat_parser import parse_csat_rows


def process_upload(upload_id: str):
    # 1) Ambil data upload dari tabel uploads
    upload_res = supabase.table("uploads").select("*").eq("id", upload_id).single().execute()
    upload = upload_res.data

    if not upload:
        raise Exception("Upload not found")

    file_path = upload.get("file_path")
    data_type = upload.get("data_type")

    # 2) Update status jadi processing
    supabase.table("uploads").update({
        "status": "processing"
    }).eq("id", upload_id).execute()

    # 3) Download file dari Supabase Storage
    file_bytes = supabase.storage.from_("uploads").download(file_path)

    if not file_bytes:
        raise Exception("Failed to download file")

    # 4) Baca file CSV / Excel
    if file_path.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes))
    else:
        df = pd.read_excel(io.BytesIO(file_bytes))

    # 5) Pilih parser berdasarkan data_type
    if data_type == "omnix":
        rows = parse_omnix_rows(df, upload_id)
        target_table = "omnix_data"

    elif data_type == "voice":
        rows = parse_voice_rows(df, upload_id)
        target_table = "voice_data"

    elif data_type == "csat":
        rows = parse_csat_rows(df, upload_id)
        target_table = "csat_data"

    else:
        raise Exception(f"Unknown data_type: {data_type}")

    # 6) Insert ke Supabase
    if rows:
        supabase.table(target_table).insert(rows).execute()

    # 7) Update status jadi processed
    supabase.table("uploads").update({
        "status": "processed",
        "row_count": len(rows)
    }).eq("id", upload_id).execute()

    return {
        "success": True,
        "rows_inserted": len(rows),
        "target_table": target_table
    }
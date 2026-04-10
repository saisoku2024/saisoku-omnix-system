import io
import pandas as pd

from app.core.supabase import supabase
from app.parsers.omnix_parser import parse_omnix_rows
from app.parsers.voice_parser import parse_voice_rows
from app.parsers.csat_parser import parse_csat_rows


def process_upload(upload_id: str):
    try:
        # 1. Ambil metadata upload
        upload_res = supabase.table("uploads").select("*").eq("id", upload_id).single().execute()
        upload = upload_res.data

        if not upload:
            raise Exception("Upload not found")

        storage_path = upload.get("storage_path")
        file_type = upload.get("file_type")
        processing_status = upload.get("processing_status")

        if not storage_path:
            raise Exception("storage_path is empty")

        if not file_type:
            raise Exception("file_type is empty")

        # 2. Guard: cegah process ulang kalau sudah processed
        if processing_status == "processed":
            return {
                "success": False,
                "message": "Upload already processed",
                "rows_inserted": 0,
                "target_table": None
            }

        # 3. Update status jadi processing
        supabase.table("uploads").update({
            "processing_status": "processing",
            "error_summary": None
        }).eq("id", upload_id).execute()

        # 4. Download file dari Supabase Storage
        file_bytes = supabase.storage.from_("uploads").download(storage_path)

        if not file_bytes:
            raise Exception("Failed to download file from storage")

        # 5. Baca file
        if storage_path.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        else:
            df = pd.read_excel(io.BytesIO(file_bytes))

        total_rows = len(df)

        if total_rows == 0:
            raise Exception("Uploaded file is empty")

        # 6. Tentukan parser + target table
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

        # 7. Filter row valid minimal (yang bukan None semua)
        valid_rows = []
        invalid_rows = 0

        for row in rows:
            # valid kalau minimal ada 1 field isi selain upload_id
            non_empty_values = [
                v for k, v in row.items()
                if k != "upload_id" and v not in [None, "", []]
            ]

            if len(non_empty_values) > 0:
                valid_rows.append(row)
            else:
                invalid_rows += 1

        # 8. Insert ke table target
        if valid_rows:
            supabase.table(target_table).insert(valid_rows).execute()

        # 9. Update status jadi processed
        supabase.table("uploads").update({
            "processing_status": "processed",
            "total_rows": total_rows,
            "valid_rows": len(valid_rows),
            "invalid_rows": invalid_rows,
            "error_summary": None
        }).eq("id", upload_id).execute()

        return {
            "success": True,
            "rows_inserted": len(valid_rows),
            "invalid_rows": invalid_rows,
            "target_table": target_table
        }

    except Exception as e:
        # Update status gagal
        try:
            supabase.table("uploads").update({
                "processing_status": "failed",
                "error_summary": str(e)[:500]
            }).eq("id", upload_id).execute()
        except Exception:
            pass

        raise
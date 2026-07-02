from fastapi import APIRouter, UploadFile, File, Form
from app.core.supabase import supabase
from app.parsers.omnix_parser import parse_omnix_rows
from app.parsers.voice_parser import parse_voice_rows
from app.parsers.csat_parser import parse_csat_rows
import pandas as pd
import uuid
import io
import json

router = APIRouter(tags=["Upload"])

def safe_str_raw(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    return s if s != "" else None

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
        
        # 2. DETECT FORMAT
        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(file_bytes)
        else:
            df = pd.read_excel(file_bytes)
        
        total_rows = len(df)
        if total_rows == 0:
            raise Exception("Uploaded file is empty")

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
            target_table = "voice_interactions"
        elif type == "omnix":
            rows = parse_omnix_rows(df, upload_id)
            target_table = "omnix_cases"
        elif type == "csat":
            rows = parse_csat_rows(df, upload_id)
            target_table = "csat_responses"
        else:
            raise Exception(f"Invalid type: {type}")

        # 5. VALIDATION
        invalid_rows = 0

        if type == "csat":
            valid_rows = []
            for row in rows:
                source_id = row.get("source_id")
                if source_id is None:
                    invalid_rows += 1
                    continue
                source_id = str(source_id).strip()
                if source_id.lower() in ["", "nan", "none", "null"]:
                    invalid_rows += 1
                    continue
                row["source_id"] = source_id
                valid_rows.append(row)

        elif type == "voice":
            valid_rows = []
            for row in rows:
                unique_id = row.get("unique_id")
                if unique_id is None:
                    invalid_rows += 1
                    continue
                unique_id = str(unique_id).strip()
                if unique_id.lower() in ["", "nan", "none", "null"]:
                    invalid_rows += 1
                    continue
                row["unique_id"] = unique_id
                valid_rows.append(row)

        else: # OMNIX
            valid_rows = []
            for row in rows:
                raw_ticket_id = row.get("ticket_id")
                if pd.isna(raw_ticket_id):
                    invalid_rows += 1
                    continue
                ticket_id = str(raw_ticket_id).strip()
                if not ticket_id or ticket_id.lower() in ["nan", "none", "null"]:
                    invalid_rows += 1
                    continue
                row["ticket_id"] = ticket_id
                valid_rows.append(row)

        # 6. INTERNAL DEDUPLICATION
        duplicate_rows = 0

        if type == "csat":
            seen_source_ids = set()
            deduped_rows = []
            for row in valid_rows:
                source_id = row["source_id"]
                if source_id in seen_source_ids:
                    duplicate_rows += 1
                    continue
                seen_source_ids.add(source_id)
                deduped_rows.append(row)

        elif type == "voice":
            seen_ids = set()
            deduped_rows = []
            for row in valid_rows:
                uid = row["unique_id"]
                if uid in seen_ids:
                    duplicate_rows += 1
                    continue
                seen_ids.add(uid)
                deduped_rows.append(row)

        else: # OMNIX
            seen_ticket_ids = set()
            deduped_rows = []
            for row in valid_rows:
                if row["ticket_id"] in seen_ticket_ids:
                    duplicate_rows += 1
                    continue
                seen_ticket_ids.add(row["ticket_id"])
                deduped_rows.append(row)

        # 7. DATABASE DEDUPLICATION
        inserted_candidates = []

        if target_table == "omnix_cases" and deduped_rows:
            existing_res = supabase.table("omnix_cases").select("ticket_id").in_("ticket_id", [r["ticket_id"] for r in deduped_rows]).execute()
            existing_ids = {r["ticket_id"] for r in existing_res.data}
            for row in deduped_rows:
                if row["ticket_id"] in existing_ids:
                    duplicate_rows += 1
                else:
                    inserted_candidates.append(row)

        elif target_table == "voice_interactions" and deduped_rows:
            existing_res = supabase.table("voice_interactions").select("unique_id").in_("unique_id", [r["unique_id"] for r in deduped_rows]).execute()
            existing_ids = {r["unique_id"] for r in existing_res.data}
            for row in deduped_rows:
                if row["unique_id"] in existing_ids:
                    duplicate_rows += 1
                else:
                    inserted_candidates.append(row)

        elif target_table == "csat_responses" and deduped_rows:
            existing_res = (
                supabase
                .table("csat_responses")
                .select("source_id")
                .in_(
                    "source_id",
                    [r["source_id"] for r in deduped_rows]
                )
                .execute()
            )

            # ================= DEBUG =================
            print("\n========== CSAT DEBUG ==========")
            print("SOURCE IDS FROM EXCEL:")
            print([r["source_id"] for r in deduped_rows][:10])

            print("\nFOUND IN DATABASE:")
            print(existing_res.data)

            print("================================\n")
            # =========================================

            existing_ids = {
                r["source_id"]
                for r in existing_res.data
            }

            for row in deduped_rows:
                if row["source_id"] in existing_ids:
                    duplicate_rows += 1
                else:
                    inserted_candidates.append(row)

        else:
            inserted_candidates = deduped_rows

        # 8. INSERT
        inserted_rows = 0
        if inserted_candidates:
            try:
                supabase.table(target_table).insert(inserted_candidates).execute()
                inserted_rows = len(inserted_candidates)
            except Exception as e:
                if "duplicate key value" in str(e):
                    duplicate_rows += len(inserted_candidates)
                    inserted_rows = 0
                else:
                    raise
                
        # 9. FINAL UPDATE STATUS
        supabase.table("uploads").update({
            "processing_status": "success",
            "total_rows": total_rows,
            "inserted_rows": inserted_rows,
            "duplicate_rows": duplicate_rows,
            "invalid_rows": invalid_rows
        }).eq("id", upload_id).execute()

        return {
            "success": True,
            "total_rows": total_rows,
            "inserted_rows": inserted_rows,
            "duplicate_rows": duplicate_rows,
            "invalid_rows": invalid_rows,
            "target_table": target_table
        }

    except Exception as e:
        print(f"UPLOAD ERROR: {str(e)}")
        try:
            supabase.table("uploads").update({
                "processing_status": "failed", 
                "error_summary": str(e)[:500]
            }).eq("id", upload_id).execute()
        except:
            pass
        return {"success": False, "error": str(e)}

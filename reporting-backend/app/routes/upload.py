from fastapi import APIRouter, UploadFile, File, Form
from app.core.supabase import supabase
from app.services.upload_service import UploadService
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
        config = UploadService.get_config(type)
        parser = config["parser"]
        target_table = config["table"]
        rows = parser(df, upload_id)

        # 5. VALIDATION
        unique_key = config["unique_key"]

        valid_rows, invalid_rows = UploadService.validate_rows(
            rows,
            unique_key
        )

        # 6. INTERNAL DEDUPLICATION
        deduped_rows, duplicate_rows = UploadService.internal_deduplicate(
            valid_rows,
            unique_key
        )

        # 7. DATABASE DEDUPLICATION
        inserted_candidates, duplicate_rows = (
            UploadService.database_deduplicate(
                target_table,
                deduped_rows,
                unique_key,
                duplicate_rows,
            )
        )
            
        # 8. INSERT
        inserted_rows = UploadService.bulk_insert(
            target_table,
            inserted_candidates
        )
                
        # 9. FINAL UPDATE STATUS
        UploadService.update_upload_status(
            upload_id,
            total_rows,
            inserted_rows,
            duplicate_rows,
            invalid_rows,
        )

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
            UploadService.update_upload_failed(
                upload_id,
                e,
            )
        except:
            pass
        return {"success": False, "error": str(e)}
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.core.security import require_admin_token
from app.core.supabase import supabase
from app.services.upload_service import UploadService
import pandas as pd
import uuid
import io

router = APIRouter(tags=["Upload"])

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form(...),
    _: None = Depends(require_admin_token),
):
    upload_id = str(uuid.uuid4())
    try:
        # 1. READ CONTENT & FILE SIZE GUARD
        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Ukuran berkas melebihi batas maksimum 50MB."
            )
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

        mapped_subjects_count = sum(1 for r in rows if r.get("mapping_status") in ["exact", "rule_matched"])
        needs_review_count = sum(1 for r in rows if r.get("mapping_status") == "needs_review")

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

        from app.services.audit_log_service import AuditLogService
        AuditLogService.log(
            action="UPLOAD_DATA",
            resource=target_table,
            details={
                "filename": file.filename,
                "file_type": file_type,
                "total_rows": total_rows,
                "inserted_rows": inserted_rows,
            },
        )

        return {
            "success": True,
            "total_rows": total_rows,
            "inserted_rows": inserted_rows,
            "duplicate_rows": duplicate_rows,
            "invalid_rows": invalid_rows,
            "mapped_subjects_count": mapped_subjects_count,
            "needs_review_count": needs_review_count,
            "target_table": target_table
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"UPLOAD ERROR: {str(e)}")
        try:
            UploadService.update_upload_failed(
                upload_id,
                e,
            )
        except:
            pass
        status_code = 400 if isinstance(e, ValueError) else 500
        raise HTTPException(status_code=status_code, detail=str(e))

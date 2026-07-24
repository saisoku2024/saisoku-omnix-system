import io
import logging
import uuid
import pandas as pd
from typing import Literal
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
from app.core.security import require_admin_token
from app.core.supabase import supabase
from app.services.upload_service import UploadService
from app.services.storage_upload_service import (
    download_storage_object,
    filename_from_path,
    validate_storage_upload,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Upload"])

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

UploadType = Literal["omnix", "voice", "csat"]


class StorageDataIngestRequest(BaseModel):
    bucket: str = Field(..., min_length=1, max_length=80)
    path: str = Field(..., min_length=1, max_length=500)
    filename: str | None = Field(default=None, max_length=180)
    content_type: str | None = Field(default=None, max_length=180)
    size: int = Field(..., gt=0)
    type: UploadType


def process_upload_content(
    content: bytes,
    filename: str,
    upload_type: str,
    storage_path: str,
):
    upload_id = str(uuid.uuid4())
    try:
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Ukuran berkas melebihi batas maksimum 50MB."
            )

        file_bytes = io.BytesIO(content)
        lower_filename = filename.lower()

        if lower_filename.endswith(".csv"):
            df = pd.read_csv(file_bytes)
        else:
            df = pd.read_excel(file_bytes)

        total_rows = len(df)
        if total_rows == 0:
            raise Exception("Uploaded file is empty")

        supabase.table("uploads").insert({
            "id": upload_id,
            "file_name": filename,
            "file_type": upload_type,
            "storage_path": storage_path,
            "processing_status": "processing"
        }).execute()

        config = UploadService.get_config(upload_type)
        parser = config["parser"]
        target_table = config["table"]
        rows = parser(df, upload_id)

        mapped_subjects_count = sum(1 for r in rows if r.get("mapping_status") in ["exact", "rule_matched"])
        needs_review_count = sum(1 for r in rows if r.get("mapping_status") == "needs_review")

        unique_key = config["unique_key"]
        valid_rows, invalid_rows = UploadService.validate_rows(rows, unique_key)
        deduped_rows, duplicate_rows = UploadService.internal_deduplicate(valid_rows, unique_key)
        inserted_candidates, duplicate_rows = UploadService.database_deduplicate(
            target_table,
            deduped_rows,
            unique_key,
            duplicate_rows,
        )
        inserted_rows = UploadService.bulk_insert(target_table, inserted_candidates)

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
                "filename": filename,
                "file_type": upload_type,
                "total_rows": total_rows,
                "inserted_rows": inserted_rows,
                "storage_path": storage_path,
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
        logger.error(f"UPLOAD ERROR: {str(e)}", exc_info=True)
        try:
            UploadService.update_upload_failed(upload_id, e)
        except Exception as fail_err:
            logger.warning(f"Failed to record upload failure state: {fail_err}")
        status_code = 400 if isinstance(e, ValueError) else 500
        raise HTTPException(status_code=status_code, detail=str(e))

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    type: UploadType = Form(...),
    _: None = Depends(require_admin_token),
):
    try:
        # 1. READ CONTENT & FILE SIZE GUARD
        content = await file.read()
        return process_upload_content(
            content,
            file.filename or "upload.xlsx",
            type,
            f"local_upload/{file.filename}",
        )
    except HTTPException as he:
        raise he


@router.post("/upload/storage-ingest")
def ingest_storage_upload(
    payload: StorageDataIngestRequest,
    _: None = Depends(require_admin_token),
):
    filename = payload.filename or filename_from_path(payload.path)
    validate_storage_upload("data", filename, payload.size)
    content = download_storage_object("data", payload.bucket, payload.path)
    return process_upload_content(
        content,
        filename,
        payload.type,
        f"{payload.bucket}/{payload.path}",
    )

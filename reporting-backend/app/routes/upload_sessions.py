from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.security import require_admin_token
from app.services.upload_session_service import UploadSessionService


router = APIRouter(
    prefix="/upload-sessions",
    tags=["Upload Sessions"],
    dependencies=[Depends(require_admin_token)],
)

UploadTypeFilter = Literal["all", "omnix", "voice", "csat"]
UploadStatusFilter = Literal["all", "processing", "success", "failed"]


class UploadSessionDeleteRequest(BaseModel):
    deleted_by: str = Field(default="admin", max_length=120)


@router.get("")
def list_upload_sessions(
    date_from: str = Query(pattern=r"^\d{4}-\d{2}-\d{2}$"),
    date_to: str = Query(pattern=r"^\d{4}-\d{2}-\d{2}$"),
    type: UploadTypeFilter = "all",
    status: UploadStatusFilter = "all",
):
    try:
        return UploadSessionService.list_sessions(
            date_from=date_from,
            date_to=date_to,
            upload_type=type,
            status=status,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload session list failed: {exc}") from exc


@router.post("/{upload_id}/delete-preview")
def preview_upload_session_delete(upload_id: str):
    try:
        return UploadSessionService.preview_delete(upload_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload session delete preview failed: {exc}") from exc


@router.post("/{upload_id}/delete")
def delete_upload_session(upload_id: str, payload: UploadSessionDeleteRequest):
    try:
        result = UploadSessionService.delete_session(
            upload_id=upload_id,
            deleted_by=payload.deleted_by,
        )
        from app.services.audit_log_service import AuditLogService

        AuditLogService.log(
            action="DELETE_UPLOAD_SESSION",
            resource=result["target_table"],
            details={
                "upload_id": upload_id,
                "file_name": result["file_name"],
                "file_type": result["file_type"],
                "delete_mode": result["delete_mode"],
                "deleted_rows": result["deleted_rows"],
                "deleted_by": payload.deleted_by,
            },
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload session delete failed: {exc}") from exc

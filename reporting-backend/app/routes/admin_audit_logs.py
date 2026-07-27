from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.security import require_admin_token
from app.services.audit_log_service import AuditLogService

router = APIRouter(
    prefix="/admin/audit-logs",
    tags=["Management System - Audit Logs"],
    dependencies=[Depends(require_admin_token)],
)

class AuditLogCreateRequest(BaseModel):
    action: str
    resource: str
    user_email: Optional[str] = "system@omnix.com"
    user_role: Optional[str] = "admin"
    details: Optional[Dict[str, Any]] = {}

@router.get("")
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = Query(None),
):
    try:
        data = AuditLogService.list_logs(limit=limit, action=action)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail="Gagal memuat audit logs")

@router.post("")
def create_audit_log(
    payload: AuditLogCreateRequest,
):
    try:
        success = AuditLogService.log(
            action=payload.action,
            resource=payload.resource,
            details=payload.details,
            user_email=payload.user_email or "system@omnix.com",
            user_role=payload.user_role or "admin",
        )
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Gagal menyimpan audit log")

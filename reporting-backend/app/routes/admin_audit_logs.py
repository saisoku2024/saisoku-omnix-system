import os
import secrets
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Header, Query, status
from app.services.audit_log_service import AuditLogService

router = APIRouter(
    prefix="/admin/audit-logs",
    tags=["Management System - Audit Logs"],
)

class AuditLogCreateRequest(BaseModel):
    action: str
    resource: str
    user_email: Optional[str] = "system@omnix.com"
    user_role: Optional[str] = "admin"
    details: Optional[Dict[str, Any]] = {}

def verify_admin_access(x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    """Verify admin token using constant-time comparison to prevent timing attacks."""
    admin_api_token = os.getenv("ADMIN_API_TOKEN")
    if not admin_api_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin API token is not configured",
        )
    if not x_admin_token or not secrets.compare_digest(x_admin_token, admin_api_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Diperlukan kredensial Super Admin.",
        )

@router.get("")
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = Query(None),
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
):
    verify_admin_access(x_admin_token)
    try:
        data = AuditLogService.list_logs(limit=limit, action=action)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail="Gagal memuat audit logs")

@router.post("")
def create_audit_log(
    payload: AuditLogCreateRequest,
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
):
    verify_admin_access(x_admin_token)
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

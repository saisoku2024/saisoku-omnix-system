import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Query, status
from app.services.audit_log_service import AuditLogService

ADMIN_API_TOKEN = os.getenv("ADMIN_API_TOKEN")

router = APIRouter(
    prefix="/admin/audit-logs",
    tags=["Management System - Audit Logs"],
)

def verify_admin_access(x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    if ADMIN_API_TOKEN and x_admin_token != ADMIN_API_TOKEN:
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
        raise HTTPException(status_code=500, detail=str(e))

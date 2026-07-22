import os
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header, status
from app.schemas.admin_user import (
    UserCreateRequest,
    UserUpdateRequest,
    UserProfileResponse,
    UserListResponse,
)
from app.services.admin_user_service import AdminUserService

from app.services.audit_log_service import AuditLogService

from app.dependencies import requires_permission, get_current_user
ADMIN_API_TOKEN = os.getenv("ADMIN_API_TOKEN")

router = APIRouter(
    prefix="/admin/users",
    tags=["Management System - User Control"],
)



@router.get("", response_model=UserListResponse, dependencies=[Depends(requires_permission("manage_users"))])
def get_user_list():
    try:
        data = AdminUserService.list_users()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=UserProfileResponse, dependencies=[Depends(requires_permission("manage_users"))])
def create_new_user(payload: UserCreateRequest):
    try:
        user = AdminUserService.create_user(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            role=payload.role,
            brand_access=payload.brand_access,
        )
        AuditLogService.log(
            action="USER_CREATED",
            resource="profiles",
            details={"created_user_email": payload.email, "role": payload.role, "full_name": payload.full_name},
            user_role="super_admin",
        )
        return user
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{user_id}", response_model=UserProfileResponse, dependencies=[Depends(requires_permission("manage_users"))])
def update_user_role_or_profile(user_id: str, payload: UserUpdateRequest):
    try:
        updated = AdminUserService.update_user_role(
            user_id=user_id,
            role=payload.role,
            full_name=payload.full_name,
            brand_access=payload.brand_access,
        )
        AuditLogService.log(
            action="USER_ROLE_UPDATED",
            resource="profiles",
            details={"target_user_id": user_id, "new_role": payload.role},
            user_role="super_admin",
        )
        return updated
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}", dependencies=[Depends(requires_permission("manage_users"))])
def delete_user_account(user_id: str):
    try:
        AdminUserService.delete_user(user_id)
        AuditLogService.log(
            action="USER_DELETED",
            resource="profiles",
            details={"deleted_user_id": user_id},
            user_role="super_admin",
        )
        return {"success": True, "message": f"User {user_id} berhasil dihapus."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

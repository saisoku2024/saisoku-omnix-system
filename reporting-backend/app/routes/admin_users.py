from fastapi import APIRouter, Depends, HTTPException
from app.schemas.admin_user import (
    UserCreateRequest,
    UserUpdateRequest,
    UserResetPasswordRequest,
    UserProfileResponse,
    UserListResponse,
)
from app.services.admin_user_service import AdminUserService

from app.services.audit_log_service import AuditLogService

from app.core.security import require_admin_token

router = APIRouter(

    prefix="/admin/users",
    tags=["Management System - User Control"],
)

@router.get("", response_model=UserListResponse, dependencies=[Depends(require_admin_token)])
def get_user_list():
    try:
        data = AdminUserService.list_users()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=UserProfileResponse, dependencies=[Depends(require_admin_token)])
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

@router.patch("/{user_id}", response_model=UserProfileResponse, dependencies=[Depends(require_admin_token)])
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

@router.post("/{user_id}/reset-password", dependencies=[Depends(require_admin_token)])
def reset_user_password_by_admin(user_id: str, payload: UserResetPasswordRequest):
    try:
        res = AdminUserService.reset_user_password(user_id, payload.new_password)
        AuditLogService.log(
            action="USER_PASSWORD_RESET",
            resource="auth",
            details={"target_user_id": user_id},
            user_role="super_admin",
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}", dependencies=[Depends(require_admin_token)])
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


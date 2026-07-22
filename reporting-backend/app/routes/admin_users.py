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

ADMIN_API_TOKEN = os.getenv("ADMIN_API_TOKEN")

router = APIRouter(
    prefix="/admin/users",
    tags=["Management System - User Control"],
)

def verify_admin_access(x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    """
    Memverifikasi token eksekutif Admin sebelum mengizinkan aksi User Management.
    """
    if ADMIN_API_TOKEN and x_admin_token != ADMIN_API_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Diperlukan kredensial Super Admin.",
        )

@router.get("", response_model=UserListResponse)
def get_user_list(x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")):
    verify_admin_access(x_admin_token)
    try:
        data = AdminUserService.list_users()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=UserProfileResponse)
def create_new_user(
    payload: UserCreateRequest,
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
):
    verify_admin_access(x_admin_token)
    try:
        user = AdminUserService.create_user(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            role=payload.role,
            brand_access=payload.brand_access,
        )
        return user
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{user_id}", response_model=UserProfileResponse)
def update_user_role_or_profile(
    user_id: str,
    payload: UserUpdateRequest,
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
):
    verify_admin_access(x_admin_token)
    try:
        updated = AdminUserService.update_user_role(
            user_id=user_id,
            role=payload.role,
            full_name=payload.full_name,
            brand_access=payload.brand_access,
        )
        return updated
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}")
def delete_user_account(
    user_id: str,
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token"),
):
    verify_admin_access(x_admin_token)
    try:
        AdminUserService.delete_user(user_id)
        return {"success": True, "message": f"User {user_id} berhasil dihapus."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

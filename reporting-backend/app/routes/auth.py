import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import jwt

from app.core.supabase import supabase

# --- Environment Variables (NO hardcoded defaults) ---
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 jam

# UUID for the seeded Super Admin profile (must match migration seed)
ADMIN_PROFILE_UUID = "00000000-0000-0000-0000-000000000001"

router = APIRouter(
    tags=["Authentication"]
)

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

@router.post("/auth/login", response_model=TokenResponse)
def login(request: LoginRequest):
    # Fail-fast: reject if credentials are not configured
    if not ADMIN_USERNAME or not ADMIN_PASSWORD or not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth environment variables (ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET_KEY) are not configured",
        )

    if request.username != ADMIN_USERNAME or request.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Resolve the admin's Supabase profile UUID for JWT sub claim
    profile_uuid = ADMIN_PROFILE_UUID
    try:
        resp = supabase.table("profiles").select("id").eq("email", "admin@omnix.com").limit(1).execute()
        if resp.data and len(resp.data) > 0:
            profile_uuid = resp.data[0]["id"]
    except Exception:
        pass  # Fallback to seeded UUID

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": profile_uuid,
            "username": request.username,
            "role": "super_admin",
        },
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

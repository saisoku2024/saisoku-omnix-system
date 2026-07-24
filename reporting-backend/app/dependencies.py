import os
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import Depends, Header, HTTPException, status
from app.core.supabase import supabase

# NOTE: JWT_SECRET_KEY dibaca per-call (bukan module-level) agar key rotation
# via env var langsung efektif tanpa perlu restart proses.
JWT_ALGORITHM = "HS256"

# UUID for the seeded Super Admin profile (must match migration seed)
ADMIN_PROFILE_UUID = "00000000-0000-0000-0000-000000000001"

def get_current_user(authorization: str | None = Header(default=None)):
    """Decode JWT token, fetch user profile from Supabase and attach role.
    The token is expected to be passed via the Authorization header as
    ``Bearer <jwt>``. If the token is missing or invalid, a 401 error is raised.
    """
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    # H-1 fix: baca JWT_SECRET_KEY per-call agar key rotation langsung efektif
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="JWT_SECRET_KEY is not configured",
        )

    # Strip possible "Bearer " prefix
    token = authorization
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    # Try to fetch the user profile from Supabase
    try:
        resp = supabase.table("profiles").select("*").eq("id", user_id).limit(1).execute()
        if resp.data and len(resp.data) > 0:
            return resp.data[0]
    except Exception:
        # H-2 fix: fallback ke "guest" (bukan "super_admin") jika profiles
        # table tidak bisa diakses, mencegah privilege escalation otomatis.
        pass

    # Fallback: construct profile from JWT claims if DB lookup fails
    # H-2: default role ke "guest", bukan "super_admin"
    role = payload.get("role", "guest")
    return {
        "id": user_id,
        "email": payload.get("username", "unknown@omnix.com"),
        "full_name": "Unknown User",
        "role": role,
        "brand_access": [],
    }

# Static permission map (can be replaced by DB-driven lookup later)
_ROLE_PERMISSIONS = {
    "super_admin": {"*"},
    "manager": {"view_dashboard", "view_monitoring", "export_reports", "view_rag_scorecard"},
    "spv": {"view_dashboard", "view_monitoring"},
    "agent": {"view_dashboard"},
    "guest": {"view_dashboard", "view_monitoring", "view_rag_scorecard"},
}

def has_permission(role: str, permission: str) -> bool:
    perms = _ROLE_PERMISSIONS.get(role, set())
    return "*" in perms or permission in perms

def requires_permission(permission: str):
    async def dependency(user = Depends(get_current_user)):
        if not has_permission(user.get("role"), permission):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return dependency

# Endpoint to expose current user's role & permission list (used by frontend)
from fastapi import APIRouter
router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/permissions")
def list_permissions(user = Depends(get_current_user)):
    role = user.get("role")
    perms = list(_ROLE_PERMISSIONS.get(role, set()))
    return {"role": role, "permissions": perms}

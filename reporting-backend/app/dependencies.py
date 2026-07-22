import os
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, status
from supabase import create_client

# Initialize Supabase client (environment variables must be set)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey123")
JWT_ALGORITHM = "HS256"

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def get_current_user(token: str = Depends(lambda: None)):
    """Decode JWT token, fetch user profile from Supabase and attach role.
    The token is expected to be passed via the Authorization header as
    ``Bearer <jwt>``. If the token is missing or invalid, a 401 error is raised.
    """
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    # Strip possible "Bearer " prefix
    if token.lower().startswith("bearer "):
        token = token[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    resp = supabase.from_("profiles").select("*, role").eq("id", user_id).single()
    if resp.get("error"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    profile = resp.get("data")
    return profile

# Static permission map (can be replaced by DB‑driven lookup later)
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
    return Depends(dependency)

# Endpoint to expose current user's role & permission list (used by frontend)
from fastapi import APIRouter
router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/permissions")
def list_permissions(user = Depends(get_current_user)):
    role = user.get("role")
    perms = list(_ROLE_PERMISSIONS.get(role, set()))
    return {"role": role, "permissions": perms}

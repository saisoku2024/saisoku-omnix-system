from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class UserCreateRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "guest"  # super_admin, manager, spv, agent, guest
    brand_access: Optional[List[str]] = ["ALL"]


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    brand_access: Optional[List[str]] = None


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    brand_access: List[str]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class UserListResponse(BaseModel):
    total: int
    users: List[UserProfileResponse]

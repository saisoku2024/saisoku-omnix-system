from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import require_admin_token
from app.services.storage_upload_service import create_signed_upload


router = APIRouter(
    prefix="/storage",
    tags=["Storage Upload"],
    dependencies=[Depends(require_admin_token)],
)


class SignedUploadRequest(BaseModel):
    kind: str = Field(..., pattern="^(knowledge|data)$")
    filename: str = Field(..., min_length=1, max_length=180)
    content_type: str | None = Field(default=None, max_length=180)
    size: int = Field(..., gt=0)


@router.post("/signed-upload")
def signed_upload(payload: SignedUploadRequest):
    return create_signed_upload(
        payload.kind,
        payload.filename,
        payload.content_type,
        payload.size,
    )


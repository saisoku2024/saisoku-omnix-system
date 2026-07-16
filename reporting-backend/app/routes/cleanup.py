from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.cleanup_service import CleanupService


router = APIRouter(prefix="/cleanup", tags=["Data Cleanup"])

CleanupRule = Literal["abandon_match", "test_omnix", "internal_email"]
CleanupTargetTable = Literal["voice_interactions", "omnix_cases"]


class CleanupPreviewRequest(BaseModel):
    date_from: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    date_to: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    rules: list[CleanupRule] = Field(default_factory=list)


class CleanupDeleteItem(BaseModel):
    target_table: CleanupTargetTable
    id: str | int
    reasons: list[CleanupRule] = Field(default_factory=list)


class CleanupSoftDeleteRequest(BaseModel):
    items: list[CleanupDeleteItem] = Field(default_factory=list)
    deleted_by: str = "admin"


@router.post("/preview")
def preview_cleanup(payload: CleanupPreviewRequest):
    if not payload.rules:
        raise HTTPException(status_code=400, detail="Select at least one cleanup rule")

    try:
        return CleanupService.preview(
            date_from=payload.date_from,
            date_to=payload.date_to,
            rules=list(payload.rules),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Cleanup preview failed: {exc}") from exc


@router.post("/diagnostics/phone-format")
def phone_format_diagnostics(payload: CleanupPreviewRequest):
    try:
        return CleanupService.phone_diagnostics(
            date_from=payload.date_from,
            date_to=payload.date_to,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Phone diagnostics failed: {exc}") from exc


@router.post("/soft-delete")
def soft_delete_cleanup(payload: CleanupSoftDeleteRequest):
    try:
        return CleanupService.soft_delete(
            items=[item.model_dump() for item in payload.items],
            deleted_by=payload.deleted_by,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Soft delete failed: {exc}") from exc

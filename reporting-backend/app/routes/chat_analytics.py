import os
import logging
from pathlib import Path
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query, status

from app.core.security import require_admin_token
from app.services.chat_service import ingest_chat_transcripts_bytes
from app.services.ai_brand_insight_service import generate_brand_ai_insight

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat",
    tags=["Chat Analytics & AI Insight"],
    dependencies=[Depends(require_admin_token)],
)

class BrandInsightRequest(BaseModel):
    brand: str
    query: Optional[str] = ""

class StorageIngestRequest(BaseModel):
    bucket: str
    path: str
    filename: Optional[str] = None
    size: Optional[int] = 0

@router.post("/storage-ingest")
async def ingest_chat_storage_upload(
    payload: StorageIngestRequest,
):
    """
    Ingests chat transcript file directly uploaded to Supabase Storage, bypassing HTTP 413 payload limits.
    """
    try:
        from app.services.storage_upload_service import download_storage_object, filename_from_path, validate_storage_upload
        filename = payload.filename or filename_from_path(payload.path)
        validate_storage_upload("data", filename, payload.size or 0)
        content = download_storage_object("data", payload.bucket, payload.path)
        result = ingest_chat_transcripts_bytes(content)
        return {
            "message": "Ingest storage rekam chat berhasil",
            "data": result
        }
    except Exception as e:
        logger.error(f"ERROR CHAT STORAGE INGEST: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_chat_transcript(
    file: UploadFile = File(...),
):
    """
    Upload and parse chat transcript file (.csv / .xlsx) into Supabase `chat_transcripts`
    """
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Format file tidak didukung. Harap upload file CSV (.csv)"
        )

    try:
        content = await file.read()
        result = ingest_chat_transcripts_bytes(content)
        return {
            "message": "Upload dan ingest rekam chat berhasil",
            "data": result
        }
    except Exception as e:
        logger.error(f"ERROR UPLOAD CHAT TRANSCRIPT: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest-sample-local")
async def ingest_sample_local_chat():
    """
    Ingests the sample file 'contoh data/contoh percakapan.csv' directly into Supabase
    """
    sample_path = Path(__file__).resolve().parent.parent.parent / "contoh data" / "contoh percakapan.csv"
    if not sample_path.exists():
        raise HTTPException(status_code=444, detail=f"File tidak ditemukan di {sample_path}")

    try:
        with open(sample_path, "rb") as f:
            content = f.read()

        result = ingest_chat_transcripts_bytes(content)
        return {
            "message": "Ingest lokal contoh percakapan.csv berhasil",
            "file_path": str(sample_path),
            "result": result
        }
    except Exception as e:
        logger.error(f"ERROR INGEST LOCAL SAMPLE CHAT: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/brand-insight")
async def get_brand_insight(
    req: BrandInsightRequest,
):
    """
    Generates AI Brand Intelligence & Compliance Discrepancy report for Tineco, Ecovacs, Laifen, Tymo, Yoniev, etc.
    """
    if not req.brand:
        raise HTTPException(status_code=400, detail="Nama brand wajib diisi (misal: Tineco, Ecovacs, Laifen)")

    try:
        insight = generate_brand_ai_insight(req.brand, req.query or "")
        return insight
    except Exception as e:
        logger.error(f"ERROR BRAND INSIGHT ROUTE: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

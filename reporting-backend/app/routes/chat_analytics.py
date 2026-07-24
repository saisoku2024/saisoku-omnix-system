import os
import logging
from pathlib import Path
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Query, status

from app.services.chat_service import ingest_chat_transcripts_bytes
from app.services.ai_brand_insight_service import generate_brand_ai_insight

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat Analytics & AI Insight"])

def _verify_admin_token(token: Optional[str]):
    expected = os.environ.get("ADMIN_API_TOKEN")
    if expected and token != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized admin token"
        )

class BrandInsightRequest(BaseModel):
    brand: str
    query: Optional[str] = ""

@router.post("/upload")
async def upload_chat_transcript(
    file: UploadFile = File(...),
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")
):
    """
    Upload and parse chat transcript file (.csv / .xlsx) into Supabase `chat_transcripts`
    """
    _verify_admin_token(x_admin_token)

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
async def ingest_sample_local_chat(
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")
):
    """
    Ingests the sample file 'contoh data/contoh percakapan.csv' directly into Supabase
    """
    _verify_admin_token(x_admin_token)

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
    x_admin_token: Optional[str] = Header(None, alias="X-Admin-Token")
):
    """
    Generates AI Brand Intelligence & Compliance Discrepancy report for Tineco, Ecovacs, Laifen, Tymo, Yoniev, etc.
    """
    _verify_admin_token(x_admin_token)

    if not req.brand:
        raise HTTPException(status_code=400, detail="Nama brand wajib diisi (misal: Tineco, Ecovacs, Laifen)")

    try:
        insight = generate_brand_ai_insight(req.brand, req.query or "")
        return insight
    except Exception as e:
        logger.error(f"ERROR BRAND INSIGHT ROUTE: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

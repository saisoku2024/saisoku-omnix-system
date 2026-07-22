from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel, Field

from app.core.security import require_admin_token
from app.services.knowledge_service import KnowledgeService

router = APIRouter(
    prefix="/knowledge",
    tags=["AI Knowledge Base"],
    dependencies=[Depends(require_admin_token)],
)


class KnowledgeQueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    match_count: int = Field(6, ge=1, le=12)


@router.get("/documents")
def list_documents():
    return KnowledgeService.list_documents()


@router.post("/upload")
async def upload_knowledge_document(
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
):
    return await KnowledgeService.ingest_upload(file=file, title=title)


@router.post("/query")
def query_knowledge(payload: KnowledgeQueryRequest):
    return KnowledgeService.query(payload.question, payload.match_count)

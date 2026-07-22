from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile
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
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
):
    upload = await KnowledgeService.prepare_upload(file=file, title=title)
    content = upload.pop("content")
    background_tasks.add_task(
        KnowledgeService.process_upload,
        upload["document_id"],
        content,
        upload.get("source_file"),
        upload.get("content_type"),
        upload["title"],
    )
    return upload


@router.post("/query")
def query_knowledge(payload: KnowledgeQueryRequest):
    return KnowledgeService.query(payload.question, payload.match_count)

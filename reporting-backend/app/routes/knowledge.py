from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile
from pydantic import BaseModel, Field

from app.core.security import require_admin_token
from app.services.knowledge_service import KnowledgeService
from app.services.storage_upload_service import download_storage_object, filename_from_path, validate_storage_upload

router = APIRouter(
    prefix="/knowledge",
    tags=["AI Knowledge Base"],
    dependencies=[Depends(require_admin_token)],
)


class KnowledgeQueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    match_count: int = Field(6, ge=1, le=12)


class KnowledgeTextRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=180)
    text: str = Field(..., min_length=20, max_length=50000)


class KnowledgeUrlRequest(BaseModel):
    url: str = Field(..., min_length=10, max_length=2000)
    title: str | None = Field(default=None, max_length=180)


class KnowledgeStorageIngestRequest(BaseModel):
    bucket: str = Field(..., min_length=1, max_length=80)
    path: str = Field(..., min_length=1, max_length=500)
    filename: str | None = Field(default=None, max_length=180)
    content_type: str | None = Field(default=None, max_length=180)
    size: int = Field(..., gt=0)
    title: str | None = Field(default=None, max_length=180)


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


@router.post("/storage-ingest")
def ingest_storage_knowledge_document(
    payload: KnowledgeStorageIngestRequest,
    background_tasks: BackgroundTasks,
):
    filename = payload.filename or filename_from_path(payload.path)
    validate_storage_upload("knowledge", filename, payload.size)
    content = download_storage_object("knowledge", payload.bucket, payload.path)
    upload = KnowledgeService.prepare_storage_upload(
        filename=filename,
        title=payload.title,
        content_type=payload.content_type,
        storage_bucket=payload.bucket,
        storage_path=payload.path,
        file_size=payload.size,
    )
    background_tasks.add_task(
        KnowledgeService.process_upload,
        upload["document_id"],
        content,
        upload.get("source_file"),
        upload.get("content_type"),
        upload["title"],
    )
    return upload


@router.post("/text")
def add_manual_knowledge_text(
    payload: KnowledgeTextRequest,
    background_tasks: BackgroundTasks,
):
    upload = KnowledgeService.prepare_manual_text(payload.title, payload.text)
    text = upload.pop("text")
    background_tasks.add_task(
        KnowledgeService.process_manual_text,
        upload["document_id"],
        upload["title"],
        text,
    )
    return upload


@router.post("/url")
def add_web_knowledge_url(
    payload: KnowledgeUrlRequest,
    background_tasks: BackgroundTasks,
):
    upload = KnowledgeService.prepare_web_url(payload.url, payload.title)
    background_tasks.add_task(
        KnowledgeService.process_web_url,
        upload["document_id"],
        upload["title"],
        upload["url"],
    )
    return upload


@router.post("/query")
def query_knowledge(payload: KnowledgeQueryRequest):
    return KnowledgeService.query(payload.question, payload.match_count)

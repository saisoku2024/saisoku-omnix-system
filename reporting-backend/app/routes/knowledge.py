from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from app.core.security import require_admin_token
from app.services.knowledge_service import KnowledgeService
from app.services.storage_upload_service import download_storage_object, filename_from_path, validate_storage_upload

router = APIRouter(
    prefix="/knowledge",
    tags=["AI Knowledge Base"],
    dependencies=[Depends(require_admin_token)],
)

MAX_BATCH_UPLOAD_FILES = 5


class KnowledgeQueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    match_count: int = Field(6, ge=1, le=12)


class KnowledgeFeedbackRequest(BaseModel):
    query_id: str = Field(..., min_length=1)
    feedback: int = Field(..., description="1 for thumbs up, -1 for thumbs down")
    comment: Optional[str] = Field(default=None, max_length=1000)


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
def list_documents(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return KnowledgeService.list_documents(limit=limit, offset=offset)


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


@router.post("/upload-multiple")
async def upload_knowledge_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
):
    """
    Upload beberapa dokumen sekaligus (maks MAX_BATCH_UPLOAD_FILES per batch).

    Diproses SEKUENSIAL per file (bukan paralel) — keputusan sadar, bukan
    keterbatasan: upload paralel bisa memicu rate-limit Gemini kalau beberapa
    file besar di-embed bersamaan. Tiap file divalidasi & diproses secara
    terisolasi lewat try/except — 1 file gagal (ekstensi tidak didukung,
    ukuran kelebihan, dst) TIDAK menggagalkan file lain dalam batch yang sama.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Tidak ada file yang diunggah.")
    if len(files) > MAX_BATCH_UPLOAD_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Maksimal {MAX_BATCH_UPLOAD_FILES} file per batch upload. Anda mengirim {len(files)} file.",
        )

    results = []
    for file in files:
        try:
            upload = await KnowledgeService.prepare_upload(file=file, title=None)
            content = upload.pop("content")
            background_tasks.add_task(
                KnowledgeService.process_upload,
                upload["document_id"],
                content,
                upload.get("source_file"),
                upload.get("content_type"),
                upload["title"],
            )
            results.append(
                {
                    "filename": file.filename,
                    "status": "processing",
                    "document_id": upload["document_id"],
                }
            )
        except HTTPException as exc:
            # Gagal validasi (ekstensi tidak didukung / ukuran kelebihan / dsb) —
            # dicatat sebagai rejected, TIDAK menghentikan file lain di batch ini.
            results.append(
                {
                    "filename": file.filename,
                    "status": "rejected",
                    "error": exc.detail,
                }
            )
        except Exception as exc:
            # Error tak terduga di luar HTTPException — tetap diisolasi per file.
            results.append(
                {
                    "filename": file.filename,
                    "status": "rejected",
                    "error": f"Gagal memproses file: {str(exc)[:200]}",
                }
            )

    accepted = sum(1 for r in results if r["status"] == "processing")
    return {
        "success": True,
        "total_files": len(files),
        "accepted": accepted,
        "rejected": len(files) - accepted,
        "documents": results,
    }


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


@router.post("/query-stream")
def query_knowledge_stream(payload: KnowledgeQueryRequest):
    """
    Streaming response (SSE) yang mengirim potongan token secara realtime
    ke frontend Next.js untuk mereduksi Time-To-First-Token (TTFT).
    """
    return StreamingResponse(
        KnowledgeService.query_stream(payload.question, payload.match_count),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/feedback")
def submit_knowledge_feedback(payload: KnowledgeFeedbackRequest):
    """
    Mencatat rating feedback (+1 / -1) dari pengguna untuk observabilitas & peningkatan RAG.
    """
    from app.services.knowledge_query_log_service import KnowledgeQueryLogService
    result = KnowledgeQueryLogService.submit_feedback(
        query_id=payload.query_id,
        feedback_score=payload.feedback,
        comment=payload.comment,
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("detail", "Gagal menyimpan feedback."))
    return result


@router.get("/backup/export")
def export_knowledge_backup():
    from app.services.knowledge_backup_service import KnowledgeBackupService
    zip_bytes, filename = KnowledgeBackupService.export_backup()
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/backup/restore")
async def restore_knowledge_backup(file: UploadFile = File(...)):
    from app.services.knowledge_backup_service import KnowledgeBackupService
    content = await file.read()
    return KnowledgeBackupService.restore_backup(content)


@router.get("/inconsistencies")
def get_knowledge_inconsistencies(limit: int = Query(10, ge=1, le=100), offset: int = Query(0, ge=0)):
    from app.services.knowledge_inconsistency_service import KnowledgeInconsistencyService
    items = KnowledgeInconsistencyService.list_inconsistencies(limit=limit, offset=offset)
    return {"inconsistencies": items, "count": len(items)}


@router.get("/monitoring/summary")
def get_knowledge_monitoring_summary(days: int = Query(7, ge=1, le=90)):
    from app.services.knowledge_query_log_service import KnowledgeQueryLogService
    return KnowledgeQueryLogService.summary(days=days)


@router.delete("/documents/{document_id}")
def delete_knowledge_document(document_id: str):
    return KnowledgeService.delete_document(document_id)


@router.post("/clear-all")
def clear_all_knowledge_documents():
    return KnowledgeService.clear_all_documents()


import base64
import io
import logging
import os
import re
from typing import Any, Dict, List

import pandas as pd
import requests
from fastapi import HTTPException, UploadFile, status

from app.core.supabase import supabase
from app.services.audit_log_service import AuditLogService

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_GEMINI_MODEL = "gemini-3.5-flash"
DEFAULT_EMBEDDING_MODEL = "gemini-embedding-2"
LEGACY_GEMINI_MODELS = {"gemini-2.5-flash"}
EMBEDDING_DIMENSION = 768
MAX_KB_FILE_SIZE_BYTES = 10 * 1024 * 1024
MIN_EXTRACTED_TEXT_CHARS = 20


def _gemini_api_key() -> str:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY is not configured",
        )
    return key


def _embedding_model() -> str:
    return os.getenv("GEMINI_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL).strip()


def _chat_model() -> str:
    model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip()
    return DEFAULT_GEMINI_MODEL if model in LEGACY_GEMINI_MODELS else model


def _clean_text(value: str) -> str:
    text = value.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def _chunk_text(text: str, max_chars: int = 1800, overlap: int = 220) -> List[str]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: List[str] = []
    current = ""

    for paragraph in paragraphs:
        next_text = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(next_text) <= max_chars:
            current = next_text
            continue
        if current:
            chunks.append(current)
        if len(paragraph) <= max_chars:
            current = paragraph
            continue
        for start in range(0, len(paragraph), max_chars - overlap):
            segment = paragraph[start : start + max_chars].strip()
            if segment:
                chunks.append(segment)
        current = ""

    if current:
        chunks.append(current)

    if len(chunks) <= 1:
        return chunks

    with_overlap = [chunks[0]]
    for index in range(1, len(chunks)):
        prefix = chunks[index - 1][-overlap:].strip()
        merged = f"{prefix}\n\n{chunks[index]}".strip()
        with_overlap.append(merged[: max_chars + overlap])
    return with_overlap


def _extract_pdf(content: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="PDF support requires pypdf to be installed",
        ) from exc

    reader = PdfReader(io.BytesIO(content))
    pages = [(page.extract_text() or "") for page in reader.pages]
    return "\n\n".join(pages)


def _extract_pdf_with_gemini_ocr(content: bytes) -> str:
    key = _gemini_api_key()
    model = _chat_model()
    encoded_pdf = base64.b64encode(content).decode("ascii")
    prompt = (
        "Transkripsikan teks dari PDF ini untuk knowledge base RAG. "
        "Baca juga halaman scan/gambar dengan OCR. "
        "Kembalikan hanya teks dokumen yang terbaca, pertahankan heading, tabel sederhana, "
        "nomor langkah, dan FAQ jika ada. Jangan membuat ringkasan atau menambah informasi."
    )
    response = requests.post(
        f"{GEMINI_API_BASE}/models/{model}:generateContent",
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
        json={
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": "application/pdf",
                                "data": encoded_pdf,
                            }
                        },
                    ]
                }
            ]
        },
        timeout=120,
    )
    if not response.ok:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini PDF OCR request failed: {response.text[:300]}",
        )
    candidates = response.json().get("candidates") or []
    parts = (candidates[0].get("content", {}).get("parts") if candidates else []) or []
    text = "\n".join(str(part.get("text", "")) for part in parts if part.get("text"))
    return _clean_text(text)


def _extract_docx(content: bytes) -> str:
    try:
        from docx import Document
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="DOCX support requires python-docx to be installed",
        ) from exc

    document = Document(io.BytesIO(content))
    paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def _extract_spreadsheet(content: bytes, filename: str) -> str:
    file_obj = io.BytesIO(content)
    if filename.lower().endswith(".csv"):
        df = pd.read_csv(file_obj)
    else:
        df = pd.read_excel(file_obj)
    if df.empty:
        return ""
    return df.fillna("").astype(str).to_csv(index=False)


def extract_document_text(content: bytes, filename: str, content_type: str | None) -> str:
    lower_name = filename.lower()
    if lower_name.endswith(".pdf") or content_type == "application/pdf":
        extracted_text = _clean_text(_extract_pdf(content))
        if len(extracted_text) >= MIN_EXTRACTED_TEXT_CHARS:
            return extracted_text
        return _extract_pdf_with_gemini_ocr(content)
    if lower_name.endswith(".docx"):
        return _clean_text(_extract_docx(content))
    if lower_name.endswith((".xlsx", ".xls", ".csv")):
        return _clean_text(_extract_spreadsheet(content, filename))
    try:
        return _clean_text(content.decode("utf-8"))
    except UnicodeDecodeError:
        return _clean_text(content.decode("latin-1", errors="ignore"))


def _embed_text(text: str, *, title: str | None = None, is_query: bool = False) -> List[float]:
    key = _gemini_api_key()
    model = _embedding_model()
    prefix = "task: search result | query: " if is_query else f"title: {title or 'none'} | text: "
    payload = {
        "content": {"parts": [{"text": f"{prefix}{text}"}]},
        "output_dimensionality": EMBEDDING_DIMENSION,
    }
    response = requests.post(
        f"{GEMINI_API_BASE}/models/{model}:embedContent",
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
        json=payload,
        timeout=45,
    )
    if not response.ok:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini embedding request failed: {response.text[:300]}",
        )
    values = response.json().get("embedding", {}).get("values")
    if not isinstance(values, list) or len(values) != EMBEDDING_DIMENSION:
        raise HTTPException(status_code=502, detail="Gemini embedding response is invalid")
    return [float(v) for v in values]


def _vector_literal(values: List[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in values) + "]"


def _generate_answer(question: str, sources: List[Dict[str, Any]]) -> str:
    key = _gemini_api_key()
    model = _chat_model()
    context = "\n\n".join(
        f"[Source {idx + 1}: {source['title']}]\n{source['content']}"
        for idx, source in enumerate(sources)
    )
    prompt = (
        "Anda adalah AI Knowledge Base untuk SAISOKU OMNIX. "
        "Jawab dalam Bahasa Indonesia yang ringkas, praktis, dan hanya berdasarkan konteks. "
        "Jika konteks tidak cukup, katakan bahwa knowledge base belum punya informasi yang cukup.\n\n"
        f"KONTEKS:\n{context}\n\nPERTANYAAN:\n{question}"
    )
    response = requests.post(
        f"{GEMINI_API_BASE}/models/{model}:generateContent",
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=60,
    )
    if not response.ok:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini answer request failed: {response.text[:300]}",
        )
    candidates = response.json().get("candidates") or []
    parts = (candidates[0].get("content", {}).get("parts") if candidates else []) or []
    text = "\n".join(str(part.get("text", "")) for part in parts if part.get("text"))
    return text.strip() or "Knowledge base belum punya jawaban yang cukup untuk pertanyaan ini."


class KnowledgeService:
    @staticmethod
    def list_documents() -> Dict[str, Any]:
        res = (
            supabase.table("knowledge_documents")
            .select("id,title,source_file,mime_type,status,chunk_count,created_by,error_summary,created_at,updated_at")
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        documents = res.data or []
        return {"total": len(documents), "documents": documents}

    @staticmethod
    async def prepare_upload(file: UploadFile, title: str | None, user_email: str = "admin@omnix.com") -> Dict[str, Any]:
        content = await file.read()
        if len(content) > MAX_KB_FILE_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="Ukuran dokumen knowledge base maksimal 10MB.")

        document_title = (title or file.filename or "Untitled Knowledge Document").strip()
        doc_res = (
            supabase.table("knowledge_documents")
            .insert(
                {
                    "title": document_title,
                    "source_file": file.filename,
                    "mime_type": file.content_type,
                    "status": "processing",
                    "created_by": user_email,
                }
            )
            .execute()
        )
        document = (doc_res.data or [None])[0]
        if not document:
            raise HTTPException(status_code=500, detail="Gagal membuat knowledge document.")

        return {
            "success": True,
            "document_id": document["id"],
            "title": document_title,
            "status": "processing",
            "source_file": file.filename,
            "content_type": file.content_type,
            "content": content,
        }

    @staticmethod
    def process_upload(
        document_id: str,
        content: bytes,
        filename: str | None,
        content_type: str | None,
        document_title: str,
        user_email: str = "admin@omnix.com",
    ) -> None:
        try:
            try:
                text = extract_document_text(content, filename or document_title, content_type)
            except HTTPException:
                raise
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Gagal membaca dokumen knowledge base: {str(exc)[:300]}",
                ) from exc
            if len(text) < MIN_EXTRACTED_TEXT_CHARS:
                raise HTTPException(status_code=400, detail="Dokumen terlalu kosong untuk diproses sebagai knowledge base.")

            chunks = _chunk_text(text)
            if not chunks:
                raise HTTPException(status_code=400, detail="Dokumen tidak menghasilkan chunk knowledge base.")

            rows = []
            for index, chunk in enumerate(chunks):
                embedding = _embed_text(chunk, title=document_title, is_query=False)
                rows.append(
                    {
                        "document_id": document_id,
                        "chunk_index": index,
                        "title": document_title,
                        "content": chunk,
                        "token_estimate": _estimate_tokens(chunk),
                        "embedding": _vector_literal(embedding),
                    }
                )
            supabase.table("knowledge_chunks").insert(rows).execute()
            (
                supabase.table("knowledge_documents")
                .update({"status": "ready", "chunk_count": len(rows), "error_summary": None})
                .eq("id", document_id)
                .execute()
            )
            AuditLogService.log(
                action="KNOWLEDGE_UPLOAD",
                resource="knowledge_documents",
                user_email=user_email,
                user_role="super_admin",
                details={"document_id": document_id, "title": document_title, "chunks": len(rows)},
            )
            return {"success": True, "document_id": document_id, "title": document_title, "chunk_count": len(rows)}
        except Exception as exc:
            logger.error("Knowledge ingestion failed", exc_info=True)
            error_summary = exc.detail if isinstance(exc, HTTPException) else str(exc)
            (
                supabase.table("knowledge_documents")
                .update({"status": "failed", "error_summary": str(error_summary)[:500]})
                .eq("id", document_id)
                .execute()
            )

    @staticmethod
    def query(question: str, match_count: int = 6) -> Dict[str, Any]:
        cleaned_question = question.strip()
        if len(cleaned_question) < 3:
            raise HTTPException(status_code=400, detail="Pertanyaan terlalu pendek.")

        embedding = _embed_text(cleaned_question, is_query=True)
        res = (
            supabase.rpc(
                "match_knowledge_chunks",
                {
                    "query_embedding": _vector_literal(embedding),
                    "match_count": match_count,
                },
            )
            .execute()
        )
        sources = res.data or []
        filtered_sources = [source for source in sources if float(source.get("similarity") or 0) >= 0.2]
        if not filtered_sources:
            return {
                "answer": "Knowledge base belum punya informasi yang cukup untuk menjawab pertanyaan ini.",
                "sources": [],
            }

        answer = _generate_answer(cleaned_question, filtered_sources)
        AuditLogService.log(
            action="KNOWLEDGE_QUERY",
            resource="knowledge_chunks",
            details={"question": cleaned_question, "source_count": len(filtered_sources)},
        )
        return {
            "answer": answer,
            "sources": [
                {
                    "chunk_id": source.get("chunk_id"),
                    "document_id": source.get("document_id"),
                    "title": source.get("title"),
                    "content": source.get("content"),
                    "chunk_index": source.get("chunk_index"),
                    "similarity": source.get("similarity"),
                }
                for source in filtered_sources
            ],
        }

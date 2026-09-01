from datetime import datetime, timezone
import json
import logging
import re
import time
from typing import Any, Dict, Generator, List, Optional, Set

from fastapi import HTTPException, UploadFile, status

from app.core.gemini_config import resolve_chat_model
from app.core.supabase import supabase
from app.services.audit_log_service import AuditLogService
from app.services.storage_upload_service import (
    MAX_STORAGE_UPLOAD_SIZE_BYTES,
    validate_storage_upload,
)

# Import from modularized microservices
from app.services.knowledge_embedding_service import (
    GEMINI_API_BASE,
    _HTTPX_CLIENT,
    _check_and_flag_embedding_reindex_if_needed,
    _embed_text,
    _embed_texts,
    _embedding_model,
    _gemini_api_key,
    _get_gemini_keys,
    _normalize_l2,
    _vector_literal,
)
from app.services.knowledge_extraction_service import (
    IGNORED_HTML_TAGS,
    MAX_CONTEXTUAL_CHUNKS_PER_DOCUMENT,
    MAX_WEB_PAGE_BYTES,
    MIN_EXTRACTED_TEXT_CHARS,
    MOJIBAKE_REPLACEMENTS,
    HostPinnedHTTPAdapter,
    ReadableTextParser,
    _chunk_text,
    _clean_text,
    _dataframe_to_markdown,
    _estimate_tokens,
    _extract_docx,
    _extract_image_with_gemini_ocr,
    _extract_pdf,
    _extract_pdf_with_gemini_ocr,
    _extract_pptx,
    _extract_spreadsheet,
    _extract_web_page_text,
    _generate_chunk_context,
    _looks_like_table_block,
    _looks_like_table_line,
    _markdown_table,
    _resolve_and_validate_host,
    _strip_repeated_lines,
    _validate_public_web_url,
    extract_document_text,
)
from app.services.knowledge_entity_service import (
    BRAND_PATTERNS,
    COMPACT_PRODUCT_CODE_RE,
    DOCUMENT_TYPE_PATTERNS,
    MODEL_LINE_RE,
    PRODUCT_CODE_RE,
    TOPIC_PATTERNS,
    _compact_entity_value,
    _entity_row,
    _extract_product_codes,
    _normalize_entity_value,
    _series_from_product_code,
    extract_knowledge_entities,
)
from app.services.knowledge_retrieval_service import (
    TRUST_LEVEL_RANK,
    _chunk_matches_any_term,
    _execute_chunk_select,
    _fetch_entity_index_chunks,
    _fetch_fts_chunks,
    _fetch_keyword_chunks,
    _filter_rank_keyword_chunks,
    _indicator_query_terms,
    _is_active_knowledge_document,
    _parse_datetime,
    _to_query_source,
    _trust_rank,
)
from app.services.knowledge_answer_service import (
    _KB_SYSTEM_INSTRUCTION,
    _generate_answer,
    _stream_generate_answer,
)
from app.services.knowledge_cache_service import KnowledgeCacheService

logger = logging.getLogger(__name__)

MAX_KB_FILE_SIZE_BYTES = MAX_STORAGE_UPLOAD_SIZE_BYTES
ENTITY_INDEX_VERSION = "2026-08-05-v1"


def _without_context_prefix(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [
        {key: value for key, value in row.items() if key != "context_prefix"}
        for row in rows
    ]


class KnowledgeService:
    @staticmethod
    def list_documents(limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        safe_limit = max(1, min(limit, 200))
        safe_offset = max(0, offset)
        end_range = safe_offset + safe_limit - 1

        try:
            res = (
                supabase.table("knowledge_documents")
                .select("id,title,source_file,mime_type,status,chunk_count,created_by,error_summary,storage_bucket,storage_path,file_size,created_at,updated_at", count="exact")
                .order("created_at", desc=True)
                .range(safe_offset, end_range)
                .execute()
            )
        except Exception as exc:
            if not any(key in str(exc).lower() for key in ["storage_bucket", "storage_path", "file_size"]):
                raise
            res = (
                supabase.table("knowledge_documents")
                .select("id,title,source_file,mime_type,status,chunk_count,created_by,error_summary,created_at,updated_at", count="exact")
                .order("created_at", desc=True)
                .range(safe_offset, end_range)
                .execute()
            )
        documents = res.data or []
        total_count = res.count if getattr(res, "count", None) is not None else len(documents)
        return {
            "total": total_count,
            "limit": safe_limit,
            "offset": safe_offset,
            "documents": documents,
        }

    @staticmethod
    def delete_document(document_id: str) -> Dict[str, Any]:
        try:
            try:
                supabase.table("knowledge_entities").delete().eq("document_id", document_id).execute()
            except Exception:
                pass
            supabase.table("knowledge_chunks").delete().eq("document_id", document_id).execute()
            supabase.table("knowledge_documents").delete().eq("id", document_id).execute()
            KnowledgeCacheService.clear_cache()
            return {"success": True, "document_id": document_id}
        except Exception as exc:
            logger.error(f"Failed to delete document {document_id}: {exc}")
            raise HTTPException(status_code=500, detail=f"Gagal menghapus dokumen knowledge: {exc}")

    @staticmethod
    def clear_all_documents() -> Dict[str, Any]:
        try:
            try:
                supabase.table("knowledge_entities").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            except Exception:
                pass
            try:
                supabase.table("knowledge_inconsistency_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            except Exception:
                pass
            supabase.table("knowledge_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            res = supabase.table("knowledge_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            KnowledgeCacheService.clear_cache()
            deleted_count = len(res.data or [])
            return {"success": True, "deleted_count": deleted_count}
        except Exception as exc:
            logger.error(f"Failed to clear all knowledge documents: {exc}")
            raise HTTPException(status_code=500, detail=f"Gagal membersihkan database knowledge: {exc}")

    @staticmethod
    def _check_duplicate_document(title: str, source_file: str | None = None) -> None:
        clean_title = title.strip()
        if clean_title:
            try:
                res = supabase.table("knowledge_documents").select("id, title, status").ilike("title", clean_title).execute()
                if res.data and len(res.data) > 0:
                    existing = res.data[0]
                    raise HTTPException(
                        status_code= status.HTTP_400_BAD_REQUEST,
                        detail=f"Dokumen dengan judul '{existing['title']}' sudah ada di Knowledge Base (Duplicate Rejected).",
                    )
            except HTTPException:
                raise
            except Exception as exc:
                logger.warning(f"Duplicate title check error: {exc}")

        if source_file and source_file not in ("manual:text", "web:url"):
            try:
                res_file = supabase.table("knowledge_documents").select("id, title, source_file").eq("source_file", source_file).execute()
                if res_file.data and len(res_file.data) > 0:
                    existing = res_file.data[0]
                    raise HTTPException(
                        status_code= status.HTTP_400_BAD_REQUEST,
                        detail=f"File '{source_file}' (Judul: {existing['title']}) sudah ada di Knowledge Base (Duplicate Rejected).",
                    )
            except HTTPException:
                raise
            except Exception as exc:
                logger.warning(f"Duplicate source_file check error: {exc}")

    @staticmethod
    async def prepare_upload(file: UploadFile, title: str | None, user_email: str = "admin@omnix.com") -> Dict[str, Any]:
        content = await file.read()
        validate_storage_upload("knowledge", file.filename or "", len(content))

        document_title = (title or file.filename or "Untitled Knowledge Document").strip()
        KnowledgeService._check_duplicate_document(document_title, source_file=file.filename)
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
    def prepare_storage_upload(
        filename: str,
        title: str | None,
        content_type: str | None,
        storage_bucket: str,
        storage_path: str,
        file_size: int,
        user_email: str = "admin@omnix.com",
    ) -> Dict[str, Any]:
        document_title = (title or filename or "Untitled Knowledge Document").strip()
        KnowledgeService._check_duplicate_document(document_title, source_file=filename)
        payload = {
            "title": document_title,
            "source_file": filename,
            "mime_type": content_type,
            "status": "processing",
            "created_by": user_email,
            "storage_bucket": storage_bucket,
            "storage_path": storage_path,
            "file_size": file_size,
        }
        try:
            doc_res = supabase.table("knowledge_documents").insert(payload).execute()
        except Exception as exc:
            if not any(key in str(exc).lower() for key in ["storage_bucket", "storage_path", "file_size"]):
                raise
            fallback_payload = {
                "title": document_title,
                "source_file": f"{storage_bucket}/{storage_path}",
                "mime_type": content_type,
                "status": "processing",
                "created_by": user_email,
            }
            doc_res = supabase.table("knowledge_documents").insert(fallback_payload).execute()
        document = (doc_res.data or [None])[0]
        if not document:
            raise HTTPException(status_code=500, detail="Gagal membuat knowledge document.")

        return {
            "success": True,
            "document_id": document["id"],
            "title": document_title,
            "status": "processing",
            "source_file": filename,
            "content_type": content_type,
            "storage_bucket": storage_bucket,
            "storage_path": storage_path,
        }

    @staticmethod
    def _process_text_content(
        document_id: str,
        document_title: str,
        text: str,
        user_email: str = "admin@omnix.com",
    ) -> None:
        try:
            text = _clean_text(text)
            if len(text) < MIN_EXTRACTED_TEXT_CHARS:
                raise HTTPException(status_code=400, detail="Dokumen terlalu kosong untuk diproses sebagai knowledge base.")

            chunks = _chunk_text(text)
            if not chunks:
                raise HTTPException(status_code=400, detail="Dokumen tidak menghasilkan chunk knowledge base.")

            if len(chunks) > MAX_CONTEXTUAL_CHUNKS_PER_DOCUMENT:
                logger.warning(
                    f"Dokumen '{document_title}' punya {len(chunks)} chunk, melebihi "
                    f"MAX_CONTEXTUAL_CHUNKS_PER_DOCUMENT={MAX_CONTEXTUAL_CHUNKS_PER_DOCUMENT}. "
                    f"Contextual retrieval hanya dijalankan untuk {MAX_CONTEXTUAL_CHUNKS_PER_DOCUMENT} "
                    f"chunk pertama; sisanya di-embed tanpa context_prefix."
                )
            context_prefixes = [
                _generate_chunk_context(text, chunk, document_title)
                if index < MAX_CONTEXTUAL_CHUNKS_PER_DOCUMENT else ""
                for index, chunk in enumerate(chunks)
            ]

            texts_to_embed = [
                f"{ctx}\n\n{chunk}" if ctx else chunk
                for ctx, chunk in zip(context_prefixes, chunks)
            ]
            embeddings = _embed_texts(texts_to_embed, title=document_title)

            rows = []
            for index, chunk in enumerate(chunks):
                rows.append(
                    {
                        "document_id": document_id,
                        "chunk_index": index,
                        "title": document_title,
                        "content": chunk,
                        "context_prefix": context_prefixes[index] or None,
                        "token_estimate": _estimate_tokens(chunk),
                        "embedding": _vector_literal(embeddings[index]),
                    }
                )
            try:
                insert_res = supabase.table("knowledge_chunks").insert(rows).execute()
            except Exception as exc:
                if "context_prefix" not in str(exc).lower():
                    raise
                logger.warning(
                    "knowledge_chunks.context_prefix is not available in the current schema cache; "
                    "inserting chunks without contextual prefixes."
                )
                insert_res = supabase.table("knowledge_chunks").insert(_without_context_prefix(rows)).execute()
            (
                supabase.table("knowledge_documents")
                .update({"status": "ready", "chunk_count": len(rows), "error_summary": None})
                .eq("id", document_id)
                .execute()
            )
            try:
                inserted_chunks = insert_res.data or []
                if not inserted_chunks:
                    chunks_res = (
                        supabase.table("knowledge_chunks")
                        .select("id, document_id, title, content, chunk_index")
                        .eq("document_id", document_id)
                        .execute()
                    )
                    inserted_chunks = chunks_res.data or []
                KnowledgeService.reindex_entities_for_document(
                    document_id=document_id,
                    document={"id": document_id, "title": document_title, "status": "ready"},
                    chunks=inserted_chunks,
                    dry_run=False,
                )
            except Exception as entity_exc:
                logger.warning(f"Knowledge entity indexing skipped for document {document_id}: {entity_exc}")
            KnowledgeCacheService.clear_cache()
            AuditLogService.log(
                action="KNOWLEDGE_UPLOAD",
                resource="knowledge_documents",
                user_email=user_email,
                user_role="super_admin",
                details={"document_id": document_id, "title": document_title, "chunks": len(rows)},
            )
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
            KnowledgeService._process_text_content(document_id, document_title, text, user_email)
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
    def prepare_manual_text(title: str, text: str, user_email: str = "admin@omnix.com") -> Dict[str, Any]:
        document_title = title.strip()
        cleaned_text = _clean_text(text)
        if len(document_title) < 3:
            raise HTTPException(status_code=400, detail="Judul knowledge manual minimal 3 karakter.")
        if len(cleaned_text) < MIN_EXTRACTED_TEXT_CHARS:
            raise HTTPException(status_code=400, detail="Teks knowledge manual terlalu pendek.")

        KnowledgeService._check_duplicate_document(document_title, source_file="manual:text")
        doc_res = (
            supabase.table("knowledge_documents")
            .insert(
                {
                    "title": document_title,
                    "source_file": "manual:text",
                    "mime_type": "text/plain",
                    "status": "processing",
                    "created_by": user_email,
                }
            )
            .execute()
        )
        document = (doc_res.data or [None])[0]
        if not document:
            raise HTTPException(status_code=500, detail="Gagal membuat manual knowledge document.")

        return {
            "success": True,
            "document_id": document["id"],
            "title": document_title,
            "status": "processing",
            "text": cleaned_text,
        }

    @staticmethod
    def process_manual_text(
        document_id: str,
        document_title: str,
        text: str,
        user_email: str = "admin@omnix.com",
    ) -> None:
        KnowledgeService._process_text_content(document_id, document_title, text, user_email)

    @staticmethod
    def prepare_web_url(url: str, title: str | None = None, user_email: str = "admin@omnix.com") -> Dict[str, Any]:
        source_url = _validate_public_web_url(url)
        parsed = urlparse(source_url)
        document_title = (title or parsed.netloc).strip()
        if len(document_title) < 3:
            raise HTTPException(status_code=400, detail="Judul web knowledge minimal 3 karakter.")

        KnowledgeService._check_duplicate_document(document_title, source_file=source_url)

        doc_res = (
            supabase.table("knowledge_documents")
            .insert(
                {
                    "title": document_title,
                    "source_file": source_url,
                    "mime_type": "text/html",
                    "status": "processing",
                    "created_by": user_email,
                }
            )
            .execute()
        )
        document = (doc_res.data or [None])[0]
        if not document:
            raise HTTPException(status_code=500, detail="Gagal membuat web knowledge document.")

        return {
            "success": True,
            "document_id": document["id"],
            "title": document_title,
            "status": "processing",
            "url": source_url,
        }

    @staticmethod
    def process_web_url(
        document_id: str,
        document_title: str,
        url: str,
        user_email: str = "admin@omnix.com",
    ) -> None:
        try:
            text = _extract_web_page_text(url)
            KnowledgeService._process_text_content(document_id, document_title, text, user_email)
        except Exception as exc:
            logger.error("Knowledge web ingestion failed", exc_info=True)
            error_summary = exc.detail if isinstance(exc, HTTPException) else str(exc)
            (
                supabase.table("knowledge_documents")
                .update({"status": "failed", "error_summary": str(error_summary)[:500]})
                .eq("id", document_id)
                .execute()
            )

    @staticmethod
    def reindex_entities_for_document(
        document_id: str,
        document: Dict[str, Any] | None = None,
        chunks: List[Dict[str, Any]] | None = None,
        dry_run: bool = True,
    ) -> Dict[str, Any]:
        if not document:
            doc_res = (
                supabase.table("knowledge_documents")
                .select("id,title,source_file,status")
                .eq("id", document_id)
                .single()
                .execute()
            )
            document = doc_res.data or {}
        if not document:
            raise HTTPException(status_code=404, detail="Knowledge document tidak ditemukan.")

        if chunks is None:
            chunks_res = (
                supabase.table("knowledge_chunks")
                .select("id, document_id, title, content, chunk_index")
                .eq("document_id", document_id)
                .order("chunk_index")
                .execute()
            )
            chunks = chunks_res.data or []

        entity_rows: List[Dict[str, Any]] = []
        for chunk in chunks:
            entity_rows.extend(extract_knowledge_entities(document, chunk))

        if dry_run:
            return {
                "document_id": document_id,
                "title": document.get("title"),
                "chunk_count": len(chunks),
                "entity_count": len(entity_rows),
                "sample_entities": entity_rows[:20],
            }

        try:
            try:
                supabase.table("knowledge_entities").delete().eq("document_id", document_id).execute()
                if entity_rows:
                    supabase.table("knowledge_entities").insert(entity_rows).execute()
            except Exception as table_exc:
                if "knowledge_entities" in str(table_exc) or "PGRST205" in str(table_exc):
                    logger.warning(f"Tabel 'knowledge_entities' belum tersedia di Supabase schema cache ({table_exc}). Updating document metadata only.")
                else:
                    raise
            try:
                supabase.table("knowledge_documents").update(
                    {
                        "entity_indexed_at": datetime.now(timezone.utc).isoformat(),
                        "entity_index_version": ENTITY_INDEX_VERSION,
                    }
                ).eq("id", document_id).execute()
            except Exception as meta_exc:
                if "entity_index_version" in str(meta_exc) or "PGRST204" in str(meta_exc):
                    logger.warning(f"Kolom metadata entity belum tersedia di Supabase schema ({meta_exc}). Skipped document status update.")
                else:
                    raise
        except Exception as exc:
            logger.warning(f"Failed to write knowledge entity index for document {document_id}: {exc}")
            raise

        return {
            "document_id": document_id,
            "title": document.get("title"),
            "chunk_count": len(chunks),
            "entity_count": len(entity_rows),
            "dry_run": False,
        }

    @staticmethod
    def reindex_entities(limit: int = 200, offset: int = 0, dry_run: bool = True) -> Dict[str, Any]:
        docs_res = (
            supabase.table("knowledge_documents")
            .select("id,title,source_file,status")
            .eq("status", "ready")
            .order("created_at", desc=False)
            .range(offset, offset + max(limit, 1) - 1)
            .execute()
        )
        documents = docs_res.data or []
        results: List[Dict[str, Any]] = []
        total_entities = 0
        for document in documents:
            result = KnowledgeService.reindex_entities_for_document(
                document_id=document["id"],
                document=document,
                chunks=None,
                dry_run=dry_run,
            )
            total_entities += int(result.get("entity_count") or 0)
            results.append(result)

        return {
            "dry_run": dry_run,
            "entity_index_version": ENTITY_INDEX_VERSION,
            "document_count": len(documents),
            "entity_count": total_entities,
            "documents": results,
        }

    @staticmethod
    def _run_retrieval_pipeline(
        question: str,
        cleaned_question: str,
        match_count: int,
        t_start: float,
        precomputed_embedding: Optional[List[float]] = None,
    ) -> Dict[str, Any]:
        """
        Orkestrasi Hybrid Retrieval: Vector search (pgvector) + FTS (Postgres BM25) +
        Entity Index lookup + Targeted Keyword/Policy matching + Multi-entity balancing.
        """
        sources: List[Dict[str, Any]] = []
        retrieval_methods_used: Set[str] = set()

        # 1. Vector Search (Dense)
        t0_embed = time.perf_counter()
        t_embed_ms = 0
        embedding = precomputed_embedding
        try:
            if embedding is None:
                embedding = _embed_text(cleaned_question, is_query=True)
                t_embed_ms = int((time.perf_counter() - t0_embed) * 1000)
            if embedding and any(v != 0.0 for v in embedding):
                res = (
                    supabase.rpc(
                        "match_knowledge_chunks",
                        {
                            "query_embedding": _vector_literal(embedding),
                            "match_count": max(match_count * 3, 18),
                        },
                    )
                    .execute()
                )
                raw_sources = res.data or []
                relevant_sources = [s for s in raw_sources if float(s.get("similarity") or 0) >= 0.5]
                sources = _filter_rank_keyword_chunks(relevant_sources, match_count)
                if sources:
                    retrieval_methods_used.add("vector")
        except Exception as exc:
            logger.warning(f"Vector search embedding failed or unconfigured: {exc}")

        # 2. PostgreSQL Full-Text Search (FTS / BM25) via RPC
        try:
            fts_raw = _fetch_fts_chunks(cleaned_question, match_count * 2)
            if fts_raw:
                ranked_fts = _filter_rank_keyword_chunks(fts_raw, match_count)
                existing_ids = {s.get("chunk_id") or s.get("id") for s in sources}
                for fc in ranked_fts:
                    cid = fc.get("chunk_id") or fc.get("id")
                    if cid and cid not in existing_ids:
                        sources.append({
                            "chunk_id": cid,
                            "document_id": fc.get("document_id"),
                            "title": fc.get("title"),
                            "content": fc.get("content"),
                            "context_prefix": fc.get("context_prefix"),
                            "chunk_index": fc.get("chunk_index"),
                            "similarity": float(fc.get("rank") or 0.82),
                        })
                        existing_ids.add(cid)
                        retrieval_methods_used.add("fts")
        except Exception as fts_exc:
            logger.debug(f"FTS search error: {fts_exc}")

        # 3. Check for service / sparepart policy terms (e.g., discontinued memo)
        service_terms = {"service", "servis", "sparepart", "baterai", "onderdil", "discontinued", "pemberhentian", "ganti", "rusak", "perbaikan"}
        is_service_related = any(term in cleaned_question.lower() for term in service_terms)
        if is_service_related:
            try:
                existing_ids = {s.get("chunk_id") or s.get("id") for s in sources}
                memo_chunks = _execute_chunk_select(
                    lambda b: b.or_("content.ilike.%pemberhentian%,title.ilike.%pemberhentian%,content.ilike.%sparepart%"),
                    limit=6,
                )
                for mc in memo_chunks:
                    cid = mc.get("id")
                    if cid and cid not in existing_ids:
                        sources.append({
                            "chunk_id": cid,
                            "document_id": mc.get("document_id"),
                            "title": mc.get("title"),
                            "content": mc.get("content"),
                            "context_prefix": mc.get("context_prefix"),
                            "chunk_index": mc.get("chunk_index"),
                            "similarity": 0.88,
                        })
                        existing_ids.add(cid)
                        retrieval_methods_used.add("memo_policy")
            except Exception as memo_exc:
                logger.warning(f"Failed to fetch memo policy chunks for service query: {memo_exc}")

        stop_words = {
            "apa", "yang", "dan", "atau", "dengan", "pada", "untuk", "dari", "ke", "ini", "itu",
            "adalah", "bisa", "bagaimana", "mengapa", "apakah", "berapa", "saya", "tanya", "sesuai",
            "sisi", "dokumen", "perbedaan", "spek", "spesifikasi", "info", "informasi", "fitur",
            "detail", "tolong", "minta", "kasih", "tahu", "jelaskan", "ada", "seri", "yg",
            "beda", "bedanya", "vs", "versus", "sama", "kayak", "gimana", "kenapa", "gak", "nggak",
            "antara", "dibanding", "dibandingkan", "lebih",
        }
        words = [re.sub(r"[^\w\.]", "", w).strip() for w in cleaned_question.split()]

        def _is_meaningful_keyword(w: str) -> bool:
            if not w or w.lower() in stop_words:
                return False
            if len(w) >= 3:
                return True
            return len(w) == 2 and any(c.isdigit() for c in w)

        raw_keywords = [w for w in words if _is_meaningful_keyword(w)]
        seen_kw: set = set()
        keywords = []
        for w in raw_keywords:
            lw = w.lower()
            if lw not in seen_kw:
                seen_kw.add(lw)
                keywords.append(w)
        keywords.sort(key=lambda w: (not any(c.isdigit() for c in w), len(w)))

        extracted_pks = _extract_product_codes(cleaned_question)
        product_code_keywords = extracted_pks if extracted_pks else [w for w in keywords if any(c.isdigit() for c in w) and len(w) <= 8]
        indicator_terms = _indicator_query_terms(cleaned_question)

        if sources and product_code_keywords:
            matching_sources = [
                s for s in sources
                if any(re.search(r"\b" + re.escape(pk) + r"\b", f"{s.get('title') or ''} {s.get('content') or ''}", re.I) for pk in product_code_keywords)
            ]
            if matching_sources:
                sources = matching_sources
            else:
                logger.info(f"Vector search returned generic chunks without product codes {product_code_keywords}. Falling back to keyword search.")
                sources = []
                retrieval_methods_used.discard("vector")

        if product_code_keywords:
            existing_ids = {s.get("chunk_id") for s in sources if s.get("chunk_id")}
            for pk in product_code_keywords:
                has_pk = any(
                    re.search(r"\b" + re.escape(pk) + r"\b", f"{s.get('title') or ''} {s.get('content') or ''}", re.I)
                    for s in sources
                )
                if not has_pk:
                    logger.info(f"Product code '{pk}' missing from vector sources. Fetching targeted chunks for '{pk}'.")
                    def _build_pk_filter(b, target_pk=pk):
                        return b.or_(f"content.ilike.%{target_pk}%,title.ilike.%{target_pk}%")
                    pk_chunks = _filter_rank_keyword_chunks(_execute_chunk_select(_build_pk_filter, match_count * 4), match_count)
                    for kc in pk_chunks:
                        chunk_id = kc.get("id")
                        if chunk_id and chunk_id not in existing_ids:
                            sources.append({
                                "chunk_id": chunk_id,
                                "document_id": kc.get("document_id"),
                                "title": kc.get("title"),
                                "content": kc.get("content"),
                                "context_prefix": kc.get("context_prefix"),
                                "chunk_index": kc.get("chunk_index"),
                                "similarity": 0.85,
                            })
                            existing_ids.add(chunk_id)
                            retrieval_methods_used.add("keyword")

        t0_retrieval = time.perf_counter()
        if indicator_terms.get("is_indicator_query"):
            existing_ids = {s.get("chunk_id") for s in sources if s.get("chunk_id")}
            product_terms = list(indicator_terms.get("product_codes") or []) + list(indicator_terms.get("series") or [])
            indicator_chunks = _fetch_entity_index_chunks(indicator_terms, match_count * 4)

            keyword_indicator_chunks = _fetch_keyword_chunks(indicator_terms.get("topic_groups") or [], match_count * 8)
            if product_terms:
                product_matched = [
                    chunk for chunk in keyword_indicator_chunks
                    if _chunk_matches_any_term(chunk, product_terms)
                ]
                keyword_indicator_chunks = product_matched or keyword_indicator_chunks

            combined_indicator_chunks: List[Dict[str, Any]] = []
            seen_indicator_ids: Set[str] = set()
            for chunk in [*indicator_chunks, *keyword_indicator_chunks]:
                chunk_id = chunk.get("id") or chunk.get("chunk_id")
                if chunk_id and chunk_id not in seen_indicator_ids:
                    seen_indicator_ids.add(chunk_id)
                    combined_indicator_chunks.append(chunk)

            ranked_indicator_chunks = _filter_rank_keyword_chunks(combined_indicator_chunks, match_count * 2)
            for chunk in ranked_indicator_chunks:
                source = _to_query_source(chunk, 0.98)
                chunk_id = source.get("chunk_id")
                if chunk_id and chunk_id not in existing_ids:
                    sources.append(source)
                    existing_ids.add(chunk_id)
                    retrieval_methods_used.add("entity_index")

        if len(sources) < match_count:
            if keywords:
                existing_ids = {s.get("chunk_id") for s in sources if s.get("chunk_id")}

                def _build_t1(b):
                    for kw in keywords[:3]:
                        b = b.or_(f"content.ilike.%{kw}%,title.ilike.%{kw}%")
                    return b
                kw_chunks = _filter_rank_keyword_chunks(_execute_chunk_select(_build_t1, match_count * 4), match_count * 2)

                if not kw_chunks and len(keywords) > 1:
                    or_filter = ",".join(
                        item
                        for kw in keywords[:4]
                        for item in (f"content.ilike.%{kw}%", f"title.ilike.%{kw}%")
                    )
                    kw_chunks = _filter_rank_keyword_chunks(_execute_chunk_select(lambda b: b.or_(or_filter), match_count * 4), match_count * 2)

                if not kw_chunks and keywords:
                    keyword = keywords[0]
                    kw_chunks = _filter_rank_keyword_chunks(_execute_chunk_select(lambda b: b.or_(f"content.ilike.%{keyword}%,title.ilike.%{keyword}%"), match_count * 4), match_count)

                if kw_chunks:
                    retrieval_methods_used.add("keyword")

                for kc in kw_chunks:
                    chunk_id = kc.get("id")
                    if chunk_id and chunk_id not in existing_ids:
                        sources.append({
                            "chunk_id": chunk_id,
                            "document_id": kc.get("document_id"),
                            "title": kc.get("title"),
                            "content": kc.get("content"),
                            "context_prefix": kc.get("context_prefix"),
                            "chunk_index": kc.get("chunk_index"),
                            "similarity": 0.85,
                        })
                        existing_ids.add(chunk_id)

        t_retrieval_ms = int((time.perf_counter() - t0_retrieval) * 1000)

        if len(retrieval_methods_used) > 1:
            retrieval_method = "hybrid"
        elif "vector" in retrieval_methods_used:
            retrieval_method = "vector"
        elif "fts" in retrieval_methods_used:
            retrieval_method = "fts"
        elif "entity_index" in retrieval_methods_used:
            retrieval_method = "entity_index"
        elif "keyword" in retrieval_methods_used:
            retrieval_method = "keyword"
        else:
            retrieval_method = "unknown"

        top_similarity = float(sources[0].get("similarity") or 0) if sources else None

        if not sources:
            no_answer_text = "Knowledge base belum punya informasi yang cukup untuk menjawab pertanyaan ini."
            t_total_ms = int((time.perf_counter() - t_start) * 1000)
            logged_id = None
            try:
                from app.services.knowledge_query_log_service import KnowledgeQueryLogService
                logged_id = KnowledgeQueryLogService.log(
                    question=question,
                    cleaned_question=cleaned_question,
                    retrieval_method=retrieval_method,
                    matched_chunk_ids=[],
                    source_count=0,
                    top_similarity=None,
                    answer_text=no_answer_text,
                    embedding_latency_ms=t_embed_ms,
                    retrieval_latency_ms=t_retrieval_ms,
                    generation_latency_ms=0,
                    total_latency_ms=t_total_ms,
                    chat_model=resolve_chat_model(),
                )
            except Exception as log_exc:
                logger.warning(f"Failed to log unanswered query: {log_exc}")

            return {
                "is_empty": True,
                "query_id": logged_id,
                "sources": [],
                "matched_sources": [],
                "retrieval_method": retrieval_method,
                "top_similarity": None,
                "t_embed_ms": t_embed_ms,
                "t_retrieval_ms": t_retrieval_ms,
                "matched_chunk_ids": [],
            }

        if sources and keywords:
            def _keyword_overlap_score(s: Dict[str, Any]) -> float:
                title_lower = (s.get("title") or "").lower()
                content_lower = (s.get("content") or "").lower()
                matches = sum(1 for kw in keywords if kw.lower() in title_lower or kw.lower() in content_lower)
                title_matches = sum(1 for kw in keywords if kw.lower() in title_lower)
                exact_phrase = 1.0 if cleaned_question.lower() in title_lower or cleaned_question.lower() in content_lower else 0.0
                return matches * 10.0 + title_matches * 15.0 + exact_phrase * 20.0

            sources.sort(key=lambda s: (-_keyword_overlap_score(s), -float(s.get("similarity") or 0)))

        if sources and product_code_keywords and len(product_code_keywords) > 1:
            pk_map: Dict[str, List[Dict[str, Any]]] = {pk: [] for pk in product_code_keywords}

            for s in sources:
                content_title = f"{s.get('title') or ''} {s.get('content') or ''}"
                for pk in product_code_keywords:
                    if re.search(r"\b" + re.escape(pk) + r"\b", content_title, re.I):
                        pk_map[pk].append(s)

            per_pk_limit = max(2, match_count // len(product_code_keywords))
            total_budget = match_count * 2

            selected: Dict[str, List[Dict[str, Any]]] = {pk: [] for pk in product_code_keywords}
            seen_ids: Set[str] = set()
            for pk in product_code_keywords:
                for s in pk_map[pk]:
                    if len(selected[pk]) >= per_pk_limit:
                        break
                    cid = s.get("chunk_id")
                    if cid and cid not in seen_ids:
                        seen_ids.add(cid)
                        selected[pk].append(s)

            unused_quota = sum(per_pk_limit - len(selected[pk]) for pk in product_code_keywords)
            if unused_quota > 0:
                remaining_pool = {
                    pk: [s for s in pk_map[pk] if s.get("chunk_id") not in seen_ids]
                    for pk in product_code_keywords
                }
                progress = True
                while unused_quota > 0 and progress:
                    progress = False
                    for pk in product_code_keywords:
                        if unused_quota <= 0:
                            break
                        pool = remaining_pool.get(pk) or []
                        if pool:
                            s = pool.pop(0)
                            cid = s.get("chunk_id")
                            if cid and cid not in seen_ids:
                                seen_ids.add(cid)
                                selected[pk].append(s)
                                unused_quota -= 1
                                progress = True

            balanced_sources: List[Dict[str, Any]] = []
            max_len = max((len(v) for v in selected.values()), default=0)
            for i in range(max_len):
                for pk in product_code_keywords:
                    if i < len(selected[pk]):
                        balanced_sources.append(selected[pk][i])

            for s in sources:
                if len(balanced_sources) >= total_budget:
                    break
                cid = s.get("chunk_id")
                if cid and cid not in seen_ids:
                    seen_ids.add(cid)
                    balanced_sources.append(s)

            matched_sources = balanced_sources
        else:
            matched_sources = sources[:match_count]

        matched_chunk_ids = [str(s.get("chunk_id")) for s in matched_sources if s.get("chunk_id")]

        return {
            "is_empty": False,
            "sources": sources,
            "matched_sources": matched_sources,
            "retrieval_method": retrieval_method,
            "top_similarity": top_similarity,
            "t_embed_ms": t_embed_ms,
            "t_retrieval_ms": t_retrieval_ms,
            "matched_chunk_ids": matched_chunk_ids,
        }

    @staticmethod
    def query(question: str, match_count: int = 6) -> Dict[str, Any]:
        t_start = time.perf_counter()
        _check_and_flag_embedding_reindex_if_needed()
        cleaned_question = question.strip()
        if len(cleaned_question) < 3:
            raise HTTPException(status_code=400, detail="Pertanyaan terlalu pendek.")

        # 1. Check Semantic Query Cache (TTL 365 Days, Similarity ≥ 0.96)
        t0_embed = time.perf_counter()
        embedding: List[float] = []
        try:
            embedding = _embed_text(cleaned_question, is_query=True)
        except Exception as embed_exc:
            logger.warning(f"Failed to generate query embedding: {embed_exc}")

        if embedding and any(v != 0.0 for v in embedding):
            # 1A. Check Human-Verified Golden Answer Layer (Score 8-10 ⭐, Similarity ≥ 0.88)
            from app.services.knowledge_golden_service import KnowledgeGoldenService
            golden = KnowledgeGoldenService.get_golden_answer(embedding, similarity_threshold=0.88)
            if golden:
                t_total_ms = int((time.perf_counter() - t_start) * 1000)
                return {
                    "query_id": golden.get("golden_id"),
                    "answer": golden["answer"],
                    "sources": golden.get("sources", []),
                    "is_golden": True,
                    "golden_score": golden.get("rating_score", 10),
                    "verified_by": golden.get("verified_by", "Supervisor"),
                    "cached": True,
                    "latency_ms": t_total_ms,
                }

            # 1B. Check Semantic Query Cache (TTL 365 Days, Similarity ≥ 0.96)
            cached = KnowledgeCacheService.get_cached_query(embedding, similarity_threshold=0.96)
            if cached:
                t_total_ms = int((time.perf_counter() - t_start) * 1000)
                query_id = None
                try:
                    from app.services.knowledge_query_log_service import KnowledgeQueryLogService
                    query_id = KnowledgeQueryLogService.log(
                        question=question,
                        cleaned_question=cleaned_question,
                        retrieval_method="semantic_cache",
                        matched_chunk_ids=[s.get("chunk_id") for s in cached.get("sources", []) if s.get("chunk_id")],
                        source_count=len(cached.get("sources", [])),
                        top_similarity=cached.get("similarity", 0.98),
                        answer_text=cached.get("answer", ""),
                        embedding_latency_ms=int((time.perf_counter() - t0_embed) * 1000),
                        retrieval_latency_ms=0,
                        generation_latency_ms=0,
                        total_latency_ms=t_total_ms,
                        chat_model="semantic_cache",
                    )
                except Exception as log_exc:
                    logger.warning(f"Failed to log cached query: {log_exc}")

                return {
                    "query_id": query_id,
                    "answer": cached["answer"],
                    "sources": cached.get("sources", []),
                    "cached": True,
                }

        # 2. Cache miss: Jalankan hybrid retrieval pipeline biasa
        retrieval_res = KnowledgeService._run_retrieval_pipeline(
            question, cleaned_question, match_count, t_start, precomputed_embedding=embedding
        )
        if retrieval_res.get("is_empty"):
            return {
                "query_id": retrieval_res.get("query_id"),
                "answer": "Knowledge base belum punya informasi yang cukup untuk menjawab pertanyaan ini.",
                "sources": [],
                "cached": False,
            }

        matched_sources = retrieval_res["matched_sources"]
        t0_gen = time.perf_counter()
        answer = _generate_answer(cleaned_question, matched_sources)
        t_gen_ms = int((time.perf_counter() - t0_gen) * 1000)
        t_total_ms = int((time.perf_counter() - t_start) * 1000)

        # 3. Simpan hasil sukses ke Semantic Query Cache (TTL 365 Days)
        if embedding and answer:
            KnowledgeCacheService.set_cached_query(
                question=question,
                cleaned_question=cleaned_question,
                embedding=embedding,
                answer=answer,
                sources=matched_sources,
                ttl_days=365,
            )

        try:
            from app.services.knowledge_inconsistency_service import KnowledgeInconsistencyService
            KnowledgeInconsistencyService.extract_and_log_from_answer(cleaned_question, answer)
        except Exception as inc_exc:
            logger.warning(f"Failed auto-logging inconsistency: {inc_exc}")

        query_id = None
        try:
            from app.services.knowledge_query_log_service import KnowledgeQueryLogService
            query_id = KnowledgeQueryLogService.log(
                question=question,
                cleaned_question=cleaned_question,
                retrieval_method=retrieval_res["retrieval_method"],
                matched_chunk_ids=retrieval_res["matched_chunk_ids"],
                source_count=len(matched_sources),
                top_similarity=retrieval_res["top_similarity"],
                answer_text=answer,
                embedding_latency_ms=retrieval_res["t_embed_ms"],
                retrieval_latency_ms=retrieval_res["t_retrieval_ms"],
                generation_latency_ms=t_gen_ms,
                total_latency_ms=t_total_ms,
                chat_model=resolve_chat_model(),
            )
        except Exception as log_exc:
            logger.warning(f"Failed to log query execution: {log_exc}")

        AuditLogService.log(
            action="KNOWLEDGE_QUERY",
            resource="knowledge_chunks",
            details={"question": cleaned_question, "source_count": len(matched_sources)},
        )
        return {
            "query_id": query_id,
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
                for source in matched_sources
            ],
            "cached": False,
        }

    @staticmethod
    def query_stream(question: str, match_count: int = 6) -> Generator[str, None, None]:
        t_start = time.perf_counter()
        _check_and_flag_embedding_reindex_if_needed()
        cleaned_question = question.strip()
        if len(cleaned_question) < 3:
            err_json = json.dumps({"type": "error", "detail": "Pertanyaan terlalu pendek."})
            yield f"data: {err_json}\n\n"
            return

        # 1. Check Semantic Query Cache (TTL 365 Days, Similarity ≥ 0.96)
        t0_embed = time.perf_counter()
        embedding: List[float] = []
        try:
            embedding = _embed_text(cleaned_question, is_query=True)
        except Exception as embed_exc:
            logger.warning(f"Failed to generate query embedding: {embed_exc}")

        if embedding and any(v != 0.0 for v in embedding):
            # 1A. Check Human-Verified Golden Answer Layer (Score 8-10 ⭐, Similarity ≥ 0.88)
            from app.services.knowledge_golden_service import KnowledgeGoldenService
            golden = KnowledgeGoldenService.get_golden_answer(embedding, similarity_threshold=0.88)
            if golden:
                golden_sources = golden.get("sources", [])
                yield f"data: {json.dumps({'type': 'sources', 'sources': golden_sources, 'cached': True, 'is_golden': True, 'golden_score': golden.get('rating_score', 10), 'verified_by': golden.get('verified_by', 'Supervisor')})}\n\n"

                golden_answer = golden.get("answer", "")
                words = golden_answer.split(" ")
                for i in range(0, len(words), 8):
                    chunk_str = " ".join(words[i:i + 8]) + " "
                    yield f"data: {json.dumps({'type': 'chunk', 'text': chunk_str})}\n\n"

                yield f"data: {json.dumps({'type': 'done', 'query_id': golden.get('golden_id'), 'sources': golden_sources, 'cached': True, 'is_golden': True, 'golden_score': golden.get('rating_score', 10), 'verified_by': golden.get('verified_by', 'Supervisor')})}\n\n"
                return

            # 1B. Check Semantic Query Cache (TTL 365 Days, Similarity ≥ 0.96)
            cached = KnowledgeCacheService.get_cached_query(embedding, similarity_threshold=0.96)
            if cached:
                cached_sources = cached.get("sources", [])
                yield f"data: {json.dumps({'type': 'sources', 'sources': cached_sources, 'cached': True})}\n\n"

                # Stream cached answer in fast chunks
                cached_answer = cached.get("answer", "")
                words = cached_answer.split(" ")
                for i in range(0, len(words), 5):
                    chunk_str = " ".join(words[i:i + 5]) + " "
                    yield f"data: {json.dumps({'type': 'chunk', 'text': chunk_str})}\n\n"

                t_total_ms = int((time.perf_counter() - t_start) * 1000)
                query_id = None
                try:
                    from app.services.knowledge_query_log_service import KnowledgeQueryLogService
                    query_id = KnowledgeQueryLogService.log(
                        question=question,
                        cleaned_question=cleaned_question,
                        retrieval_method="semantic_cache",
                        matched_chunk_ids=[s.get("chunk_id") for s in cached_sources if s.get("chunk_id")],
                        source_count=len(cached_sources),
                        top_similarity=cached.get("similarity", 0.98),
                        answer_text=cached_answer,
                        embedding_latency_ms=int((time.perf_counter() - t0_embed) * 1000),
                        retrieval_latency_ms=0,
                        generation_latency_ms=0,
                        total_latency_ms=t_total_ms,
                        chat_model="semantic_cache",
                    )
                except Exception as log_exc:
                    logger.warning(f"Failed to log cached query: {log_exc}")

                yield f"data: {json.dumps({'type': 'done', 'query_id': query_id, 'sources': cached_sources, 'cached': True})}\n\n"
                return

        # 2. Cache miss: Jalankan hybrid retrieval pipeline biasa
        retrieval_res = KnowledgeService._run_retrieval_pipeline(
            question, cleaned_question, match_count, t_start, precomputed_embedding=embedding
        )
        if retrieval_res.get("is_empty"):
            no_answer_text = "Knowledge base belum punya informasi yang cukup untuk menjawab pertanyaan ini."
            yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
            yield f"data: {json.dumps({'type': 'chunk', 'text': no_answer_text})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'query_id': retrieval_res.get('query_id'), 'sources': []})}\n\n"
            return

        matched_sources = retrieval_res["matched_sources"]
        formatted_sources = [
            {
                "chunk_id": source.get("chunk_id"),
                "document_id": source.get("document_id"),
                "title": source.get("title"),
                "content": source.get("content"),
                "chunk_index": source.get("chunk_index"),
                "similarity": source.get("similarity"),
            }
            for source in matched_sources
        ]

        # Kirim sources metadata terlebih dahulu ke client
        yield f"data: {json.dumps({'type': 'sources', 'sources': formatted_sources, 'cached': False})}\n\n"

        # Stream potongan token teks dari Gemini
        t0_gen = time.perf_counter()
        streamed_chunks: List[str] = []
        for chunk in _stream_generate_answer(cleaned_question, matched_sources):
            streamed_chunks.append(chunk)
            yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"

        full_answer = "".join(streamed_chunks)
        t_gen_ms = int((time.perf_counter() - t0_gen) * 1000)
        t_total_ms = int((time.perf_counter() - t_start) * 1000)

        # Simpan ke Semantic Query Cache jika jawaban valid (TTL 365 Days)
        if embedding and full_answer:
            KnowledgeCacheService.set_cached_query(
                question=question,
                cleaned_question=cleaned_question,
                embedding=embedding,
                answer=full_answer,
                sources=matched_sources,
                ttl_days=365,
            )

        # Log Inconsistency & Query Log
        try:
            from app.services.knowledge_inconsistency_service import KnowledgeInconsistencyService
            KnowledgeInconsistencyService.extract_and_log_from_answer(cleaned_question, full_answer)
        except Exception as inc_exc:
            logger.warning(f"Failed auto-logging inconsistency in stream: {inc_exc}")

        query_id = None
        try:
            from app.services.knowledge_query_log_service import KnowledgeQueryLogService
            query_id = KnowledgeQueryLogService.log(
                question=question,
                cleaned_question=cleaned_question,
                retrieval_method=retrieval_res["retrieval_method"],
                matched_chunk_ids=retrieval_res["matched_chunk_ids"],
                source_count=len(matched_sources),
                top_similarity=retrieval_res["top_similarity"],
                answer_text=full_answer,
                embedding_latency_ms=retrieval_res["t_embed_ms"],
                retrieval_latency_ms=retrieval_res["t_retrieval_ms"],
                generation_latency_ms=t_gen_ms,
                total_latency_ms=t_total_ms,
                chat_model=resolve_chat_model(),
            )
        except Exception as log_exc:
            logger.warning(f"Failed to log stream query execution: {log_exc}")

        AuditLogService.log(
            action="KNOWLEDGE_QUERY",
            resource="knowledge_chunks",
            details={"question": cleaned_question, "source_count": len(matched_sources)},
        )

        # Kirim event selesai beserta query_id untuk feedback loop
        yield f"data: {json.dumps({'type': 'done', 'query_id': query_id, 'sources': formatted_sources, 'cached': False})}\n\n"



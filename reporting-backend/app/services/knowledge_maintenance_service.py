from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

from app.core.gemini_config import (
    DEFAULT_CHAT_MODEL,
    DEFAULT_EMBEDDING_MODEL,
    EMBEDDING_DIMENSION,
    resolve_chat_model,
    resolve_embedding_model,
)
from app.core.supabase import supabase
from app.services.knowledge_cache_service import KnowledgeCacheService
from app.services.knowledge_embedding_service import _embed_texts, _vector_literal

logger = logging.getLogger(__name__)


class KnowledgeMaintenanceService:
    @staticmethod
    def get_health_status() -> Dict[str, Any]:
        """
        Menghasilkan ringkasan diagnosa kesehatan sistem Knowledge Base & Vector Store.
        """
        try:
            # 1. Documents breakdown
            docs_res = (
                supabase.table("knowledge_documents")
                .select("id, title, status, chunk_count, needs_reindex, created_at")
                .execute()
            )
            docs = docs_res.data or []
            total_docs = len(docs)
            ready_docs = sum(1 for d in docs if d.get("status") == "ready")
            processing_docs = sum(1 for d in docs if d.get("status") == "processing")
            failed_docs = sum(1 for d in docs if d.get("status") == "failed")
            needs_reindex_docs = sum(1 for d in docs if d.get("needs_reindex") is True)

            # 2. Chunks analysis
            chunks_res = (
                supabase.table("knowledge_chunks")
                .select("id, document_id, chunk_index, token_estimate")
                .limit(2000)
                .execute()
            )
            chunks = chunks_res.data or []
            total_chunks = len(chunks)
            avg_chunks_per_doc = round(total_chunks / max(ready_docs, 1), 1)
            chunks_with_context = sum(1 for c in chunks if c.get("context_prefix"))
            total_estimated_tokens = sum(int(c.get("token_estimate") or 0) for c in chunks)

            # 3. Entities analysis
            entity_count = 0
            try:
                entities_res = (
                    supabase.table("knowledge_entities")
                    .select("id", count="exact")
                    .limit(1)
                    .execute()
                )
                entity_count = entities_res.count or 0
            except Exception as e_exc:
                logger.debug(f"Entity count lookup: {e_exc}")

            # 4. Semantic Cache analysis
            cache_count = 0
            cache_hits = 0
            try:
                cache_res = (
                    supabase.table("knowledge_semantic_cache")
                    .select("id, hit_count, expires_at")
                    .execute()
                )
                cache_items = cache_res.data or []
                cache_count = len(cache_items)
                cache_hits = sum(int(c.get("hit_count") or 1) for c in cache_items)
            except Exception as c_exc:
                logger.debug(f"Semantic cache lookup: {c_exc}")

            # 5. Inconsistency count
            inconsistency_count = 0
            try:
                inc_res = (
                    supabase.table("knowledge_inconsistency_logs")
                    .select("id", count="exact")
                    .eq("status", "unresolved")
                    .limit(1)
                    .execute()
                )
                inconsistency_count = inc_res.count or 0
            except Exception as inc_exc:
                logger.debug(f"Inconsistency lookup: {inc_exc}")

            # Overall Status Determination
            health_status = "healthy"
            warnings: List[str] = []
            if failed_docs > 0:
                warnings.append(f"{failed_docs} dokumen dalam status gagal.")
            if needs_reindex_docs > 0:
                warnings.append(f"{needs_reindex_docs} dokumen memerlukan re-index embedding.")
                health_status = "degraded"
            if total_docs > 0 and ready_docs == 0 and processing_docs == 0:
                health_status = "critical"

            return {
                "status": health_status,
                "warnings": warnings,
                "models": {
                    "chat_model": resolve_chat_model(),
                    "default_chat_model": DEFAULT_CHAT_MODEL,
                    "embedding_model": resolve_embedding_model(),
                    "default_embedding_model": DEFAULT_EMBEDDING_MODEL,
                    "embedding_dimension": EMBEDDING_DIMENSION,
                },
                "documents": {
                    "total": total_docs,
                    "ready": ready_docs,
                    "processing": processing_docs,
                    "failed": failed_docs,
                    "needs_reindex": needs_reindex_docs,
                },
                "chunks": {
                    "total_chunks": total_chunks,
                    "avg_chunks_per_doc": avg_chunks_per_doc,
                    "chunks_with_context": chunks_with_context,
                    "total_estimated_tokens": total_estimated_tokens,
                },
                "entities": {
                    "total_entities": entity_count,
                },
                "semantic_cache": {
                    "total_cached_queries": cache_count,
                    "total_cache_hits": cache_hits,
                    "ttl_days": 365,
                },
                "inconsistencies": {
                    "unresolved_count": inconsistency_count,
                },
                "checked_at": datetime.now(timezone.utc).isoformat(),
            }
        except Exception as exc:
            logger.error(f"Failed to generate health status: {exc}", exc_info=True)
            return {
                "status": "error",
                "error": str(exc),
                "checked_at": datetime.now(timezone.utc).isoformat(),
            }

    @staticmethod
    def reindex_all_embeddings(limit: int = 50) -> Dict[str, Any]:
        """
        Melakukan re-embedding seluruh dokumen 'ready' secara otomatis, memperbarui vector chunks,
        me-reset status needs_reindex, me-rebuild entity index, dan me-refresh semantic cache.
        """
        try:
            docs_res = (
                supabase.table("knowledge_documents")
                .select("id, title, status")
                .eq("status", "ready")
                .limit(limit)
                .execute()
            )
            documents = docs_res.data or []
            if not documents:
                return {
                    "success": True,
                    "message": "Tidak ada dokumen ready untuk di-reindex.",
                    "reindexed_documents": 0,
                    "reindexed_chunks": 0,
                }

            total_reindexed_chunks = 0
            processed_docs: List[Dict[str, Any]] = []

            for doc in documents:
                doc_id = doc["id"]
                doc_title = doc["title"]

                chunks_res = (
                    supabase.table("knowledge_chunks")
                    .select("id, document_id, title, content, context_prefix, chunk_index")
                    .eq("document_id", doc_id)
                    .order("chunk_index", desc=False)
                    .execute()
                )
                chunks = chunks_res.data or []
                if not chunks:
                    continue

                # Prepare texts for embedding
                texts_to_embed = [
                    f"{c.get('context_prefix')}\n\n{c.get('content')}"
                    if c.get("context_prefix")
                    else c.get("content")
                    for c in chunks
                ]

                # Generate new embeddings
                embeddings = _embed_texts(texts_to_embed, title=doc_title)

                # Batch update chunks
                for idx, c in enumerate(chunks):
                    cid = c["id"]
                    emb = embeddings[idx]
                    supabase.table("knowledge_chunks").update(
                        {"embedding": _vector_literal(emb)}
                    ).eq("id", cid).execute()

                # Flag document needs_reindex to False
                supabase.table("knowledge_documents").update(
                    {"needs_reindex": False, "chunk_count": len(chunks)}
                ).eq("id", doc_id).execute()

                total_reindexed_chunks += len(chunks)
                processed_docs.append({"document_id": doc_id, "title": doc_title, "chunks": len(chunks)})

            # Invalidate semantic cache and rebuild entities
            KnowledgeCacheService.clear_cache()

            from app.services.knowledge_service import KnowledgeService
            reindex_entity_res = KnowledgeService.reindex_entities(limit=200, dry_run=False)

            return {
                "success": True,
                "message": f"Berhasil mere-index {len(processed_docs)} dokumen ({total_reindexed_chunks} chunks).",
                "reindexed_documents": len(processed_docs),
                "reindexed_chunks": total_reindexed_chunks,
                "entities_reindexed": reindex_entity_res.get("entity_count", 0),
                "documents": processed_docs,
            }
        except Exception as exc:
            logger.error(f"Failed to reindex embeddings: {exc}", exc_info=True)
            return {"success": False, "error": str(exc)}

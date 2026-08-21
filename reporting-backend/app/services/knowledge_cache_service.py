from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

from app.core.supabase import supabase
from app.services.knowledge_embedding_service import _vector_literal

logger = logging.getLogger(__name__)

CACHE_SIMILARITY_THRESHOLD = 0.96
CACHE_TTL_DAYS = 365
NO_ANSWER_KEYWORD = "belum punya informasi yang cukup"


class KnowledgeCacheService:
    @staticmethod
    def get_cached_query(
        embedding: List[float],
        similarity_threshold: float = CACHE_SIMILARITY_THRESHOLD,
    ) -> Optional[Dict[str, Any]]:
        """
        Mencari cache jawaban berdasarkan cosine similarity vector embedding pertanyaan (≥ 0.96).
        Jika ditemukan, mengembalikan cache record dan memperbarui hit_count.
        """
        if not embedding or not any(v != 0.0 for v in embedding):
            return None

        try:
            res = (
                supabase.rpc(
                    "match_semantic_cache",
                    {
                        "query_embedding": _vector_literal(embedding),
                        "similarity_threshold": similarity_threshold,
                    },
                )
                .execute()
            )
            rows = res.data or []
            if not rows:
                return None

            hit = rows[0]
            cache_id = hit.get("cache_id") or hit.get("id")

            # Asynchronously / silently increment hit count
            if cache_id:
                try:
                    supabase.table("knowledge_semantic_cache").update(
                        {
                            "hit_count": (hit.get("hit_count") or 1) + 1,
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                        }
                    ).eq("id", cache_id).execute()
                except Exception as inc_err:
                    logger.debug(f"Failed to increment semantic cache hit count: {inc_err}")

            return {
                "cache_id": cache_id,
                "original_question": hit.get("question"),
                "answer": hit.get("answer"),
                "sources": hit.get("sources") or [],
                "similarity": float(hit.get("similarity") or 0.98),
                "cached": True,
            }
        except Exception as exc:
            logger.info(f"Semantic cache lookup unavailable or error: {exc}")
            return None

    @staticmethod
    def set_cached_query(
        question: str,
        cleaned_question: str,
        embedding: List[float],
        answer: str,
        sources: List[Dict[str, Any]],
        ttl_days: int = CACHE_TTL_DAYS,
    ) -> None:
        """
        Menyimpan hasil pertanyaan dan jawaban AI yang valid ke knowledge_semantic_cache.
        Jawaban kosong atau 'belum punya informasi yang cukup' DILARANG di-cache.
        """
        if not answer or not answer.strip():
            return
        if NO_ANSWER_KEYWORD in answer.lower():
            return
        if not embedding or not any(v != 0.0 for v in embedding):
            return

        try:
            clean_sources = [
                {
                    "chunk_id": s.get("chunk_id"),
                    "document_id": s.get("document_id"),
                    "title": s.get("title"),
                    "content": s.get("content"),
                    "chunk_index": s.get("chunk_index"),
                    "similarity": s.get("similarity"),
                }
                for s in sources
            ]

            payload = {
                "question": question.strip(),
                "cleaned_question": cleaned_question.strip(),
                "embedding": _vector_literal(embedding),
                "answer": answer.strip(),
                "sources": clean_sources,
                "hit_count": 1,
            }

            supabase.table("knowledge_semantic_cache").insert(payload).execute()
            logger.info(f"Saved query to semantic cache with {ttl_days}-day TTL: '{question[:40]}...'")
        except Exception as exc:
            logger.warning(f"Failed to insert into knowledge_semantic_cache: {exc}")

    @staticmethod
    def clear_cache() -> Dict[str, Any]:
        """
        Smart Auto-Invalidation: Membersihkan seluruh semantic cache saat dokumen di-upload, diubah, atau dihapus.
        """
        try:
            res = (
                supabase.table("knowledge_semantic_cache")
                .delete()
                .neq("id", "00000000-0000-0000-0000-000000000000")
                .execute()
            )
            deleted = len(res.data or [])
            logger.info(f"Cleared knowledge_semantic_cache ({deleted} entries purged).")
            return {"success": True, "cleared_count": deleted}
        except Exception as exc:
            logger.warning(f"Failed to clear knowledge_semantic_cache: {exc}")
            return {"success": False, "error": str(exc)}

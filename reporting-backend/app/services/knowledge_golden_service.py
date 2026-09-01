from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, List, Optional

from app.core.supabase import supabase
from app.services.knowledge_embedding_service import _embed_texts, _vector_literal

logger = logging.getLogger(__name__)

GOLDEN_SIMILARITY_THRESHOLD = 0.88
MIN_PROMOTION_SCORE = 8


def _clean_text_for_embedding(text: str) -> str:
    cleaned = re.sub(r"[\r\n\t]+", " ", text or "")
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    return cleaned.strip()


class KnowledgeGoldenService:
    @staticmethod
    def get_golden_answer(
        embedding: List[float],
        similarity_threshold: float = GOLDEN_SIMILARITY_THRESHOLD,
    ) -> Optional[Dict[str, Any]]:
        """
        Fast-Path Lookup: Checks if a matching Human-Verified Golden Answer (Score 8-10) exists.
        Returns the curated answer instantly (< 50ms) without diving into document chunks or LLM.
        """
        if not embedding or not any(v != 0.0 for v in embedding):
            return None

        try:
            res = (
                supabase.rpc(
                    "match_golden_qa",
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
            golden_id = hit.get("id")

            # Asynchronously increment usage count
            if golden_id:
                try:
                    supabase.table("knowledge_golden_qa").update(
                        {
                            "usage_count": int(hit.get("usage_count") or 0) + 1,
                            "last_used_at": datetime.now(timezone.utc).isoformat(),
                        }
                    ).eq("id", golden_id).execute()
                except Exception as inc_err:
                    logger.debug(f"Failed to increment golden QA usage count: {inc_err}")

            return {
                "golden_id": str(golden_id),
                "original_question": hit.get("question"),
                "answer": hit.get("golden_answer"),
                "rating_score": int(hit.get("rating_score") or 10),
                "verified_by": hit.get("verified_by") or "Supervisor / Agent",
                "comment": hit.get("comment"),
                "sources": hit.get("sources") or [],
                "similarity": float(hit.get("similarity") or 0.95),
                "is_golden": True,
                "cached": True,
            }
        except Exception as exc:
            logger.info(f"Golden QA lookup unavailable or fallback: {exc}")
            return None

    @staticmethod
    def promote_golden_answer(
        question: str,
        answer: str,
        rating_score: int,
        verified_by: str = "agent",
        sources: Optional[List[Dict[str, Any]]] = None,
        comment: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates user/agent feedback score (1-10).
        If score >= 8, embeds question and stores it in knowledge_golden_qa table.
        """
        q = (question or "").strip()
        a = (answer or "").strip()
        score = max(1, min(10, int(rating_score)))

        if not q or not a:
            return {"promoted": False, "reason": "Question or answer empty"}

        if score < MIN_PROMOTION_SCORE:
            return {
                "promoted": False,
                "reason": f"Score {score} is below promotion threshold ({MIN_PROMOTION_SCORE})",
                "score": score,
            }

        cleaned_q = _clean_text_for_embedding(q)

        # Generate embedding vector for the question
        embeddings = _embed_texts([cleaned_q])
        if not embeddings or not embeddings[0]:
            return {"promoted": False, "reason": "Failed to generate embedding vector"}

        embedding = embeddings[0]

        clean_sources = []
        if sources:
            for s in sources:
                clean_sources.append(
                    {
                        "chunk_id": s.get("chunk_id"),
                        "document_id": s.get("document_id"),
                        "title": s.get("title"),
                        "chunk_index": s.get("chunk_index"),
                        "similarity": s.get("similarity"),
                    }
                )

        payload = {
            "question": q,
            "cleaned_question": cleaned_q,
            "embedding": _vector_literal(embedding),
            "golden_answer": a,
            "rating_score": score,
            "verified_by": verified_by,
            "comment": comment.strip() if comment else None,
            "sources": clean_sources,
            "usage_count": 1,
            "last_used_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            res = supabase.table("knowledge_golden_qa").insert(payload).execute()
            row = res.data[0] if res.data else {}
            logger.info(f"Promoted Q&A to Golden Store with score {score}: '{q[:40]}...'")
            return {
                "promoted": True,
                "golden_id": row.get("id"),
                "rating_score": score,
                "message": f"Berhasil disimpan sebagai Jawaban Emas Terverifikasi (Skor {score}/10)!",
            }
        except Exception as exc:
            logger.error(f"Failed to insert into knowledge_golden_qa: {exc}", exc_info=True)
            return {"promoted": False, "error": str(exc)}

    @staticmethod
    def list_golden_answers(limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """
        Lists all verified golden Q&A pairs for monitoring and curation.
        """
        try:
            res = (
                supabase.table("knowledge_golden_qa")
                .select("id, question, golden_answer, rating_score, verified_by, comment, usage_count, last_used_at, created_at")
                .order("rating_score", desc=True)
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            items = res.data or []
            return {"golden_answers": items, "count": len(items)}
        except Exception as exc:
            logger.info(f"Could not list knowledge_golden_qa: {exc}")
            return {"golden_answers": [], "count": 0}

    @staticmethod
    def delete_golden_answer(golden_id: str) -> bool:
        """
        Deletes a golden QA record (Admin curation).
        """
        try:
            supabase.table("knowledge_golden_qa").delete().eq("id", golden_id).execute()
            return True
        except Exception as exc:
            logger.error(f"Failed to delete golden QA {golden_id}: {exc}")
            return False

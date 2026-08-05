import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.core.supabase import supabase

logger = logging.getLogger(__name__)

NO_ANSWER_MARKER = "belum punya informasi yang cukup"


def _days_ago_iso(days: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


class KnowledgeQueryLogService:
    @staticmethod
    def log(
        question: str,
        cleaned_question: str,
        retrieval_method: str,
        matched_chunk_ids: List[str],
        source_count: int,
        top_similarity: Optional[float],
        answer_text: str,
        embedding_latency_ms: Optional[int],
        retrieval_latency_ms: Optional[int],
        generation_latency_ms: Optional[int],
        total_latency_ms: Optional[int],
        chat_model: Optional[str],
    ) -> None:
        try:
            supabase.table("knowledge_query_logs").insert({
                "question": question,
                "cleaned_question": cleaned_question,
                "retrieval_method": retrieval_method,
                "matched_chunk_ids": matched_chunk_ids,
                "source_count": source_count,
                "top_similarity": top_similarity,
                "is_answered": NO_ANSWER_MARKER not in (answer_text or "").lower(),
                "embedding_latency_ms": embedding_latency_ms,
                "retrieval_latency_ms": retrieval_latency_ms,
                "generation_latency_ms": generation_latency_ms,
                "total_latency_ms": total_latency_ms,
                "chat_model": chat_model,
            }).execute()
        except Exception as exc:
            # Logging monitoring TIDAK BOLEH menggagalkan response ke user.
            logger.warning(f"Failed to insert knowledge_query_logs: {exc}")

    @staticmethod
    def summary(days: int = 7) -> Dict[str, Any]:
        """Agregasi metrik untuk dashboard: total query, avg latency, unanswered rate, top unanswered questions."""
        try:
            res = (
                supabase.table("knowledge_query_logs")
                .select("question, is_answered, total_latency_ms, created_at, retrieval_method")
                .gte("created_at", _days_ago_iso(days))
                .execute()
            )
        except Exception as exc:
            logger.warning(f"Failed to load knowledge_query_logs summary: {exc}")
            return {
                "total_queries": 0,
                "avg_latency_ms": None,
                "unanswered_rate": None,
                "top_unanswered": [],
                "by_retrieval_method": {},
            }

        rows = res.data or []
        total = len(rows)
        if total == 0:
            return {
                "total_queries": 0,
                "avg_latency_ms": None,
                "unanswered_rate": None,
                "top_unanswered": [],
                "by_retrieval_method": {},
            }

        latencies = [r["total_latency_ms"] for r in rows if r.get("total_latency_ms") is not None]
        unanswered = [r for r in rows if not r.get("is_answered")]

        from collections import Counter
        unanswered_counts = Counter(r["question"].strip().lower() for r in unanswered if r.get("question"))
        top_unanswered = [
            {"question": q, "count": c} for q, c in unanswered_counts.most_common(10)
        ]

        method_counts = Counter(r.get("retrieval_method", "unknown") for r in rows)

        return {
            "total_queries": total,
            "avg_latency_ms": round(sum(latencies) / len(latencies)) if latencies else None,
            "unanswered_rate": round(len(unanswered) / total, 4),
            "top_unanswered": top_unanswered,
            "by_retrieval_method": dict(method_counts),
        }

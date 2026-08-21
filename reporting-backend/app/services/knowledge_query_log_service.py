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
    ) -> Optional[str]:
        try:
            res = supabase.table("knowledge_query_logs").insert({
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
            if res.data and len(res.data) > 0:
                return str(res.data[0].get("id"))
            return None
        except Exception as exc:
            # Logging monitoring TIDAK BOLEH menggagalkan response ke user.
            logger.warning(f"Failed to insert knowledge_query_logs: {exc}")
            return None

    @staticmethod
    def submit_feedback(query_id: str, feedback_score: int, comment: Optional[str] = None) -> Dict[str, Any]:
        """Menyimpan feedback rating pengguna (+1 = thumbs up, -1 = thumbs down)."""
        if feedback_score not in (-1, 1):
            return {"success": False, "detail": "Score feedback harus 1 (positif) atau -1 (negatif)."}
        try:
            update_payload: Dict[str, Any] = {
                "feedback_score": feedback_score,
                "feedback_at": datetime.now(timezone.utc).isoformat(),
            }
            if comment is not None:
                update_payload["feedback_comment"] = comment.strip()
            res = (
                supabase.table("knowledge_query_logs")
                .update(update_payload)
                .eq("id", query_id)
                .execute()
            )
            if res.data and len(res.data) > 0:
                return {"success": True, "query_id": query_id, "feedback_score": feedback_score}
            return {"success": False, "detail": "Query log ID tidak ditemukan."}
        except Exception as exc:
            logger.warning(f"Failed to submit feedback for query {query_id}: {exc}")
            return {"success": False, "detail": str(exc)}

    @staticmethod
    def summary(days: int = 7) -> Dict[str, Any]:
        """Agregasi metrik untuk dashboard: total query, avg latency, unanswered rate, top unanswered questions, feedback stats."""
        try:
            res = (
                supabase.table("knowledge_query_logs")
                .select("question, is_answered, total_latency_ms, created_at, retrieval_method, feedback_score, feedback_comment")
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
                "feedback_stats": {
                    "total_feedbacks": 0,
                    "positive_count": 0,
                    "negative_count": 0,
                    "satisfaction_rate": None,
                },
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
                "feedback_stats": {
                    "total_feedbacks": 0,
                    "positive_count": 0,
                    "negative_count": 0,
                    "satisfaction_rate": None,
                },
            }

        latencies = [r["total_latency_ms"] for r in rows if r.get("total_latency_ms") is not None]
        unanswered = [r for r in rows if not r.get("is_answered")]

        from collections import Counter
        unanswered_counts = Counter(r["question"].strip().lower() for r in unanswered if r.get("question"))
        top_unanswered = [
            {"question": q, "count": c} for q, c in unanswered_counts.most_common(10)
        ]

        method_counts = Counter(r.get("retrieval_method", "unknown") for r in rows)

        # Feedback stats
        feedbacks = [r["feedback_score"] for r in rows if r.get("feedback_score") is not None]
        positive_count = sum(1 for f in feedbacks if f == 1)
        negative_count = sum(1 for f in feedbacks if f == -1)
        total_feedbacks = len(feedbacks)
        satisfaction_rate = round(positive_count / total_feedbacks, 4) if total_feedbacks > 0 else None

        return {
            "total_queries": total,
            "avg_latency_ms": round(sum(latencies) / len(latencies)) if latencies else None,
            "unanswered_rate": round(len(unanswered) / total, 4),
            "top_unanswered": top_unanswered,
            "by_retrieval_method": dict(method_counts),
            "feedback_stats": {
                "total_feedbacks": total_feedbacks,
                "positive_count": positive_count,
                "negative_count": negative_count,
                "satisfaction_rate": satisfaction_rate,
            },
        }

from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, List, Set

from app.core.supabase import supabase
from app.services.knowledge_embedding_service import _check_and_flag_embedding_reindex_if_needed, _embed_text, _vector_literal
from app.services.knowledge_entity_service import (
    INDICATOR_EXPANSION_GROUPS,
    INDICATOR_QUERY_RE,
    _extract_product_codes,
    _series_from_product_code,
)

logger = logging.getLogger(__name__)

TRUST_LEVEL_RANK = {
    "official": 50,
    "verified": 40,
    "internal": 30,
    "draft": 10,
    "deprecated": 0,
}


def _indicator_query_terms(question: str) -> Dict[str, Any]:
    if not INDICATOR_QUERY_RE.search(question or ""):
        return {"is_indicator_query": False, "product_codes": [], "series": [], "topic_groups": []}

    product_codes = _extract_product_codes(question)
    series: List[str] = []
    for product_code in product_codes:
        value = _series_from_product_code(product_code)
        if value and value not in series:
            series.append(value)

    return {
        "is_indicator_query": True,
        "product_codes": product_codes,
        "series": series,
        "topic_groups": INDICATOR_EXPANSION_GROUPS,
    }


def _chunk_matches_any_term(chunk: Dict[str, Any], terms: List[str]) -> bool:
    haystack = f"{chunk.get('title') or ''}\n{chunk.get('content') or ''}".lower()
    return any(term.lower() in haystack for term in terms)


def _to_query_source(chunk: Dict[str, Any], similarity: float) -> Dict[str, Any]:
    return {
        "chunk_id": chunk.get("id") or chunk.get("chunk_id"),
        "document_id": chunk.get("document_id"),
        "title": chunk.get("title"),
        "content": chunk.get("content"),
        "context_prefix": chunk.get("context_prefix"),
        "chunk_index": chunk.get("chunk_index"),
        "similarity": similarity,
    }


def _execute_chunk_select(select_builder_fn, limit: int) -> List[Dict[str, Any]]:
    try:
        builder = supabase.table("knowledge_chunks").select("id, document_id, title, content, context_prefix, chunk_index")
        return select_builder_fn(builder).limit(limit).execute().data or []
    except Exception as exc:
        if "context_prefix" in str(exc).lower():
            builder = supabase.table("knowledge_chunks").select("id, document_id, title, content, chunk_index")
            return select_builder_fn(builder).limit(limit).execute().data or []
        logger.warning(f"Knowledge chunk select failed: {exc}")
        return []


def _fetch_keyword_chunks(keyword_groups: List[List[str]], limit: int) -> List[Dict[str, Any]]:
    found: List[Dict[str, Any]] = []
    seen_ids: Set[str] = set()
    for group in keyword_groups:
        terms = [term.strip() for term in group if term and term.strip()]
        if not terms:
            continue
        def _build(builder):
            for term in terms:
                builder = builder.ilike("content", f"%{term}%")
            return builder
        for chunk in _execute_chunk_select(_build, limit):
            chunk_id = chunk.get("id")
            if chunk_id and chunk_id not in seen_ids:
                seen_ids.add(chunk_id)
                found.append(chunk)
    return found


def _fetch_entity_index_chunks(indicator_terms: Dict[str, Any], limit: int) -> List[Dict[str, Any]]:
    product_values = [
        *_extract_product_codes(" ".join(indicator_terms.get("product_codes") or [])),
        *(indicator_terms.get("series") or []),
    ]
    topic_values = ["INDICATOR_STATUS", "WIFI_STATUS", "OMNI_STATION", "ROBOT_STATUS", "CHARGING_STATUS"]

    try:
        product_chunk_ids: Set[str] = set()
        topic_chunk_ids: Set[str] = set()

        for value in product_values:
            res = (
                supabase.table("knowledge_entities")
                .select("chunk_id")
                .in_("entity_type", ["product_code", "series", "model"])
                .eq("normalized_value", value)
                .limit(limit * 4)
                .execute()
            )
            product_chunk_ids.update(row.get("chunk_id") for row in (res.data or []) if row.get("chunk_id"))

        for value in topic_values:
            res = (
                supabase.table("knowledge_entities")
                .select("chunk_id")
                .eq("entity_type", "topic")
                .eq("normalized_value", value)
                .limit(limit * 4)
                .execute()
            )
            topic_chunk_ids.update(row.get("chunk_id") for row in (res.data or []) if row.get("chunk_id"))

        candidate_ids = topic_chunk_ids
        if product_chunk_ids:
            intersected = product_chunk_ids & topic_chunk_ids
            candidate_ids = intersected or product_chunk_ids
        if not candidate_ids:
            return []

        return _execute_chunk_select(lambda b: b.in_("id", list(candidate_ids)[: limit * 4]), limit * 4)
    except Exception as exc:
        logger.info(f"Knowledge entity index lookup unavailable, using keyword expansion only: {exc}")
        return []


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        parsed = value
    else:
        try:
            parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _trust_rank(value: Any) -> int:
    return TRUST_LEVEL_RANK.get(str(value or "internal").lower(), TRUST_LEVEL_RANK["internal"])


def _is_active_knowledge_document(document: Dict[str, Any], *, now: datetime | None = None) -> bool:
    if document.get("status") != "ready":
        return False
    current_time = now or datetime.now(timezone.utc)
    effective_until = _parse_datetime(document.get("effective_until"))
    if effective_until and effective_until <= current_time:
        return False
    return True


def _filter_rank_keyword_chunks(chunks: List[Dict[str, Any]], limit: int) -> List[Dict[str, Any]]:
    if not chunks:
        return []

    document_ids = sorted({chunk.get("document_id") for chunk in chunks if chunk.get("document_id")})
    if not document_ids:
        return []

    try:
        docs_res = (
            supabase.table("knowledge_documents")
            .select("id,status,trust_level,effective_until,needs_reindex")
            .in_("id", document_ids)
            .execute()
        )
    except Exception as exc:
        if not any(column in str(exc) for column in ["trust_level", "effective_until", "needs_reindex"]):
            logger.warning(f"Failed to load knowledge document metadata for keyword filtering: {exc}")
            return []
        logger.warning(
            "Knowledge metadata columns are not available yet. "
            "Falling back to status-only retrieval filtering."
        )
        try:
            docs_res = (
                supabase.table("knowledge_documents")
                .select("id,status")
                .in_("id", document_ids)
                .execute()
            )
        except Exception as fallback_exc:
            logger.warning(f"Failed to load fallback knowledge document status: {fallback_exc}")
            return []

    now = datetime.now(timezone.utc)
    doc_meta = {
        doc.get("id"): doc
        for doc in (docs_res.data or [])
        if doc.get("id") and _is_active_knowledge_document(doc, now=now)
    }
    if not doc_meta:
        return []

    ranked_chunks = [
        chunk
        for chunk in chunks
        if chunk.get("document_id") in doc_meta
    ]
    ranked_chunks.sort(
        key=lambda chunk: (
            -_trust_rank(doc_meta.get(chunk.get("document_id"), {}).get("trust_level")),
            -float(chunk.get("similarity") or 0),
            int(chunk.get("chunk_index") or 0),
        )
    )
    return ranked_chunks[:limit]

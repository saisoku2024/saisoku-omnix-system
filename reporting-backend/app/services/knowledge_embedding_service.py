import logging
import os
from typing import List

import httpx
import numpy as np
from fastapi import HTTPException, status

from app.core.gemini_config import (
    resolve_embedding_model,
    EMBEDDING_DIMENSION,
    DEFAULT_EMBEDDING_MODEL,
    check_embedding_reindex_needed,
)
from app.core.supabase import supabase

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
_HTTPX_CLIENT = httpx.Client(
    timeout=httpx.Timeout(60.0, connect=10.0),
    limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
)

_key_index = 0


def _check_and_flag_embedding_reindex_if_needed() -> None:
    if check_embedding_reindex_needed():
        logger.warning(
            f"[EMBEDDING_MISMATCH_WARNING] Environment GEMINI_EMBEDDING_MODEL differs from DEFAULT_EMBEDDING_MODEL ({DEFAULT_EMBEDDING_MODEL}). Flagging knowledge_documents as needs_reindex=True."
        )
        try:
            supabase.table("knowledge_documents").update({"needs_reindex": True}).eq("needs_reindex", False).execute()
        except Exception as exc:
            logger.warning(f"Failed to update knowledge_documents reindex flag: {exc}")


def _get_gemini_keys() -> List[str]:
    keys_str = os.getenv("GEMINI_API_KEYS", "") or os.getenv("GEMINI_API_KEY", "")
    keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    return keys


def _gemini_api_key() -> str:
    keys = _get_gemini_keys()
    if not keys:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY is not configured",
        )
    global _key_index
    key = keys[_key_index % len(keys)]
    _key_index += 1
    return key


def _embedding_model() -> str:
    return resolve_embedding_model()


def _normalize_l2(values: List[float], expected_dim: int = EMBEDDING_DIMENSION) -> List[float]:
    if not values or len(values) != expected_dim:
        return [0.0] * expected_dim
    arr = np.array(values, dtype=np.float32)
    norm = np.linalg.norm(arr)
    if norm > 0:
        arr = arr / norm
    return arr.tolist()


def _embed_text(text: str, *, title: str | None = None, is_query: bool = False) -> List[float]:
    keys = _get_gemini_keys()
    if not keys:
        try:
            keys = [_gemini_api_key()]
        except Exception:
            keys = []
    model = _embedding_model()
    prefix = "task: search result | query: " if is_query else f"title: {title or 'none'} | text: "
    payload = {
        "content": {"parts": [{"text": f"{prefix}{text}"}]},
        "output_dimensionality": EMBEDDING_DIMENSION,
    }

    for key in keys:
        try:
            response = _HTTPX_CLIENT.post(
                f"{GEMINI_API_BASE}/models/{model}:embedContent",
                headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                json=payload,
            )
            if response.status_code == 200:
                values = response.json().get("embedding", {}).get("values")
                if isinstance(values, list) and len(values) == EMBEDDING_DIMENSION:
                    return _normalize_l2([float(v) for v in values])
            elif response.status_code == 429:
                logger.warning("Gemini embedding key hit rate limit (429). Trying next key...")
                continue
        except Exception as exc:
            logger.warning(f"Gemini embedding exception: {exc}")

    # Fallback to zero vector if embedding fails or rate limited
    logger.warning("All Gemini embedding keys failed. Returning 768-dim zero vector fallback.")
    return [0.0] * EMBEDDING_DIMENSION


def _embed_texts(texts: List[str], *, title: str | None = None) -> List[List[float]]:
    if not texts:
        return []
    keys = _get_gemini_keys()
    if not keys:
        keys = [_gemini_api_key()]
    model = _embedding_model()
    model_name = model if model.startswith("models/") else f"models/{model}"
    
    batch_size = 100
    all_embeddings = []
    
    for i in range(0, len(texts), batch_size):
        chunk_batch = texts[i : i + batch_size]
        requests_payload = []
        for text in chunk_batch:
            prefix = f"title: {title or 'none'} | text: "
            requests_payload.append({
                "model": model_name,
                "content": {"parts": [{"text": f"{prefix}{text}"}]},
                "output_dimensionality": EMBEDDING_DIMENSION,
            })
            
        payload = {"requests": requests_payload}
        response = None
        last_error = ""
        for key in keys:
            response = _HTTPX_CLIENT.post(
                f"{GEMINI_API_BASE}/models/{model}:batchEmbedContents",
                headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                json=payload,
            )
            if response.status_code == 200:
                break
            last_error = response.text[:300]
            if response.status_code == 429:
                logger.warning("Gemini batch embedding key rate limited (429). Trying next key...")
                continue
            break
        if not response or response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Gemini batch embedding request failed: {last_error}",
            )
        
        embeddings_data = response.json().get("embeddings") or []
        if len(embeddings_data) != len(chunk_batch):
            raise HTTPException(
                status_code=502,
                detail="Gemini batch embedding returned mismatching number of embeddings"
            )
            
        for emb in embeddings_data:
            values = emb.get("values")
            if not isinstance(values, list) or len(values) != EMBEDDING_DIMENSION:
                raise HTTPException(status_code=502, detail="Gemini batch embedding response is invalid")
            all_embeddings.append(_normalize_l2([float(v) for v in values]))
            
    return all_embeddings


def _vector_literal(values: List[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in values) + "]"

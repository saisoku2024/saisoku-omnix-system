"""
Konfigurasi model Gemini yang dipakai bersama oleh semua AI service
(Knowledge Base RAG, Brand Insight/QA Audit, dsb).

Kenapa file ini ada:
- Google rutin mematikan model lama (lihat https://ai.google.dev/gemini-api/docs/deprecations).
  Kalau model retired dipanggil, API langsung 404 / error.
- Sebelumnya tiap service punya daftar model sendiri-sendiri, ada yang masih
  nyantol ke model yang SUDAH MATI (gemini-1.5-flash, gemini-2.0-flash,
  text-embedding-004), dan salah satu service bahkan diam-diam MENDOWNGRADE
  model baru yang benar (gemini-3.5-flash) balik ke model mati.
- File ini jadi satu-satunya tempat untuk update kalau Google pensiunin model lagi.

Status per Agustus 2026 (cek ulang berkala di link deprecation di atas):
- MATI: gemini-1.5-flash, gemini-1.5-pro, gemini-1.5-flash-8b,
        gemini-2.0-flash, gemini-2.0-flash-001,
        gemini-2.0-flash-lite, gemini-2.0-flash-lite-001,
        text-embedding-004
- HIDUP (free tier): gemini-3.5-flash (direkomendasikan Google),
        gemini-3.1-flash-lite, gemini-2.5-flash (pensiun 16 Okt 2026, jadi
        treat sebagai fallback terakhir bukan andalan utama),
        gemini-embedding-001 (stabil), gemini-embedding-2 (terbaru, multimodal)
"""

import os
from typing import List

DEFAULT_CHAT_MODEL = "gemini-3.5-flash"
DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSION = 768

# Urutan fallback kalau model utama gagal/rate-limited. JANGAN taruh model mati di sini.
CHAT_MODEL_FALLBACK_CHAIN: List[str] = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",  # legacy tapi masih hidup sampai Okt 2026, fallback terakhir
]

# Model yang sudah dimatikan Google. Kalau env var masih nunjuk ke salah satu ini,
# kita auto-upgrade ke DEFAULT_CHAT_MODEL / DEFAULT_EMBEDDING_MODEL, bukan sebaliknya.
RETIRED_MODELS = {
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "text-embedding-004",
    "embedding-001",
    "embedding-gecko-001",
}


def resolve_chat_model() -> str:
    """Model chat/generateContent yang dipakai. Auto-upgrade kalau env var nunjuk model mati."""
    configured = os.getenv("GEMINI_MODEL", "").strip()
    if configured and configured not in RETIRED_MODELS:
        return configured
    return DEFAULT_CHAT_MODEL


def resolve_embedding_model() -> str:
    """Model embedding yang dipakai. Auto-upgrade kalau env var nunjuk model mati."""
    configured = os.getenv("GEMINI_EMBEDDING_MODEL", "").strip()
    if configured and configured not in RETIRED_MODELS:
        return configured
    return DEFAULT_EMBEDDING_MODEL


def chat_fallback_chain() -> List[str]:
    """Rantai fallback model chat, model utama di depan, tanpa duplikat, tanpa model mati."""
    primary = resolve_chat_model()
    chain = [primary] + [m for m in CHAT_MODEL_FALLBACK_CHAIN if m != primary]
    seen = set()
    deduped = [m for m in chain if not (m in seen or seen.add(m)) and m not in RETIRED_MODELS]
    return deduped

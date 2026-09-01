import logging
from typing import Any, Dict, List

import httpx

from app.core.gemini_config import chat_fallback_chain
from app.services.knowledge_embedding_service import GEMINI_API_BASE, _HTTPX_CLIENT, _get_gemini_keys, _gemini_api_key

logger = logging.getLogger(__name__)

_KB_SYSTEM_INSTRUCTION = (
    "Anda adalah AI Knowledge Base untuk SAISOKU OMNIX. "
    "Jawab dalam Bahasa Indonesia yang ringkas, rapi, dan HANYA berdasarkan konteks yang diberikan. "
    "DILARANG MENAMPILKAN CATATAN INTERNAL, VERIFIKASI BARIS/KOLOM, ATAU PROSES BERPIKIR DRAFT DI DALAM JAWABAN. "
    "PERHATIKAN DENGAN SEKSAMA VARIAN MODEL DAN NAMA DOKUMEN: "
    "Varian model seperti 'T30 MAX', 'T30C MAX OMNI', 'T30 PRO OMNI', 'T30C Prime' adalah varian yang spesifik. "
    "Jika dokumen sumber memuat varian yang cocok dengan pertanyaan pengguna (misal: 'Buku Manual dan Kartu Garansi Ecovacs T30C MAX OMNI.pdf' atau 'T30C MAX' untuk pertanyaan 't30 max'), WAJIB gunakan dokumen tersebut sebagai rujukan utama spesifikasi model yang dimaksud. "
    "DILARANG MENYATAKAN bahwa 'dokumen tidak ditemukan' atau 'knowledge base tidak memiliki dokumen T30 MAX' apabila di dalam sumber referensi jelas-jelas terdapat dokumen bernama atau membahas model tersebut (seperti Ecovacs T30C MAX OMNI). "
    "Jika pengguna meminta spesifikasi satu model tertentu (seperti 'spek t30 max'), berikan spesifikasi lengkap model tersebut dari dokumen rujukannya secara langsung. "
    "JIKA PERTANYAAN MENANYAKAN 'SERI' ATAU DAFTAR VARIAN MODEL (seperti 'seri t30', 'daftar varian t30', 'seri s5'): "
    "WAJIB sebutkan SEMUA varian model yang terdapat di dalam sumber referensi (misalnya: T30 PRO OMNI, T30C MAX OMNI, T30C PRIME, dst). "
    "Rangkum spesifikasi / poin utama dari MASING-MASING varian model tersebut secara berurutan atau gunakan Tabel Perbandingan Markdown. "
    "DILARANG BERHENTI ATAU MEMOTONG JAWABAN HANYA PADA 1 VARIAN JIKA KONTEKS SUMBER MEMUAT BEBERAPA VARIAN MODEL DARI SERI TERSEBUT. "
    "JANGAN mengubah pertanyaan menjadi perbandingan dua model lain kecuali jika pengguna secara eksplisit meminta perbandingan ('vs' atau 'perbedaan'). "
    "JIKA TERDETEKSI KETIDAK-KONSISTENAN / PERBEDAAN DATA ANTAR-DOKUMEN DI DALAM KONTEKS UNTUK MODEL YANG SAMA: "
    "WAJIB gunakan PRINSIP TRANSPARANSI dengan menyajikan: "
    "1. Menyebutkan nilai/informasi pada dokumen versi lama/terdahulu. "
    "2. Menyebutkan nilai/informasi pada dokumen versi baru/terbaru. "
    "3. Menyampaikan rekomendasi rujukan utama secara tegas berdasarkan publikasi dokumen yang paling baru. "
    "Jika pertanyaan berupa PERBANDINGAN / PERBEDAAAN (seperti 'beda X dan Y', 'vs', 'perbandingan'), WAJIB sajikan dengan: "
    "1. Tabel Markdown perbandingan fitur yang berbeda (Wajib berikan baris kosong sebelum dan sesudah tabel, serta dipisahkan newline tegas per baris). "
    "2. Poin-poin persamaan fitur. "
    "3. Ringkasan kesimpulan singkat. "
    "Jika pertanyaan membahas LAMPU INDIKATOR / STATUS LAMPU / WI-FI / OMNI STATION, WAJIB kelompokkan jawaban berdasarkan bagian yang tersedia di konteks: "
    "1. Lampu Indikator pada Robot. "
    "2. Lampu Indikator pada OMNI Station atau dok. "
    "3. Indikator Status Wi-Fi. "
    "Jika salah satu bagian tidak tersedia di konteks, sebutkan singkat bahwa bagian itu belum ditemukan di knowledge base. "
    "Untuk pertanyaan spesifikasi produk atau informasi umum, sajikan poin spesifikasi secara terstruktur lalu AKHIRI DENGAN '📌 Ringkasan Keunggulan / Kesimpulan' singkat di bagian bawah. "
    "Jika konteks tidak cukup untuk menjawab, katakan dengan jelas bahwa knowledge base belum punya "
    "informasi yang cukup, jangan menebak atau mengarang."
)


import re


def _format_markdown_tables(raw: str) -> str:
    if not raw:
        return ""
    text = raw
    text = re.sub(r"\|\s*\|", "|\n|", text)
    text = re.sub(r"(\|(?::?---+:?\|)+)\s*\|", r"\1\n|", text)
    text = re.sub(r"([^\n])\s*\n\s*(\|(?:\s*[^|\n]+\s*\|)+)", r"\1\n\n\2", text)
    text = re.sub(r"(\|(?:\s*[^|\n]+\s*\|)+)\s*\n\s*([^|\n\s])", r"\1\n\n\2", text)
    return text.strip()


def _generate_answer(question: str, sources: List[Dict[str, Any]]) -> str:
    context_blocks = []
    for idx, source in enumerate(sources):
        ctx_prefix = source.get("context_prefix")
        body = f"Konteks Posisi: {ctx_prefix}\n{source['content']}" if ctx_prefix else source['content']
        context_blocks.append(f"[Source {idx + 1}: {source['title']}]\n{body}")
    context = "\n\n".join(context_blocks)
    prompt = f"KONTEKS:\n{context}\n\nPERTANYAAN:\n{question}"

    keys = _get_gemini_keys()
    if not keys:
        try:
            keys = [_gemini_api_key()]
        except Exception:
            keys = []
    candidate_models = chat_fallback_chain()

    for m in candidate_models:
        for key in keys:
            try:
                response = _HTTPX_CLIENT.post(
                    f"{GEMINI_API_BASE}/models/{m}:generateContent",
                    headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                    json={
                        "systemInstruction": {"parts": [{"text": _KB_SYSTEM_INSTRUCTION}]},
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.2,
                            "topP": 0.95,
                            "topK": 40,
                            "maxOutputTokens": 3500,
                        },
                    },
                )
                if response.status_code == 200:
                    candidates = response.json().get("candidates") or []
                    if candidates:
                        content = candidates[0].get("content", {})
                        parts = content.get("parts") or []
                        final_parts = [p for p in parts if not p.get("thought") and not p.get("thoughtSignature")]
                        if not final_parts:
                            final_parts = [p for p in parts if not p.get("thought")]
                        if not final_parts and parts:
                            final_parts = [parts[-1]]
                        text = "\n".join(str(part.get("text", "")) for part in final_parts if part.get("text"))
                        if text.strip():
                            return _format_markdown_tables(text)
                elif response.status_code == 429:
                    logger.warning(f"Gemini API key ({key[:6]}...) rate limited on {m}. Trying next key...")
                    continue
                else:
                    logger.warning(f"Gemini model {m} call failed HTTP {response.status_code}: {response.text[:150]}")
            except Exception as exc:
                logger.warning(f"Gemini LLM request failed for model {m}: {exc}")

    return "AI penyusun jawaban sedang tidak tersedia. Silakan coba lagi beberapa saat lagi."

import json
from typing import Generator

def _stream_generate_answer(question: str, sources: List[Dict[str, Any]]) -> Generator[str, None, None]:
    """
    Generator streaming yang memanggil Gemini streamGenerateContent?alt=sse
    dan menghasilkan potongan token teks secara real-time.
    """
    context_blocks = []
    for idx, source in enumerate(sources):
        ctx_prefix = source.get("context_prefix")
        body = f"Konteks Posisi: {ctx_prefix}\n{source['content']}" if ctx_prefix else source['content']
        context_blocks.append(f"[Source {idx + 1}: {source['title']}]\n{body}")
    context = "\n\n".join(context_blocks)
    prompt = f"KONTEKS:\n{context}\n\nPERTANYAAN:\n{question}"

    keys = _get_gemini_keys()
    if not keys:
        try:
            keys = [_gemini_api_key()]
        except Exception:
            keys = []
    candidate_models = chat_fallback_chain()

    for m in candidate_models:
        for key in keys:
            try:
                url = f"{GEMINI_API_BASE}/models/{m}:streamGenerateContent?alt=sse"
                headers = {"x-goog-api-key": key, "Content-Type": "application/json"}
                payload = {
                    "systemInstruction": {"parts": [{"text": _KB_SYSTEM_INSTRUCTION}]},
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "topP": 0.95,
                        "topK": 40,
                        "maxOutputTokens": 3500,
                    },
                }
                with _HTTPX_CLIENT.stream("POST", url, headers=headers, json=payload, timeout=60.0) as response:
                    if response.status_code == 200:
                        streamed_any = False
                        for line in response.iter_lines():
                            if not line:
                                continue
                            line_str = line.strip()
                            if line_str.startswith("data:"):
                                raw_json = line_str[5:].strip()
                                if not raw_json or raw_json == "[DONE]":
                                    continue
                                try:
                                    chunk_data = json.loads(raw_json)
                                    candidates = chunk_data.get("candidates") or []
                                    if candidates:
                                        content = candidates[0].get("content", {})
                                        parts = content.get("parts") or []
                                        for part in parts:
                                            if not part.get("thought") and not part.get("thoughtSignature"):
                                                chunk_text = part.get("text", "")
                                                if chunk_text:
                                                    streamed_any = True
                                                    yield chunk_text
                                except Exception as parse_err:
                                    logger.debug(f"SSE JSON parse chunk err: {parse_err}")
                        if streamed_any:
                            return
                    elif response.status_code == 429:
                        logger.warning(f"Gemini streaming API key ({key[:6]}...) rate limited on {m}. Trying next...")
                        continue
                    else:
                        logger.warning(f"Gemini stream model {m} failed HTTP {response.status_code}")
            except Exception as exc:
                logger.warning(f"Gemini streaming request failed for model {m}: {exc}")

    # Fallback jika stream gagal
    yield "Saya menemukan sumber Knowledge Base yang relevan, tetapi AI penyusun jawaban sedang tidak tersedia. Silakan coba lagi beberapa saat lagi."


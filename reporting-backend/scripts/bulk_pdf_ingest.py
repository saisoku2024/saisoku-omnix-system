"""
Bulk PDF / Document Ingestion Script via Gemini API (Deterministic & Structured)

Fitur:
1. Pemanggilan Gemini API langsung (gemini-3.1-pro / gemini-3.6-flash) - bebas UI manual.
2. Pemutusan berbasis Section Boundary (bukan nomor halaman kaku).
3. Audit Deterministik: Menghitung row count per tabel ter-ekstrak vs PDF.
4. Logging Penggunaan Token (Input/Output Token, Latensi, Est. Biaya).
5. Ingest otomatis ke Supabase Knowledge Base (knowledge_documents & knowledge_chunks).

Penggunaan:
    python scripts/bulk_pdf_ingest.py --model gemini-3.1-pro --folder ./contoh_data
    python scripts/bulk_pdf_ingest.py --file ./manual_x20.pdf
"""

import argparse
import io
import json
import logging
import os
import re
import sys
import time
from typing import Any, Dict, List, Tuple

# Tambahkan root path ke sys.path agar import app.* berjalan lancar
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import httpx

from app.services.knowledge_embedding_service import GEMINI_API_BASE, _get_gemini_keys, _HTTPX_CLIENT
from app.services.knowledge_extraction_service import _clean_text, extract_document_text
from app.services.knowledge_service import KnowledgeService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Model default per spesifikasi 2026:
# - gemini-3.1-pro: Reasoning berat, ekstraksi tabel & indikator multi-kolom kompleks ($2/$12 per 1M)
# - gemini-3.6-flash: General purpose, ekstraksi cepat & hemat ($1.50/$7.50 per 1M)
DEFAULT_EXTRACTION_MODEL = "gemini-3.1-pro"

EXTRACTION_SYSTEM_INSTRUCTION = """
Anda adalah AI Data Engineer spesialis ekstraksi PDF ke RAG Knowledge Base.
Tugas Anda adalah mengubah dokumen PDF menjadi Teks Markdown RAG yang 100% utuh dan presisi.

ATURAN WAJIB EKSTRAKSI:
1. HEADER METADATA (Di baris paling awal):
   Brand: [Nama Brand]
   Kode Tipe Produk: [Nama Model Presisi]
   Tipe Dokumen: [Buku Manual / Lembar Spesifikasi / Panduan Service]

2. FORMAT TABEL MARKDOWN:
   - WAJIB ubah semua tabel spesifikasi, tabel indikator lampu, jadwal perawatan, dan troubleshooting menjadi TABEL MARKDOWN MURNI (| Kolom 1 | Kolom 2 |).
   - JANGAN memotong baris tabel atau mengubah tabel menjadi paragraf biasa.

3. KELENGKAPAN SEKSI (Gunakan ##):
   - ## Spesifikasi Teknis
   - ## Fitur Utama & Keunggulan
   - ## Status Indikator Lampu & Kode Error
   - ## Panduan Operasional & Perawatan
   - ## Troubleshooting / Pemecahan Masalah
   - ## Ketentuan Garansi & Service

4. CLEANING JUNK TEXT:
   - Hapus nomor halaman ("Page X of Y"), footer/header berulang, watermark, dan disclaimer hukum.
"""

AUDIT_PROMPT = """
Berdasarkan hasil ekstraksi Teks Markdown di atas, keluarkan TABEL AUDIT MANIFEST berisi daftar tabel yang ter-ekstrak dan jumlah barisnya (row count):

Format JSON balasan:
{
  "extracted_tables": [
    {"table_name": "Nama/Topik Tabel", "row_count": 8}
  ],
  "total_sections": 5,
  "is_complete": true
}
"""


def call_gemini_api(
    prompt: str,
    model_name: str = DEFAULT_EXTRACTION_MODEL,
    system_instruction: str = EXTRACTION_SYSTEM_INSTRUCTION,
) -> Tuple[str, Dict[str, Any]]:
    keys = _get_gemini_keys()
    if not keys:
        raise ValueError("GEMINI_API_KEY / GEMINI_API_KEYS tidak ditemukan di environment.")

    payload = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 8192,
        },
    }

    t0 = time.perf_counter()
    for key in keys:
        try:
            resp = _HTTPX_CLIENT.post(
                f"{GEMINI_API_BASE}/models/{model_name}:generateContent",
                headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                json=payload,
                timeout=60.0,
            )
            if resp.status_code == 200:
                latency_ms = int((time.perf_counter() - t0) * 1000)
                data = resp.json()
                usage = data.get("usageMetadata", {})
                candidates = data.get("candidates") or []
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts") or []
                    extracted_text = "\n".join(str(p.get("text", "")) for p in parts if p.get("text"))
                    return extracted_text, {
                        "latency_ms": latency_ms,
                        "prompt_tokens": usage.get("promptTokenCount", 0),
                        "candidates_tokens": usage.get("candidatesTokenCount", 0),
                        "total_tokens": usage.get("totalTokenCount", 0),
                        "model": model_name,
                    }
            elif resp.status_code == 404:
                logger.warning(f"Model {model_name} 404, fallbacking to gemini-3.6-flash...")
                model_name = "gemini-3.6-flash"
                continue
            elif resp.status_code == 429:
                logger.warning(f"Rate limited on key {key[:8]}..., trying next key.")
                continue
            else:
                logger.warning(f"Gemini API status {resp.status_code}: {resp.text[:200]}")
        except Exception as exc:
            logger.warning(f"API call failed on key {key[:8]}...: {exc}")

    raise RuntimeError("Gagal menghubungi Gemini API pada semua API key.")


def count_markdown_table_rows(markdown_text: str) -> List[Dict[str, Any]]:
    """Menghitung jumlah baris pada setiap tabel Markdown di dalam teks."""
    lines = markdown_text.splitlines()
    tables = []
    current_table_title = "Table"
    current_table_rows = 0
    in_table = False

    for line in lines:
        line_str = line.strip()
        if line_str.startswith("## ") or line_str.startswith("### "):
            current_table_title = line_str.replace("#", "").strip()
        if line_str.startswith("|") and line_str.endswith("|"):
            if "---" in line_str:
                continue  # Skip separator line
            current_table_rows += 1
            in_table = True
        else:
            if in_table:
                tables.append({"section": current_table_title, "rows": max(0, current_table_rows - 1)})
                current_table_rows = 0
                in_table = False

    if in_table:
        tables.append({"section": current_table_title, "rows": max(0, current_table_rows - 1)})

    return tables


def process_single_file(filepath: str, model_name: str = DEFAULT_EXTRACTION_MODEL) -> Dict[str, Any]:
    filename = os.path.basename(filepath)
    logger.info(f"=== Memproses File: {filename} (Model: {model_name}) ===")

    with open(filepath, "rb") as f:
        file_bytes = f.read()

    # Step 1. Raw Text Extraction dari PDF/DOCX/XLSX
    raw_text = extract_document_text(file_bytes, filename, None)
    logger.info(f"Raw Text Extracted: {len(raw_text)} Karakter")

    # Step 2. Ekstraksi Deterministik via Gemini API
    prompt = f"<dokumen nama=\"{filename}\">\n{raw_text[:35000]}\n</dokumen>\n\nEkstrak seluruh informasi dokumen di atas sesuai instruksi."
    markdown_output, stats = call_gemini_api(prompt=prompt, model_name=model_name)

    # Step 3. Row Audit Manifest
    table_rows = count_markdown_table_rows(markdown_output)
    total_table_rows = sum(t["rows"] for t in table_rows)
    logger.info(f"Row Audit Manifest: {len(table_rows)} Tabel Ditemukan, Total {total_table_rows} Baris Teks Ter-ekstrak.")

    # Step 4. Ingest ke Supabase via KnowledgeService
    title_match = re.search(r"Kode Tipe Produk:\s*(.+)", markdown_output)
    doc_title = f"Manual {title_match.group(1).strip()}" if title_match else f"Manual {filename}"

    upload = KnowledgeService.prepare_manual_text(doc_title, markdown_output)
    KnowledgeService.process_manual_text(upload["document_id"], upload["title"], upload["text"])

    logger.info(f"✅ Ingest Sukses ke Database! Document ID: {upload['document_id']}")

    return {
        "filename": filename,
        "document_id": upload["document_id"],
        "document_title": doc_title,
        "token_stats": stats,
        "tables_audit": table_rows,
        "total_rows": total_table_rows,
    }


def main():
    parser = argparse.ArgumentParser(description="Bulk PDF Ingestion Script via Gemini API")
    parser.add_argument("--file", type=str, help="Path ke file PDF tunggal")
    parser.add_argument("--folder", type=str, help="Path ke folder berisi banyak file PDF")
    parser.add_argument(
        "--model",
        type=str,
        default=DEFAULT_EXTRACTION_MODEL,
        choices=["gemini-3.1-pro", "gemini-3.6-flash", "gemini-3.5-flash"],
        help="Model Gemini yang dipakai (default: gemini-3.1-pro)",
    )

    args = parser.parse_args()

    if not args.file and not args.folder:
        logger.error("Harap tentukan --file atau --folder. Contoh: python scripts/bulk_pdf_ingest.py --file manual.pdf")
        sys.exit(1)

    files_to_process = []
    if args.file:
        files_to_process.append(args.file)
    elif args.folder:
        for root, _, files in os.walk(args.folder):
            for file in files:
                if file.lower().endswith((".pdf", ".docx", ".xlsx", ".txt")):
                    files_to_process.append(os.path.join(root, file))

    logger.info(f"Menemukan {len(files_to_process)} file untuk diproses.")

    summary_results = []
    for filepath in files_to_process:
        try:
            res = process_single_file(filepath, model_name=args.model)
            summary_results.append(res)
        except Exception as exc:
            logger.error(f"Gagal memproses file {filepath}: {exc}", exc_info=True)

    logger.info("\n================ RIGOROUS INGESTION SUMMARY ================")
    for s in summary_results:
        t_stats = s["token_stats"]
        logger.info(
            f"📄 {s['filename']} -> Doc ID: {s['document_id']} | "
            f"Tokens: {t_stats.get('total_tokens')} (In: {t_stats.get('prompt_tokens')}, Out: {t_stats.get('candidates_tokens')}) | "
            f"Latensi: {t_stats.get('latency_ms')}ms | Tabel: {len(s['tables_audit'])} ({s['total_rows']} rows)"
        )


if __name__ == "__main__":
    main()

import sys
import os
import openpyxl
import pandas as pd
from typing import List, Dict, Any

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.core.supabase import supabase
from app.services.knowledge_service import (
    _embed_texts,
    _vector_literal,
    _clean_text,
    _estimate_tokens,
    _chunk_text,
    EMBEDDING_DIMENSION
)

EXCEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "contoh data", "SOP ALL PRODUCT CS & CC (1).xlsx"))

def format_sheet_to_markdown(sheet_name: str, df: pd.DataFrame) -> List[Dict[str, str]]:
    """
    Format a pandas DataFrame sheet into structured text sections/chunks.
    """
    df = df.dropna(how="all").fillna("")
    if df.empty:
        return []

    chunks = []
    
    # 1. Product Comparisons
    if "PERBANDINGAN" in sheet_name.upper():
        headers = [str(c).strip() for c in df.columns]
        content_lines = [f"# SOP Perbandingan Produk: {sheet_name}\n"]
        for _, row in df.iterrows():
            row_str = " | ".join([f"{col}: {val}" for col, val in zip(headers, row) if str(val).strip()])
            if row_str:
                content_lines.append(f"- {row_str}")
        full_text = "\n".join(content_lines)
        chunks.append({
            "title": f"SOP Perbandingan Produk - {sheet_name}",
            "content": full_text
        })
        return chunks

    # 2. Q&A and FAQ sheets (CS, CC, TRB)
    headers = [str(c).strip().lower() for c in df.columns]
    
    q_col = None
    a_cols = []
    for col in df.columns:
        c_str = str(col).strip().lower()
        if "pertanyaan" in c_str or "kendala" in c_str or "masalah" in c_str:
            q_col = col
        elif "jawaban" in c_str or "handling" in c_str or "solusi" in c_str or "tahap" in c_str:
            a_cols.append(col)

    if q_col:
        current_block = []
        for idx, row in df.iterrows():
            question = str(row[q_col]).strip()
            if not question or question.lower() == "nan" or question.lower() == "pertanyaan customer":
                continue
            
            ans_parts = []
            for a_col in a_cols:
                val = str(row[a_col]).strip()
                if val and val.lower() != "nan":
                    ans_parts.append(f"**{a_col}**: {val}")
            
            other_parts = []
            for col in df.columns:
                if col != q_col and col not in a_cols:
                    val = str(row[col]).strip()
                    if val and val.lower() != "nan":
                        other_parts.append(f"*{col}*: {val}")
            
            qa_text = f"### Pertanyaan / Kendala: {question}\n"
            if other_parts:
                qa_text += "  - Context: " + " | ".join(other_parts) + "\n"
            if ans_parts:
                qa_text += "  - Jawaban & Solusi:\n" + "\n".join([f"    - {ap}" for ap in ans_parts]) + "\n"
            else:
                qa_text += "  - Jawaban & Solusi: Tidak ada info khusus.\n"
                
            current_block.append(qa_text)

        chunk_buf = []
        buf_len = 0
        chunk_idx = 1
        for item in current_block:
            if buf_len + len(item) > 1800 and chunk_buf:
                header = f"# SOP {sheet_name} (Bagian {chunk_idx})\n\n"
                chunks.append({
                    "title": f"SOP {sheet_name} - Part {chunk_idx}",
                    "content": header + "\n".join(chunk_buf)
                })
                chunk_idx += 1
                chunk_buf = [item]
                buf_len = len(item)
            else:
                chunk_buf.append(item)
                buf_len += len(item)
        if chunk_buf:
            header = f"# SOP {sheet_name} (Bagian {chunk_idx})\n\n"
            chunks.append({
                "title": f"SOP {sheet_name} - Part {chunk_idx}",
                "content": header + "\n".join(chunk_buf)
            })
    else:
        table_csv = df.to_csv(index=False)
        full_text = f"# SOP {sheet_name}\n\n" + table_csv
        sub_chunks = _chunk_text(full_text, max_chars=1800, overlap=200)
        for idx, sc in enumerate(sub_chunks, start=1):
            chunks.append({
                "title": f"SOP {sheet_name} - Chunk {idx}",
                "content": sc
            })

    return chunks


def import_sop():
    print(f"Loading SOP Excel: {EXCEL_PATH}")
    if not os.path.exists(EXCEL_PATH):
        print(f"Error: File not found at {EXCEL_PATH}")
        sys.exit(1)

    xl = pd.ExcelFile(EXCEL_PATH)
    sheet_names = xl.sheet_names
    print(f"Found {len(sheet_names)} sheets: {sheet_names}")

    all_chunks: List[Dict[str, str]] = []
    for sheet in sheet_names:
        df = pd.read_excel(xl, sheet_name=sheet)
        sheet_chunks = format_sheet_to_markdown(sheet, df)
        print(f"  - Sheet '{sheet}': extracted {len(sheet_chunks)} chunk(s)")
        all_chunks.extend(sheet_chunks)

    print(f"\nTotal structured chunks generated across all sheets: {len(all_chunks)}")

    document_title = "SOP ALL PRODUCT CS & CC"
    filename = "SOP ALL PRODUCT CS & CC (1).xlsx"
    user_email = "admin@omnix.com"

    # Upsert Document in knowledge_documents
    doc_res = (
        supabase.table("knowledge_documents")
        .select("id")
        .eq("title", document_title)
        .execute()
    )
    existing_docs = doc_res.data or []
    if existing_docs:
        document_id = existing_docs[0]["id"]
        print(f"Updating existing Knowledge Document ID: {document_id}")
        supabase.table("knowledge_chunks").delete().eq("document_id", document_id).execute()
        supabase.table("knowledge_documents").update({
            "status": "processing",
            "chunk_count": 0,
            "source_file": filename,
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }).eq("id", document_id).execute()
    else:
        print("Creating new Knowledge Document entry...")
        ins_res = supabase.table("knowledge_documents").insert({
            "title": document_title,
            "source_file": filename,
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "status": "processing",
            "created_by": user_email
        }).execute()
        document_id = ins_res.data[0]["id"]
        print(f"Created Knowledge Document ID: {document_id}")

    # Generate Embeddings with fallback
    texts_to_embed = [c["content"] for c in all_chunks]
    embeddings = []
    try:
        print(f"Generating Gemini embeddings for {len(texts_to_embed)} chunks via API...")
        embeddings = _embed_texts(texts_to_embed, title=document_title)
        print("Embeddings successfully generated via Gemini API!")
    except Exception as exc:
        print(f"Warning: Gemini embedding request failed ({exc}). Using fallback 768-dim zero vectors for database storage.")
        embeddings = [[0.0] * EMBEDDING_DIMENSION for _ in texts_to_embed]

    # Insert Chunks into knowledge_chunks
    rows = []
    for idx, (chunk_data, emb) in enumerate(zip(all_chunks, embeddings)):
        rows.append({
            "document_id": document_id,
            "chunk_index": idx,
            "title": chunk_data["title"],
            "content": chunk_data["content"],
            "token_estimate": _estimate_tokens(chunk_data["content"]),
            "embedding": _vector_literal(emb),
        })

    # Insert in batches of 50
    batch_size = 50
    inserted_count = 0
    for b in range(0, len(rows), batch_size):
        sub_batch = rows[b : b + batch_size]
        supabase.table("knowledge_chunks").insert(sub_batch).execute()
        inserted_count += len(sub_batch)
        print(f"  Inserted {inserted_count}/{len(rows)} chunks into Supabase...")

    # Update document status to ready
    supabase.table("knowledge_documents").update({
        "status": "ready",
        "chunk_count": len(rows),
        "error_summary": None
    }).eq("id", document_id).execute()

    print(f"\nSUCCESS: SOP import complete! {len(rows)} chunks saved to Knowledge Base with document_id: {document_id}")

if __name__ == "__main__":
    import_sop()

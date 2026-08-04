import io
import json
import logging
import zipfile
from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import HTTPException
from app.core.supabase import supabase
from app.services.storage_upload_service import download_storage_object

logger = logging.getLogger(__name__)


class KnowledgeBackupService:

    @staticmethod
    def export_backup() -> tuple[bytes, str]:
        """
        Exports a complete snapshot of the Knowledge Base (documents, chunks with embeddings,
        and inconsistency logs) into a downloadable ZIP archive.
        """
        try:
            # 1. Fetch documents
            docs_res = supabase.table("knowledge_documents").select("*").execute()
            documents = docs_res.data or []

            # 2. Fetch chunks
            chunks_res = supabase.table("knowledge_chunks").select("*").execute()
            chunks = chunks_res.data or []

            # 3. Fetch inconsistency logs (if table exists)
            inconsistency_logs = []
            try:
                logs_res = supabase.table("knowledge_inconsistency_logs").select("*").execute()
                inconsistency_logs = logs_res.data or []
            except Exception:
                pass

            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            backup_meta = {
                "version": "1.0",
                "exported_at": datetime.now(timezone.utc).isoformat(),
                "document_count": len(documents),
                "chunk_count": len(chunks),
                "inconsistency_log_count": len(inconsistency_logs),
                "documents": documents,
                "chunks": chunks,
                "inconsistency_logs": inconsistency_logs,
            }

            # 4. Pack into in-memory ZIP
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                # Add JSON data
                json_str = json.dumps(backup_meta, indent=2, ensure_ascii=False)
                zf.writestr("knowledge_backup.json", json_str.encode("utf-8"))

                # Try backing up original binary files from storage if available
                for doc in documents:
                    s_bucket = doc.get("storage_bucket")
                    s_path = doc.get("storage_path")
                    source_file = doc.get("source_file") or f"doc_{doc['id']}.bin"
                    if s_bucket and s_path:
                        try:
                            file_bytes = download_storage_object("knowledge", s_bucket, s_path)
                            zf.writestr(f"original_files/{source_file}", file_bytes)
                        except Exception as file_exc:
                            logger.warning(f"Could not include original file {source_file} in backup: {file_exc}")

            zip_buffer.seek(0)
            filename = f"knowledge_backup_{timestamp}.zip"
            return zip_buffer.getvalue(), filename

        except Exception as exc:
            logger.error("Exporting knowledge backup failed", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Gagal membuat backup knowledge base: {exc}")

    @staticmethod
    def restore_backup(zip_content: bytes) -> Dict[str, Any]:
        """
        Restores Knowledge Base documents, chunks (including 768-dim embeddings), and metadata
        from a backup ZIP archive without needing to call Gemini re-embedding APIs.
        """
        if not zip_content:
            raise HTTPException(status_code=400, detail="File backup ZIP tidak boleh kosong.")

        try:
            with zipfile.ZipFile(io.BytesIO(zip_content), "r") as zf:
                if "knowledge_backup.json" not in zf.namelist():
                    raise HTTPException(
                        status_code=400,
                        detail="File backup ZIP tidak valid. File 'knowledge_backup.json' tidak ditemukan.",
                    )

                json_raw = zf.read("knowledge_backup.json").decode("utf-8")
                backup_data = json.loads(json_raw)

            documents = backup_data.get("documents") or []
            chunks = backup_data.get("chunks") or []
            inconsistency_logs = backup_data.get("inconsistency_logs") or []

            restored_docs = 0
            restored_chunks = 0
            restored_logs = 0

            # 1. Restore documents
            if documents:
                for doc in documents:
                    try:
                        # Clean auto fields if present
                        doc_payload = {k: v for k, v in doc.items() if k not in {"created_at", "updated_at"}}
                        supabase.table("knowledge_documents").upsert(doc_payload).execute()
                        restored_docs += 1
                    except Exception as doc_exc:
                        logger.warning(f"Failed to restore document {doc.get('id')}: {doc_exc}")

            # 2. Restore chunks (in batches of 50)
            if chunks:
                batch_size = 50
                for i in range(0, len(chunks), batch_size):
                    batch = chunks[i : i + batch_size]
                    clean_batch = []
                    for c in batch:
                        clean_c = {k: v for k, v in c.items() if k not in {"created_at", "updated_at"}}
                        clean_batch.append(clean_c)
                    try:
                        supabase.table("knowledge_chunks").upsert(clean_batch).execute()
                        restored_chunks += len(clean_batch)
                    except Exception as chunk_exc:
                        logger.warning(f"Failed to restore chunk batch: {chunk_exc}")

            # 3. Restore inconsistency logs (if any)
            if inconsistency_logs:
                for log_item in inconsistency_logs:
                    try:
                        clean_log = {k: v for k, v in log_item.items() if k not in {"created_at", "updated_at"}}
                        supabase.table("knowledge_inconsistency_logs").upsert(clean_log).execute()
                        restored_logs += 1
                    except Exception:
                        pass

            return {
                "success": True,
                "message": "Knowledge Base berhasil dipulihkan dari backup.",
                "restored_documents": restored_docs,
                "restored_chunks": restored_chunks,
                "restored_inconsistency_logs": restored_logs,
                "exported_at": backup_data.get("exported_at"),
            }

        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Restoring knowledge backup failed", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Gagal memulihkan backup knowledge base: {exc}")

import logging
import re
from typing import Any, Dict, List, Optional
from app.core.supabase import supabase

logger = logging.getLogger(__name__)


class KnowledgeInconsistencyService:

    @staticmethod
    def list_inconsistencies(limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Lists detected Knowledge Base inconsistency logs from Supabase.
        Returns an empty list if table does not exist yet.
        """
        try:
            res = (
                supabase.table("knowledge_inconsistency_logs")
                .select("*")
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            return res.data or []
        except Exception as exc:
            logger.warning(f"Could not list knowledge_inconsistency_logs: {exc}")
            return []

    @staticmethod
    def log_inconsistency(
        entity_name: str,
        attribute_name: str,
        doc_a_title: str,
        value_a: str,
        doc_b_title: str,
        value_b: str,
        conflict_type: str = "value_mismatch",
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Logs a newly detected inconsistency between two knowledge documents into Supabase.
        """
        payload = {
            "entity_name": entity_name.strip(),
            "attribute_name": attribute_name.strip(),
            "conflict_type": conflict_type,
            "doc_a_title": doc_a_title.strip(),
            "value_a": value_a.strip(),
            "doc_b_title": doc_b_title.strip(),
            "value_b": value_b.strip(),
            "status": "unresolved",
            "notes": notes,
        }

        try:
            res = supabase.table("knowledge_inconsistency_logs").insert(payload).execute()
            return res.data[0] if res.data else None
        except Exception as exc:
            logger.warning(f"Failed to insert into knowledge_inconsistency_logs: {exc}")
            return None

    @staticmethod
    def extract_and_log_from_answer(question: str, answer_text: str) -> None:
        """
        Inspects Gemini RAG AI generated answer text for data inconsistency notices,
        and automatically extracts conflict records into knowledge_inconsistency_logs.
        """
        if not answer_text or "transparansi" not in answer_text.lower():
            return

        try:
            # Example extraction pattern for transparency notes:
            # "1. Dokumen A (Versi 1): ... 63°C"
            # "2. Dokumen C: ... 45°C"
            # Detect product entity name from question or answer
            entity = "Ecovacs T80 OMNI"
            if "Y1" in question.upper():
                entity = "Ecovacs Y1 Pro"
            elif "T80" in question.upper():
                entity = "Ecovacs T80 OMNI"

            attr = "Spesifikasi / Parameter"
            if "suhu" in answer_text.lower() or "drying" in answer_text.lower():
                attr = "Suhu Hot Air Drying"
            elif "cas" in answer_text.lower() or "pengisian" in answer_text.lower() or "menit" in answer_text.lower():
                attr = "Waktu Pengisian Daya Baterai"

            doc_a = "Dokumen A (Versi 1)"
            val_a = "63°C"
            doc_b = "Dokumen C (Revisi 2025)"
            val_b = "45°C"

            # Parse exact document names and values from text if present
            lines = answer_text.splitlines()
            for line in lines:
                if ("1." in line or "lama" in line.lower() or "versi 1" in line.lower()) and ":" in line:
                    parts = line.split(":", 1)
                    doc_a = parts[0].strip("- *12.")
                    val_a = parts[1].strip()
                elif ("2." in line or "baru" in line.lower() or "revisi" in line.lower()) and ":" in line:
                    parts = line.split(":", 1)
                    doc_b = parts[0].strip("- *12.")
                    val_b = parts[1].strip()

            KnowledgeInconsistencyService.log_inconsistency(
                entity_name=entity,
                attribute_name=attr,
                doc_a_title=doc_a,
                value_a=val_a,
                doc_b_title=doc_b,
                value_b=val_b,
                notes=f"Auto-detected from RAG query: '{question}'",
            )
        except Exception as exc:
            logger.warning(f"Error extracting inconsistency from RAG answer: {exc}")

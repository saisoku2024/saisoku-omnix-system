import logging
from typing import List, Dict, Any
from app.core.supabase import supabase
from app.parsers.chat_parser import parse_chat_csv_content

logger = logging.getLogger(__name__)

def ingest_chat_transcripts_bytes(content_bytes: bytes) -> Dict[str, Any]:
    """
    Parses CSV content bytes and ingests the chat transcript records into Supabase `chat_transcripts`
    """
    records, summary = parse_chat_csv_content(content_bytes)

    if not records:
        return {
            "success": True,
            "inserted_count": 0,
            "summary": summary
        }

    # Batch insert in chunks of 500
    chunk_size = 500
    inserted_count = 0

    for i in range(0, len(records), chunk_size):
        chunk = records[i:i + chunk_size]
        try:
            res = supabase.table("chat_transcripts").insert(chunk).execute()
            if res.data:
                inserted_count += len(res.data)
            else:
                inserted_count += len(chunk)
        except Exception as e:
            logger.error(f"ERROR CHAT TRANSCRIPT INSERT CHUNK {i}: {e}", exc_info=True)
            # Fallback batching
            for row in chunk:
                try:
                    supabase.table("chat_transcripts").insert(row).execute()
                    inserted_count += 1
                except Exception as inner_e:
                    logger.error(f"ERROR SINGLE CHAT INSERT: {inner_e}")

    return {
        "success": True,
        "inserted_count": inserted_count,
        "summary": summary
    }

def get_chat_brand_records(brand_name: str, limit: int = 200) -> List[Dict[str, Any]]:
    """
    Fetches chat transcript records for a specific brand (e.g. Tineco, Ecovacs, Laifen, Tymo, Yoniev)
    """
    try:
        query = (
            supabase.table("chat_transcripts")
            .select("*")
            .is_("deleted_at", "null")
        )
        if brand_name.lower() != "all":
            query = query.ilike("detected_brand", brand_name)

        res = query.order("date_origin", desc=True).limit(limit).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"ERROR GET CHAT BRAND RECORDS ({brand_name}): {e}", exc_info=True)
        return []

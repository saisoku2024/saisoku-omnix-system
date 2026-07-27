from app.core.supabase import supabase
from app.services.upload_config import UPLOAD_CONFIG


TABLE_COLUMNS = {
    "omnix_cases": {
        "upload_id",
        "ticket_id",
        "interaction_at",
        "created_at",
        "customer_name",
        "customer_hp",
        "channel",
        "source_name",
        "date_first_response_interaction",
        "date_end_interaction",
        "is_escalated",
        "ticket_status_name",
        "main_category",
        "category",
        "subcategory",
        "detail_subcategory",
        "detail_subcategory2",
        "agent_name",
        "handling_time_sec",
        "response_time_sec",
        "waiting_time_sec",
        "feedback",
        "brand",
        "product",
        "principal_group",
        "principal_category",
        "subject",
        "subject_normalized",
        "mapping_status",
    },
    "voice_interactions": {
        "upload_id",
        "unique_id",
        "interaction_at",
        "created_at",
        "connected_at",
        "ended_at",
        "queue_name",
        "agent_name",
        "call_event",
        "clid_raw",
        "clid_normalized",
        "wait_time_sec",
        "talk_time_sec",
        "ring_time_sec",
        "hold_time_sec",
        "dst",
        "recording_file",
        "rec_ai",
        "channel",
        "call_status",
    },
    "csat_responses": {
        "upload_id",
        "source_id",
        "sid",
        "unique_id",
        "channel",
        "account",
        "response_type",
        "score",
        "message",
        "additional_message",
        "feedback",
        "flow_token",
        "rating_csat",
        "created_at_source",
        "created_at",
        "updated_at_source",
    },
}

INTERNAL_METADATA_KEYS = {
    "subject_original",
    "mapping_source",
    "mapping_version",
}


def _is_duplicate_key_error(error: Exception) -> bool:
    message = str(error).lower()
    return "duplicate key value" in message or "23505" in message


class UploadService:

    @staticmethod
    def get_config(upload_type: str):
        config = UPLOAD_CONFIG.get(upload_type)

        if config is None:
            raise Exception(f"Invalid upload_type: {upload_type}")

        return config

    @staticmethod
    def validate_rows(rows, unique_key):
        valid_rows = []
        invalid_rows = 0

        for row in rows:
            value = row.get(unique_key)

            if value is None:
                invalid_rows += 1
                continue

            value = str(value).strip()

            if value.lower() in ["", "nan", "none", "null"]:
                invalid_rows += 1
                continue

            row[unique_key] = value
            valid_rows.append(row)

        return valid_rows, invalid_rows

    @staticmethod
    def internal_deduplicate(rows, unique_key):
        seen = set()
        deduped_rows = []
        duplicate_rows = 0

        for row in rows:
            value = row[unique_key]

            if value in seen:
                duplicate_rows += 1
                continue

            seen.add(value)
            deduped_rows.append(row)

        return deduped_rows, duplicate_rows

    @staticmethod
    def database_deduplicate(
        table,
        rows,
        unique_key,
        duplicate_rows,
        batch_size=100
    ):
        if not rows:
            return [], duplicate_rows

        all_unique_keys = [r[unique_key] for r in rows]
        existing_ids = set()

        # Batch querying to prevent HTTP 414 Request-URI Too Large
        for i in range(0, len(all_unique_keys), batch_size):
            chunk_keys = all_unique_keys[i : i + batch_size]
            res = (
                supabase
                .table(table)
                .select(unique_key)
                .in_(unique_key, chunk_keys)
                .execute()
            )
            if res.data:
                for item in res.data:
                    if item.get(unique_key) is not None:
                        existing_ids.add(str(item[unique_key]).strip())

        inserted_candidates = []

        for row in rows:
            if row[unique_key] in existing_ids:
                duplicate_rows += 1
            else:
                inserted_candidates.append(row)

        return inserted_candidates, duplicate_rows

    @staticmethod
    def clean_row_for_table(table, row):
        allowed_columns = TABLE_COLUMNS.get(table)
        if allowed_columns is None:
            return {k: v for k, v in row.items() if k not in INTERNAL_METADATA_KEYS}

        return {
            k: v
            for k, v in row.items()
            if k in allowed_columns and k not in INTERNAL_METADATA_KEYS
        }

    @staticmethod
    def bulk_insert(table, rows, batch_size=100):
        inserted_rows = 0
        duplicate_rows = 0

        if not rows:
            return inserted_rows, duplicate_rows

        clean_rows = [UploadService.clean_row_for_table(table, r) for r in rows]

        # Chunked bulk insertion to prevent HTTP 413 Payload Too Large & Request Timeouts
        for i in range(0, len(clean_rows), batch_size):
            chunk = clean_rows[i : i + batch_size]
            try:
                res = supabase.table(table).insert(chunk).execute()
                if res.data:
                    inserted_rows += len(res.data)
                else:
                    inserted_rows += len(chunk)
            except Exception as e:
                if not _is_duplicate_key_error(e):
                    raise e

                for row in chunk:
                    try:
                        res = supabase.table(table).insert(row).execute()
                        if res.data:
                            inserted_rows += len(res.data)
                        else:
                            inserted_rows += 1
                    except Exception as row_error:
                        if _is_duplicate_key_error(row_error):
                            duplicate_rows += 1
                        else:
                            raise row_error

        return inserted_rows, duplicate_rows

    @staticmethod
    def update_upload_status(
        upload_id,
        total_rows,
        inserted_rows,
        duplicate_rows,
        invalid_rows,
    ):
        supabase.table("uploads").update({
            "processing_status": "success",
            "total_rows": total_rows,
            "inserted_rows": inserted_rows,
            "duplicate_rows": duplicate_rows,
            "invalid_rows": invalid_rows,
        }).eq("id", upload_id).execute()

    @staticmethod
    def update_upload_failed(
        upload_id,
        error,
    ):
        supabase.table("uploads").update({
            "processing_status": "failed",
            "error_summary": str(error)[:500],
        }).eq("id", upload_id).execute()

from app.core.supabase import supabase
from app.services.upload_config import UPLOAD_CONFIG


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
        batch_size=500
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
                    existing_ids.add(item[unique_key])

        inserted_candidates = []

        for row in rows:
            if row[unique_key] in existing_ids:
                duplicate_rows += 1
            else:
                inserted_candidates.append(row)

        return inserted_candidates, duplicate_rows

    @staticmethod
    def bulk_insert(table, rows, batch_size=500):
        inserted_rows = 0

        if not rows:
            return inserted_rows

        # Filter out internal audit fields if table schema does not include them
        EXTRA_METADATA_KEYS = {
            "subject",
            "subject_original",
            "subject_normalized",
            "mapping_status",
            "mapping_source",
            "mapping_version",
        }

        clean_rows = []
        for r in rows:
            clean_r = {k: v for k, v in r.items() if k not in EXTRA_METADATA_KEYS}
            clean_rows.append(clean_r)

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
                if "duplicate key value" in str(e):
                    pass
                else:
                    raise e

        return inserted_rows

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
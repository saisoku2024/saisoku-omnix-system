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
    ):
        if not rows:
            return [], duplicate_rows

        existing = (
            supabase
            .table(table)
            .select(unique_key)
            .in_(
                unique_key,
                [r[unique_key] for r in rows]
            )
            .execute()
        )

        existing_ids = {
            r[unique_key]
            for r in existing.data
        }

        inserted_candidates = []

        for row in rows:

            if row[unique_key] in existing_ids:
                duplicate_rows += 1
            else:
                inserted_candidates.append(row)

        return inserted_candidates, duplicate_rows

    @staticmethod
    def bulk_insert(table, rows):
        inserted_rows = 0

        if rows:
            try:
                supabase.table(table).insert(rows).execute()
                inserted_rows = len(rows)

            except Exception as e:
                if "duplicate key value" in str(e):
                    inserted_rows = 0
                else:
                    raise

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
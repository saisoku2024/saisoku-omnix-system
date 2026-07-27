from datetime import datetime, timedelta
from uuid import uuid4

from app.core.supabase import supabase


DELETE_MODES = ("soft", "hard")

DETAIL_TABLES = {
    "omnix": {
        "table": "omnix_cases",
        "label": "Omnix",
    },
    "voice": {
        "table": "voice_interactions",
        "label": "Voice",
    },
    "csat": {
        "table": "csat_responses",
        "label": "CSAT",
    },
}


def _parse_date(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%d")


def _is_missing_column_error(error: Exception) -> bool:
    message = str(error).lower()
    return (
        ("column" in message and "does not exist" in message)
        or "pgrst204" in message
        or "42703" in message
    )


def _session_date_value(row: dict):
    return row.get("uploaded_at") or row.get("created_at") or row.get("processed_at")


def _fetch_uploads(date_from: str, date_to: str, upload_type: str | None, status: str | None) -> list[dict]:
    start_iso = _parse_date(date_from).isoformat()
    end_iso = (_parse_date(date_to) + timedelta(days=1)).isoformat()
    date_columns = ["uploaded_at", "created_at", "processed_at"]

    last_error = None
    for date_column in date_columns:
        try:
            query = (
                supabase.table("uploads")
                .select("*")
                .gte(date_column, start_iso)
                .lt(date_column, end_iso)
                .order(date_column, desc=True)
                .limit(500)
            )
            if upload_type and upload_type != "all":
                query = query.eq("file_type", upload_type)
            if status and status != "all":
                query = query.eq("processing_status", status)

            return query.execute().data or []
        except Exception as err:
            if _is_missing_column_error(err):
                last_error = err
                continue
            raise err

    raise last_error or ValueError("No supported upload timestamp column found")


def _count_rows(table: str, upload_id: str, soft_delete: bool) -> int:
    query = supabase.table(table).select("id", count="exact").eq("upload_id", upload_id)
    if soft_delete:
        query = query.is_("deleted_at", "null")

    response = query.range(0, 0).execute()
    if response.count is not None:
        return response.count
    return len(response.data or [])


def _normalize_delete_mode(delete_mode: str) -> str:
    normalized = (delete_mode or "soft").lower()
    if normalized not in DELETE_MODES:
        raise ValueError("delete_mode must be either soft or hard")
    return normalized


class UploadSessionService:
    @staticmethod
    def list_sessions(date_from: str, date_to: str, upload_type: str | None = None, status: str | None = None) -> dict:
        if _parse_date(date_to) < _parse_date(date_from):
            raise ValueError("date_to must be greater than or equal to date_from")

        uploads = _fetch_uploads(date_from, date_to, upload_type, status)
        items = []

        for upload in uploads:
            file_type = upload.get("file_type")
            config = DETAIL_TABLES.get(file_type)
            detail_count = 0
            total_detail_count = 0
            delete_mode = "unsupported"
            delete_modes = []
            table = None

            if config:
                table = config["table"]
                delete_mode = "soft"
                delete_modes = list(DELETE_MODES)
                detail_count = _count_rows(table, upload["id"], True)
                total_detail_count = _count_rows(table, upload["id"], False)

            items.append(
                {
                    "id": upload.get("id"),
                    "file_name": upload.get("file_name"),
                    "file_type": file_type,
                    "processing_status": upload.get("processing_status"),
                    "total_rows": upload.get("total_rows") or 0,
                    "inserted_rows": upload.get("inserted_rows") or upload.get("valid_rows") or 0,
                    "duplicate_rows": upload.get("duplicate_rows") or 0,
                    "invalid_rows": upload.get("invalid_rows") or 0,
                    "error_summary": upload.get("error_summary"),
                    "uploaded_at": _session_date_value(upload),
                    "processed_at": upload.get("processed_at"),
                    "storage_path": upload.get("storage_path"),
                    "target_table": table,
                    "delete_mode": delete_mode,
                    "delete_modes": delete_modes,
                    "detail_rows": detail_count,
                    "total_detail_rows": total_detail_count,
                }
            )

        return {
            "date_from": date_from,
            "date_to": date_to,
            "type": upload_type or "all",
            "status": status or "all",
            "items": items,
        }

    @staticmethod
    def preview_delete(upload_id: str, delete_mode: str = "soft") -> dict:
        delete_mode = _normalize_delete_mode(delete_mode)
        upload_res = supabase.table("uploads").select("*").eq("id", upload_id).limit(1).execute()
        upload = (upload_res.data or [None])[0]
        if not upload:
            raise ValueError("Upload session not found")

        config = DETAIL_TABLES.get(upload.get("file_type"))
        if not config:
            raise ValueError(f"Unsupported upload type: {upload.get('file_type')}")

        table = config["table"]
        affected_rows = _count_rows(table, upload_id, delete_mode == "soft")

        return {
            "upload_id": upload_id,
            "file_name": upload.get("file_name"),
            "file_type": upload.get("file_type"),
            "processing_status": upload.get("processing_status"),
            "uploaded_at": _session_date_value(upload),
            "target_table": table,
            "delete_mode": delete_mode,
            "affected_rows": affected_rows,
            "warning": (
                "Rows will be permanently removed from the detail table. Use this before re-upload if soft-deleted rows still trigger duplicate detection."
                if delete_mode == "hard"
                else "Rows will be soft-deleted and hidden from reports that filter deleted_at."
            ),
        }

    @staticmethod
    def delete_session(upload_id: str, deleted_by: str = "admin", delete_mode: str = "soft") -> dict:
        preview = UploadSessionService.preview_delete(upload_id, delete_mode=delete_mode)
        if preview["affected_rows"] <= 0:
            return {
                **preview,
                "deleted_rows": 0,
                "cleanup_batch_id": None,
                "deleted_by": deleted_by,
            }

        cleanup_batch_id = str(uuid4())
        deleted_at = datetime.utcnow().isoformat() + "Z"
        table = preview["target_table"]

        if preview["delete_mode"] == "soft":
            response = (
                supabase.table(table)
                .update(
                    {
                        "deleted_at": deleted_at,
                        "deleted_reason": "upload_session_deleted",
                        "deleted_by": deleted_by,
                        "cleanup_batch_id": cleanup_batch_id,
                    }
                )
                .eq("upload_id", upload_id)
                .is_("deleted_at", "null")
                .execute()
            )
            deleted_rows = len(response.data or []) or preview["affected_rows"]
        else:
            response = supabase.table(table).delete().eq("upload_id", upload_id).execute()
            deleted_rows = len(response.data or []) or preview["affected_rows"]

        return {
            **preview,
            "deleted_rows": deleted_rows,
            "cleanup_batch_id": cleanup_batch_id,
            "deleted_at": deleted_at,
            "deleted_by": deleted_by,
        }

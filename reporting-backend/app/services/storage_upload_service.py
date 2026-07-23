import os
import posixpath
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict
from urllib.parse import quote, urlparse

import requests
from fastapi import HTTPException, status


MAX_STORAGE_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024

UPLOAD_BUCKETS = {
    "knowledge": "knowledge-files",
    "data": "data-uploads",
}

ALLOWED_EXTENSIONS = {
    "knowledge": {".pdf", ".txt", ".md", ".docx", ".xlsx", ".xls", ".csv"},
    "data": {".xlsx", ".xls", ".csv"},
}

ALLOWED_MIME_TYPES = {
    "knowledge": [
        "application/pdf",
        "application/octet-stream",
        "text/plain",
        "text/markdown",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
    ],
    "data": [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/octet-stream",
        "text/csv",
    ],
}


def _supabase_url() -> str:
    value = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    if not value:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SUPABASE_URL is not configured",
        )
    return value


def _service_role_key() -> str:
    value = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not value:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SUPABASE_SERVICE_ROLE_KEY is not configured",
        )
    return value


def _headers() -> Dict[str, str]:
    key = _service_role_key()
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }


def _safe_filename(filename: str) -> str:
    base = posixpath.basename(filename.strip() or "upload.bin")
    base = re.sub(r"[^A-Za-z0-9._-]+", "-", base).strip(".-")
    return base[:160] or "upload.bin"


def _extension(filename: str) -> str:
    base = posixpath.basename(filename.strip())
    if "." not in base:
        return ""
    return "." + base.rsplit(".", 1)[-1].lower()


def validate_storage_upload(kind: str, filename: str, size: int) -> str:
    if kind not in UPLOAD_BUCKETS:
        raise HTTPException(status_code=400, detail="Jenis upload storage tidak valid.")
    if size <= 0:
        raise HTTPException(status_code=400, detail="Ukuran file tidak valid.")
    if size > MAX_STORAGE_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Ukuran file maksimal 50MB.")

    ext = _extension(filename)
    if ext not in ALLOWED_EXTENSIONS[kind]:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS[kind]))
        raise HTTPException(status_code=400, detail=f"Format file tidak didukung. Gunakan: {allowed}.")
    return ext


def build_storage_path(kind: str, filename: str) -> str:
    safe_name = _safe_filename(filename)
    now = datetime.now(timezone.utc)
    return f"{kind}/{now:%Y/%m/%d}/{uuid.uuid4().hex}-{safe_name}"


def ensure_storage_bucket(kind: str) -> None:
    bucket = UPLOAD_BUCKETS[kind]
    payload = {
        "id": bucket,
        "name": bucket,
        "public": False,
        "file_size_limit": MAX_STORAGE_UPLOAD_SIZE_BYTES,
        "allowed_mime_types": ALLOWED_MIME_TYPES[kind],
    }

    create_response = requests.post(
        f"{_supabase_url()}/storage/v1/bucket",
        headers={**_headers(), "Content-Type": "application/json"},
        json=payload,
        timeout=20,
    )
    if create_response.ok or create_response.status_code in {400, 409}:
        return

    raise HTTPException(
        status_code=502,
        detail=f"Gagal menyiapkan bucket Supabase Storage: {create_response.text[:300]}",
    )


def create_signed_upload(kind: str, filename: str, content_type: str | None, size: int) -> Dict[str, Any]:
    validate_storage_upload(kind, filename, size)
    bucket = UPLOAD_BUCKETS[kind]
    ensure_storage_bucket(kind)
    path = build_storage_path(kind, filename)
    encoded_path = quote(path, safe="/")
    url = f"{_supabase_url()}/storage/v1/object/upload/sign/{bucket}/{encoded_path}"

    response = requests.post(
        url,
        headers={**_headers(), "Content-Type": "application/json"},
        json={"upsert": False},
        timeout=20,
    )
    if not response.ok:
        raise HTTPException(
            status_code=502,
            detail=f"Gagal membuat signed upload URL: {response.text[:300]}",
        )

    data = response.json()
    signed_url = data.get("signedURL") or data.get("signedUrl") or data.get("url")
    token = data.get("token")
    if not signed_url:
        raise HTTPException(status_code=502, detail="Response signed upload URL Supabase tidak valid.")
    if signed_url.startswith("/"):
        signed_url = f"{_supabase_url()}/storage/v1{signed_url}"

    return {
        "bucket": bucket,
        "path": path,
        "signed_url": signed_url,
        "token": token,
        "content_type": content_type or "application/octet-stream",
        "max_size": MAX_STORAGE_UPLOAD_SIZE_BYTES,
    }


def assert_allowed_bucket(kind: str, bucket: str, path: str) -> None:
    expected_bucket = UPLOAD_BUCKETS.get(kind)
    if bucket != expected_bucket:
        raise HTTPException(status_code=400, detail="Bucket upload tidak sesuai.")
    if not path.startswith(f"{kind}/"):
        raise HTTPException(status_code=400, detail="Path upload storage tidak sesuai.")


def download_storage_object(kind: str, bucket: str, path: str) -> bytes:
    assert_allowed_bucket(kind, bucket, path)
    encoded_path = quote(path, safe="/")
    url = f"{_supabase_url()}/storage/v1/object/authenticated/{bucket}/{encoded_path}"
    response = requests.get(url, headers=_headers(), timeout=(10, 120))
    if not response.ok:
        raise HTTPException(
            status_code=502,
            detail=f"Gagal membaca file dari Supabase Storage: HTTP {response.status_code}",
        )
    if len(response.content) > MAX_STORAGE_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Ukuran file maksimal 50MB.")
    return response.content


def filename_from_path(path: str) -> str:
    name = posixpath.basename(path)
    if "-" in name:
        return name.split("-", 1)[1] or name
    return name

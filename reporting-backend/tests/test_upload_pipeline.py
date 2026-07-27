import pandas as pd

from app.parsers.omnix_parser import parse_omnix_rows
from app.parsers.voice_parser import parse_voice_rows
from app.services import upload_service
from app.services.upload_service import TABLE_COLUMNS, UploadService


def test_omnix_parser_payload_matches_known_schema_columns():
    df = pd.DataFrame(
        [
            {
                "ticket_number": "T-001",
                "channel_name": "WhatsApp",
                "account": "Support",
                "customer_name": "Budi",
                "subject": "Garansi produk",
                "date_created_at": "2026-07-22 09:15:00",
            }
        ]
    )

    rows = parse_omnix_rows(df, "upload-1")
    clean_row = UploadService.clean_row_for_table("omnix_cases", rows[0])

    assert rows[0]["ticket_id"] == "T-001"
    assert set(clean_row).issubset(TABLE_COLUMNS["omnix_cases"])
    assert "ticket_number" not in clean_row
    assert "account_name" not in clean_row
    assert "created_at_source" not in clean_row
    assert "mapping_status" not in rows[0]
    assert "raw_payload" not in clean_row


def test_missing_unique_key_becomes_invalid_row():
    rows = parse_voice_rows(pd.DataFrame([{"agent": "Ayu", "datetime": "2026-07-22"}]), "upload-1")

    valid_rows, invalid_rows = UploadService.validate_rows(rows, "unique_id")

    assert valid_rows == []
    assert invalid_rows == 1


class _Result:
    def __init__(self, data):
        self.data = data


class _FakeTable:
    def __init__(self):
        self.payload = None

    def insert(self, payload):
        self.payload = payload
        return self

    def execute(self):
        if isinstance(self.payload, list):
            raise Exception("duplicate key value violates unique constraint")
        if self.payload["ticket_id"] == "existing":
            raise Exception("duplicate key value violates unique constraint")
        return _Result([self.payload])


class _FakeSupabase:
    def table(self, _table_name):
        return _FakeTable()


def test_bulk_insert_counts_duplicate_conflicts(monkeypatch):
    monkeypatch.setattr(upload_service, "supabase", _FakeSupabase())

    inserted_rows, duplicate_rows = UploadService.bulk_insert(
        "omnix_cases",
        [
            {"upload_id": "upload-1", "ticket_id": "existing"},
            {"upload_id": "upload-1", "ticket_id": "new"},
        ],
        batch_size=100,
    )

    assert inserted_rows == 1
    assert duplicate_rows == 1

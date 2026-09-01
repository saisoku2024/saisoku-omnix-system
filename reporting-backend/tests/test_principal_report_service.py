import pandas as pd

from app.routes.principal import FINAL_EXPORT_COLUMNS
from app.services.principal_service import get_principal_report, get_principal_summary


class FakeQuery:
    def __init__(self, rows):
        self._rows = rows
        self.calls = []

    def select(self, *_args, **_kwargs):
        self.calls.append(("select", _args, _kwargs))
        return self

    def gte(self, *_args, **_kwargs):
        self.calls.append(("gte", _args, _kwargs))
        return self

    def lt(self, *_args, **_kwargs):
        self.calls.append(("lt", _args, _kwargs))
        return self

    def is_(self, *_args, **_kwargs):
        self.calls.append(("is", _args, _kwargs))
        return self

    def execute(self):
        class Result:
            data = self._rows

        return Result()


def test_get_principal_summary_counts_csat_responses(monkeypatch):
    fake_rows = [
        {"ticket_id": "T-1", "interaction_at": "2026-08-01T00:00:00+00:00", "csat_response_status": "Responded", "rating_csat": "5"},
        {"ticket_id": "T-2", "interaction_at": "2026-08-02T00:00:00+00:00", "csat_response_status": "Not Responded", "rating_csat": None},
        {"ticket_id": "T-3", "interaction_at": "2026-08-03T00:00:00+00:00", "csat_response_status": "Responded", "rating_csat": "4"},
    ]

    fake_query = FakeQuery(fake_rows)

    class FakeSupabase:
        def rpc(self, *_args, **_kwargs):
            raise AssertionError("RPC should not be used when a direct query fallback is available")

        def table(self, name):
            assert name == "omnix_cases"
            return fake_query

    monkeypatch.setattr("app.services.principal_service.supabase", FakeSupabase())

    result = get_principal_summary("2026-08-01", "2026-08-04")

    assert result["total_ticket"] == 3
    assert result["csat_response"] == 2
    assert result["response_rate"] == 66.67


def test_get_principal_report_uses_active_ticket_rows(monkeypatch):
    fake_rows = [
        {"ticket_id": "T-1", "interaction_at": "2026-08-01T00:00:00+00:00", "deleted_at": None},
        {"ticket_id": "T-2", "interaction_at": "2026-08-02T00:00:00+00:00", "deleted_at": "2026-08-03T00:00:00+00:00"},
        {"ticket_id": "T-3", "interaction_at": "2026-08-03T00:00:00+00:00", "deleted_at": None},
    ]

    fake_query = FakeQuery(fake_rows)

    class FakeSupabase:
        def rpc(self, *_args, **_kwargs):
            raise AssertionError("Export path must use the canonical active rows instead of the stale RPC")

        def table(self, name):
            assert name == "omnix_cases"
            return fake_query

    monkeypatch.setattr("app.services.principal_service.supabase", FakeSupabase())

    rows = get_principal_report("2026-08-01", "2026-08-04")

    assert len(rows) == 2
    assert [r["ticket_id"] for r in rows] == ["T-1", "T-3"]


def test_get_principal_summary_ignores_deleted_rows(monkeypatch):
    fake_rows = [
        {"ticket_id": "T-1", "interaction_at": "2026-08-01T00:00:00+00:00", "deleted_at": None, "csat_response_status": "Responded", "rating_csat": "5"},
        {"ticket_id": "T-2", "interaction_at": "2026-08-02T00:00:00+00:00", "deleted_at": "2026-08-03T00:00:00+00:00", "csat_response_status": "Responded", "rating_csat": "5"},
        {"ticket_id": "T-3", "interaction_at": "2026-08-03T00:00:00+00:00", "deleted_at": None, "csat_response_status": "Not Responded", "rating_csat": None},
    ]

    fake_query = FakeQuery(fake_rows)

    class FakeSupabase:
        def rpc(self, *_args, **_kwargs):
            raise AssertionError("RPC should not be used when the direct query fallback is available")

        def table(self, name):
            assert name == "omnix_cases"
            return fake_query

    monkeypatch.setattr("app.services.principal_service.supabase", FakeSupabase())

    result = get_principal_summary("2026-08-01", "2026-08-04")

    assert result["total_ticket"] == 2
    assert result["csat_response"] == 1
    assert result["response_rate"] == 50.0
    assert ("is", ("deleted_at", "null"), {}) in fake_query.calls


def test_get_principal_summary_uses_same_ticket_universe_as_dashboard(monkeypatch):
    fake_rows = [
        {"ticket_id": "T-1", "interaction_at": "2026-08-01T00:00:00+00:00", "deleted_at": None, "csat_response_status": "Responded", "rating_csat": "5"},
        {"ticket_id": "T-2", "interaction_at": "2026-08-02T00:00:00+00:00", "deleted_at": None, "csat_response_status": "Not Responded", "rating_csat": None},
        {"ticket_id": "T-3", "interaction_at": "2026-08-03T00:00:00+00:00", "deleted_at": None, "csat_response_status": "Responded", "rating_csat": "4"},
        {"ticket_id": "T-4", "interaction_at": "2026-08-04T00:00:00+00:00", "deleted_at": "2026-08-05T00:00:00+00:00", "csat_response_status": "Responded", "rating_csat": "5"},
    ]

    fake_query = FakeQuery(fake_rows)

    class FakeSupabase:
        def rpc(self, *_args, **_kwargs):
            raise AssertionError("Principal summary must use the canonical ticket universe, not a divergent RPC total")

        def table(self, name):
            assert name == "omnix_cases"
            return fake_query

    monkeypatch.setattr("app.services.principal_service.supabase", FakeSupabase())

    result = get_principal_summary("2026-08-01", "2026-08-04")

    assert result["total_ticket"] == 3
    assert result["csat_response"] == 2
    assert result["response_rate"] == 66.67


def test_principal_export_keeps_full_template_columns_even_when_missing():
    raw = pd.DataFrame([
        {
            "ticket_id": "T-1",
            "interaction_at": "2026-08-01T09:00:00+00:00",
            "source_name": "WhatsApp",
            "main_category": "Billing",
            "principal_group": "Bank A",
        }
    ])

    renamed = raw.rename(columns={
        "ticket_id": "Ticket ID",
        "interaction_at": "Ticket Created Date",
        "source_name": "Contact Channel",
        "main_category": "Main Category",
        "principal_group": "Principal Group",
    })

    for col in FINAL_EXPORT_COLUMNS:
        if col not in renamed.columns:
            renamed[col] = ""

    exported = renamed[FINAL_EXPORT_COLUMNS]

    assert list(exported.columns) == FINAL_EXPORT_COLUMNS
    assert "Customer Name" in exported.columns
    assert "CSAT Score" in exported.columns


def test_validate_date_raises_http_exception():
    import pytest
    from fastapi import HTTPException
    from app.routes.principal import _validate_date

    with pytest.raises(HTTPException) as exc_info:
        _validate_date("invalid-date-format", "start_date")
    assert exc_info.value.status_code == 400
    assert "start_date" in exc_info.value.detail

    with pytest.raises(HTTPException) as exc_info2:
        _validate_date("", "end_date")
    assert exc_info2.value.status_code == 400


def test_get_principal_report_paginates_beyond_1000_rows(monkeypatch):
    total_fake = 1500
    all_fake_rows = [
        {"ticket_id": f"T-{i}", "interaction_at": "2026-08-01T00:00:00+00:00", "deleted_at": None}
        for i in range(total_fake)
    ]

    class FakePaginatedQuery:
        def __init__(self, rows):
            self._rows = rows
            self._slice = rows
            self.ranges = []

        def select(self, *_args, **_kwargs):
            return self

        def gte(self, *_args, **_kwargs):
            return self

        def lt(self, *_args, **_kwargs):
            return self

        def is_(self, *_args, **_kwargs):
            return self

        def order(self, *_args, **_kwargs):
            return self

        def range(self, start, end):
            self.ranges.append((start, end))
            self._slice = self._rows[start : end + 1]
            return self

        def execute(self):
            class Result:
                data = self._slice

            return Result()

    paginated_query = FakePaginatedQuery(all_fake_rows)

    class FakeSupabase:
        def table(self, name):
            assert name == "omnix_cases"
            return paginated_query

    monkeypatch.setattr("app.services.principal_service.supabase", FakeSupabase())

    rows = get_principal_report("2026-08-01", "2026-08-04")
    assert len(rows) == 1500
    assert len(paginated_query.ranges) == 2
    assert paginated_query.ranges[0] == (0, 999)
    assert paginated_query.ranges[1] == (1000, 1999)


def test_principal_category_conversion_mapping():
    from app.services.principal_mapper import enrich_principal_row, map_principal_dimensions

    # 1. Exact match from business dictionary (synchronized with Supabase principal_mapping table)
    group, category, inc = map_principal_dimensions("Informasi", "Ecovacs - Care", "Seputar Layanan")
    assert group == "Aftersale-Service inquiry"
    assert category == "Service Inquiry"
    assert inc is True

    group, category, inc = map_principal_dimensions("Panduan", "Yoniev - Kendala Teknis", "Kendala Spare Part")
    assert group == "Failure"
    assert category == "Spare Part Issue"
    assert inc is True

    group, category, inc = map_principal_dimensions("Panduan", "Yoniev - Panduan Penggunaan", "Panduan Penggunaan Awal")
    assert group == "How to use"
    assert category == "New machines"
    assert inc is True

    # 2. In-memory row enrichment without altering raw row
    raw_row = {
        "ticket_id": "103833",
        "customer_name": "'+62811986168'",
        "main_category": "Informasi",
        "subcategory": "Ecovacs - Care",
        "detail_subcategory": "Seputar Layanan",
        "principal_group": None,
        "principal_category": None,
    }
    enriched = enrich_principal_row(raw_row)

    assert enriched["ticket_id"] == "103833"
    assert enriched["principal_group"] == "Aftersale-Service inquiry"
    assert enriched["principal_category"] == "Service Inquiry"
    # Ensure original dict is not mutated
    assert raw_row["principal_group"] is None



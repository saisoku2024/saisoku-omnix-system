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

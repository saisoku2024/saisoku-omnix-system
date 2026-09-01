from app.services.principal_service import get_principal_summary


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

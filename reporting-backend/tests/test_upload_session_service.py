from app.services import upload_session_service
from app.services.upload_session_service import UploadSessionService


class _Result:
    def __init__(self, data=None, count=None):
        self.data = data or []
        self.count = count


class _FakeQuery:
    def __init__(self, fake, table):
        self.fake = fake
        self.table = table
        self.operation = None
        self.payload = None
        self.filters = {}

    def select(self, _columns, count=None):
        self.operation = "select"
        self.count_mode = count
        return self

    def update(self, payload):
        self.operation = "update"
        self.payload = payload
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def is_(self, key, value):
        self.filters[key] = value
        return self

    def limit(self, _value):
        return self

    def range(self, _start, _end):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def execute(self):
        upload_id = self.filters.get("upload_id") or self.filters.get("id")

        if self.table == "uploads":
            upload = self.fake.uploads.get(upload_id)
            return _Result([upload] if upload else [])

        rows = self.fake.rows.get((self.table, upload_id), [])

        if self.operation == "select":
            return _Result(rows[:1], count=len(rows))

        if self.operation == "update":
            self.fake.updates.append((self.table, upload_id, self.payload))
            return _Result(rows)

        if self.operation == "delete":
            self.fake.deletes.append((self.table, upload_id))
            return _Result(rows)

        return _Result([])


class _FakeSupabase:
    def __init__(self):
        self.uploads = {
            "omnix-upload": {
                "id": "omnix-upload",
                "file_name": "omnix.xlsx",
                "file_type": "omnix",
                "processing_status": "success",
                "uploaded_at": "2026-07-22T00:00:00Z",
            },
            "csat-upload": {
                "id": "csat-upload",
                "file_name": "csat.xlsx",
                "file_type": "csat",
                "processing_status": "success",
                "uploaded_at": "2026-07-22T00:00:00Z",
            },
        }
        self.rows = {
            ("omnix_cases", "omnix-upload"): [{"id": 1}, {"id": 2}],
            ("csat_responses", "csat-upload"): [{"id": 3}],
        }
        self.updates = []
        self.deletes = []

    def table(self, table):
        return _FakeQuery(self, table)


def test_delete_upload_session_soft_deletes_omnix(monkeypatch):
    fake = _FakeSupabase()
    monkeypatch.setattr(upload_session_service, "supabase", fake)

    result = UploadSessionService.delete_session("omnix-upload", deleted_by="admin")

    assert result["delete_mode"] == "soft"
    assert result["deleted_rows"] == 2
    assert fake.updates[0][0] == "omnix_cases"
    assert fake.updates[0][2]["deleted_reason"] == "upload_session_deleted"
    assert fake.deletes == []


def test_delete_upload_session_soft_deletes_csat(monkeypatch):
    fake = _FakeSupabase()
    monkeypatch.setattr(upload_session_service, "supabase", fake)

    result = UploadSessionService.delete_session("csat-upload", deleted_by="admin")

    assert result["delete_mode"] == "soft"
    assert result["deleted_rows"] == 1
    assert fake.updates[0][0] == "csat_responses"
    assert fake.updates[0][2]["deleted_reason"] == "upload_session_deleted"
    assert fake.deletes == []


def test_delete_upload_session_hard_deletes_csat_when_requested(monkeypatch):
    fake = _FakeSupabase()
    monkeypatch.setattr(upload_session_service, "supabase", fake)

    result = UploadSessionService.delete_session("csat-upload", deleted_by="admin", delete_mode="hard")

    assert result["delete_mode"] == "hard"
    assert result["deleted_rows"] == 1
    assert fake.deletes == [("csat_responses", "csat-upload")]
    assert fake.updates == []

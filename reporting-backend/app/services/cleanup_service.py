from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.core.supabase import supabase


JAKARTA_TZ = ZoneInfo("Asia/Jakarta")
UTC_TZ = ZoneInfo("UTC")
TEXT_COLUMNS = [
    "customer_name",
    "main_category",
    "category",
    "subcategory",
    "detail_subcategory",
    "detail_subcategory2",
    "feedback",
]


def _parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def _date_to_utc_iso(value: date) -> str:
    return datetime(value.year, value.month, value.day, tzinfo=JAKARTA_TZ).astimezone(
        UTC_TZ
    ).isoformat()


def _parse_timestamp(value):
    if not value:
        return None

    if isinstance(value, datetime):
        return value

    text = str(value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def _jakarta_date(value):
    parsed = _parse_timestamp(value)
    if not parsed:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC_TZ)

    return parsed.astimezone(JAKARTA_TZ).date().isoformat()


def _as_lower(value) -> str:
    return str(value or "").strip().lower()


def _is_abandon(row) -> bool:
    return "abandon" in _as_lower(row.get("call_event")) or "abandon" in _as_lower(
        row.get("call_status")
    )


def _contains_text(row, needle: str) -> bool:
    normalized_needle = needle.lower()
    return any(normalized_needle in _as_lower(row.get(column)) for column in TEXT_COLUMNS)


def _candidate_from_omnix(row) -> dict:
    return {
        "id": row.get("id"),
        "ticket_id": row.get("ticket_id"),
        "customer_hp": row.get("customer_hp"),
        "interaction_date": _jakarta_date(row.get("interaction_at")),
        "interaction_at": row.get("interaction_at"),
        "customer_name": row.get("customer_name"),
        "channel": row.get("channel"),
        "main_category": row.get("main_category"),
        "category": row.get("category"),
        "subcategory": row.get("subcategory"),
        "agent_name": row.get("agent_name"),
        "reasons": [],
        "matched_voice": None,
    }


class CleanupService:
    @staticmethod
    def preview(date_from: str, date_to: str, rules: list[str]) -> dict:
        start_date = _parse_date(date_from)
        end_date = _parse_date(date_to)
        if end_date < start_date:
            raise ValueError("date_to must be greater than or equal to date_from")

        start_iso = _date_to_utc_iso(start_date)
        end_iso = _date_to_utc_iso(end_date + timedelta(days=1))

        omnix_res = (
            supabase.table("omnix_cases")
            .select(
                ",".join(
                    [
                        "id",
                        "ticket_id",
                        "interaction_at",
                        "customer_name",
                        "customer_hp",
                        "channel",
                        "main_category",
                        "category",
                        "subcategory",
                        "detail_subcategory",
                        "detail_subcategory2",
                        "feedback",
                        "agent_name",
                    ]
                )
            )
            .gte("interaction_at", start_iso)
            .lt("interaction_at", end_iso)
            .limit(10000)
            .execute()
        )

        omnix_rows = omnix_res.data or []
        candidates: dict[str, dict] = {}
        rule_counts = {
            "abandon_match": 0,
            "test_omnix": 0,
            "internal_email": 0,
        }

        if "abandon_match" in rules:
            voice_res = (
                supabase.table("voice_interactions")
                .select(
                    "id,interaction_at,clid_normalized,clid_raw,call_event,call_status,agent_name"
                )
                .gte("interaction_at", start_iso)
                .lt("interaction_at", end_iso)
                .limit(10000)
                .execute()
            )
            abandon_lookup = {}

            for row in voice_res.data or []:
                if not _is_abandon(row):
                    continue

                phone = str(row.get("clid_normalized") or "").strip()
                interaction_date = _jakarta_date(row.get("interaction_at"))
                if not phone or not interaction_date:
                    continue

                abandon_lookup.setdefault((phone, interaction_date), row)

            for row in omnix_rows:
                key = (
                    str(row.get("customer_hp") or "").strip(),
                    _jakarta_date(row.get("interaction_at")),
                )
                matched_voice = abandon_lookup.get(key)
                if not matched_voice:
                    continue

                candidate = candidates.setdefault(row["id"], _candidate_from_omnix(row))
                if "abandon_match" not in candidate["reasons"]:
                    candidate["reasons"].append("abandon_match")
                    rule_counts["abandon_match"] += 1

                candidate["matched_voice"] = {
                    "id": matched_voice.get("id"),
                    "interaction_at": matched_voice.get("interaction_at"),
                    "call_event": matched_voice.get("call_event"),
                    "call_status": matched_voice.get("call_status"),
                    "clid_normalized": matched_voice.get("clid_normalized"),
                }

        if "test_omnix" in rules:
            for row in omnix_rows:
                if not _contains_text(row, "test omnix"):
                    continue

                candidate = candidates.setdefault(row["id"], _candidate_from_omnix(row))
                if "test_omnix" not in candidate["reasons"]:
                    candidate["reasons"].append("test_omnix")
                    rule_counts["test_omnix"] += 1

        if "internal_email" in rules:
            for row in omnix_rows:
                if "internal email" not in _as_lower(row.get("subcategory")):
                    continue

                candidate = candidates.setdefault(row["id"], _candidate_from_omnix(row))
                if "internal_email" not in candidate["reasons"]:
                    candidate["reasons"].append("internal_email")
                    rule_counts["internal_email"] += 1

        items = sorted(
            candidates.values(),
            key=lambda item: (item.get("interaction_at") or "", item.get("ticket_id") or ""),
        )

        return {
            "date_from": date_from,
            "date_to": date_to,
            "rules": rules,
            "total_scanned_omnix": len(omnix_rows),
            "total_candidates": len(items),
            "rule_counts": rule_counts,
            "items": items[:500],
            "truncated": len(items) > 500,
        }

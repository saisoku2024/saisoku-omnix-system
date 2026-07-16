import re
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


def _normalize_compare_phone(value) -> str:
    phone = re.sub(r"[^\d+]", "", str(value or "").strip())
    if phone.startswith("+62"):
        return phone[1:]
    if phone.startswith("08"):
        return "62" + phone[1:]
    if phone.startswith("8"):
        return "62" + phone
    if phone.startswith("62"):
        return phone
    return phone


def _phone_profile(value) -> dict:
    phone = _normalize_compare_phone(value)
    return {
        "prefix": phone[:3] if phone else "empty",
        "length": len(phone),
        "empty": phone == "",
    }


def _phone_bucket(value) -> str:
    profile = _phone_profile(value)
    return "empty" if profile["empty"] else f"{profile['prefix']} / {profile['length']} digit"


def _mask_phone(value) -> str:
    phone = _normalize_compare_phone(value)
    if not phone:
        return ""
    if len(phone) <= 6:
        return f"{phone[:2]}***"
    return f"{phone[:4]}***{phone[-3:]}"


def _is_abandon(row) -> bool:
    return "abandon" in _as_lower(row.get("call_event")) or "abandon" in _as_lower(
        row.get("call_status")
    )


def _contains_text(row, needle: str) -> bool:
    normalized_needle = needle.lower()
    return any(normalized_needle in _as_lower(row.get(column)) for column in TEXT_COLUMNS)


def _candidate_from_omnix(row) -> dict:
    return {
        "target_table": "omnix_cases",
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
        "matched_omnix": None,
    }


def _candidate_from_voice(row) -> dict:
    return {
        "target_table": "voice_interactions",
        "id": row.get("id"),
        "ticket_id": row.get("unique_id"),
        "customer_hp": row.get("clid_normalized") or row.get("clid_raw"),
        "interaction_date": _jakarta_date(row.get("interaction_at")),
        "interaction_at": row.get("interaction_at"),
        "customer_name": None,
        "channel": row.get("channel") or "voice",
        "main_category": row.get("call_status"),
        "category": row.get("call_event"),
        "subcategory": row.get("queue_name"),
        "agent_name": row.get("agent_name"),
        "reasons": [],
        "matched_voice": {
            "id": row.get("id"),
            "interaction_at": row.get("interaction_at"),
            "call_event": row.get("call_event"),
            "call_status": row.get("call_status"),
            "clid_normalized": row.get("clid_normalized"),
        },
        "matched_omnix": None,
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

        total_scanned_voice = 0

        if "abandon_match" in rules:
            voice_res = (
                supabase.table("voice_interactions")
                .select(
                    "id,unique_id,interaction_at,clid_normalized,clid_raw,call_event,call_status,queue_name,agent_name,channel"
                )
                .gte("interaction_at", start_iso)
                .lt("interaction_at", end_iso)
                .limit(10000)
                .execute()
            )
            voice_rows = voice_res.data or []
            total_scanned_voice = len(voice_rows)

            omnix_lookup = {}
            for row in omnix_rows:
                phone = _normalize_compare_phone(row.get("customer_hp"))
                interaction_date = _jakarta_date(row.get("interaction_at"))
                if not phone or not interaction_date:
                    continue

                omnix_lookup.setdefault((phone, interaction_date), row)

            for row in voice_rows:
                if not _is_abandon(row):
                    continue

                phone = _normalize_compare_phone(
                    row.get("clid_normalized") or row.get("clid_raw")
                )
                interaction_date = _jakarta_date(row.get("interaction_at"))
                if not phone or not interaction_date:
                    continue

                matched_omnix = omnix_lookup.get((phone, interaction_date))
                if not matched_omnix:
                    continue

                candidate = candidates.setdefault(row["id"], _candidate_from_voice(row))
                if "abandon_match" not in candidate["reasons"]:
                    candidate["reasons"].append("abandon_match")
                    rule_counts["abandon_match"] += 1

                candidate["matched_omnix"] = {
                    "id": matched_omnix.get("id"),
                    "ticket_id": matched_omnix.get("ticket_id"),
                    "interaction_at": matched_omnix.get("interaction_at"),
                    "customer_hp": matched_omnix.get("customer_hp"),
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
            "total_scanned_voice": total_scanned_voice,
            "total_candidates": len(items),
            "rule_counts": rule_counts,
            "items": items[:500],
            "truncated": len(items) > 500,
        }

    @staticmethod
    def phone_diagnostics(date_from: str, date_to: str) -> dict:
        start_date = _parse_date(date_from)
        end_date = _parse_date(date_to)
        if end_date < start_date:
            raise ValueError("date_to must be greater than or equal to date_from")

        start_iso = _date_to_utc_iso(start_date)
        end_iso = _date_to_utc_iso(end_date + timedelta(days=1))

        voice_res = (
            supabase.table("voice_interactions")
            .select("id,unique_id,interaction_at,clid_normalized,clid_raw,call_event,call_status")
            .gte("interaction_at", start_iso)
            .lt("interaction_at", end_iso)
            .limit(10000)
            .execute()
        )
        omnix_res = (
            supabase.table("omnix_cases")
            .select("id,ticket_id,interaction_at,created_at,customer_hp")
            .gte("interaction_at", start_iso)
            .lt("interaction_at", end_iso)
            .limit(10000)
            .execute()
        )

        voice_rows = [row for row in (voice_res.data or []) if _is_abandon(row)]
        omnix_rows = omnix_res.data or []
        omnix_by_phone = {}
        omnix_by_phone_interaction_date = {}
        omnix_by_phone_created_date = {}

        for row in omnix_rows:
            phone = _normalize_compare_phone(row.get("customer_hp"))
            if not phone:
                continue

            omnix_by_phone.setdefault(phone, []).append(row)
            interaction_date = _jakarta_date(row.get("interaction_at"))
            created_date = _jakarta_date(row.get("created_at"))
            if interaction_date:
                omnix_by_phone_interaction_date.setdefault((phone, interaction_date), []).append(row)
            if created_date:
                omnix_by_phone_created_date.setdefault((phone, created_date), []).append(row)

        voice_format_counts = {}
        omnix_format_counts = {}
        phone_only_matches = 0
        interaction_date_matches = 0
        created_date_matches = 0
        sample_voice = []
        sample_matches = []

        for row in voice_rows:
            phone = _normalize_compare_phone(row.get("clid_normalized") or row.get("clid_raw"))
            bucket = _phone_bucket(phone)
            voice_format_counts[bucket] = voice_format_counts.get(bucket, 0) + 1

            if len(sample_voice) < 12:
                sample_voice.append(
                    {
                        "unique_id": row.get("unique_id"),
                        "phone": _mask_phone(phone),
                        "raw_phone": _mask_phone(row.get("clid_raw")),
                        "bucket": bucket,
                        "date": _jakarta_date(row.get("interaction_at")),
                        "event": row.get("call_event") or row.get("call_status"),
                    }
                )

            if phone in omnix_by_phone:
                phone_only_matches += 1

            interaction_key = (phone, _jakarta_date(row.get("interaction_at")))
            if interaction_key in omnix_by_phone_interaction_date:
                interaction_date_matches += 1
                if len(sample_matches) < 12:
                    matched = omnix_by_phone_interaction_date[interaction_key][0]
                    sample_matches.append(
                        {
                            "voice_unique_id": row.get("unique_id"),
                            "voice_phone": _mask_phone(phone),
                            "voice_date": interaction_key[1],
                            "omnix_ticket_id": matched.get("ticket_id"),
                            "omnix_phone": _mask_phone(matched.get("customer_hp")),
                            "omnix_interaction_date": _jakarta_date(matched.get("interaction_at")),
                            "match_type": "interaction_at",
                        }
                    )

            created_key = (phone, _jakarta_date(row.get("interaction_at")))
            if created_key in omnix_by_phone_created_date:
                created_date_matches += 1

        for row in omnix_rows:
            bucket = _phone_bucket(row.get("customer_hp"))
            omnix_format_counts[bucket] = omnix_format_counts.get(bucket, 0) + 1

        return {
            "date_from": date_from,
            "date_to": date_to,
            "voice_abandon_total": len(voice_rows),
            "omnix_total": len(omnix_rows),
            "voice_phone_formats": voice_format_counts,
            "omnix_phone_formats": omnix_format_counts,
            "phone_only_matches": phone_only_matches,
            "interaction_date_matches": interaction_date_matches,
            "created_date_matches": created_date_matches,
            "sample_voice_abandon": sample_voice,
            "sample_interaction_date_matches": sample_matches,
        }

from app.services.cleanup_service import (
    SPAM_TEST_PATTERNS,
    COMPILED_SPAM_TEST_RE,
    _candidate_from_omnix,
    _candidate_from_voice,
)


def test_spam_test_regex_patterns():
    assert len(COMPILED_SPAM_TEST_RE) == len(SPAM_TEST_PATTERNS)
    sample_text = "test omnix interaction"
    matched = any(pattern.search(sample_text) for pattern in COMPILED_SPAM_TEST_RE)
    assert matched is True


def test_candidate_from_omnix():
    row = {
        "id": "123",
        "ticket_id": "T123",
        "customer_hp": "62812345678",
        "interaction_at": "2026-07-27T10:00:00Z",
        "customer_name": "Test User",
        "channel": "Whatsapp",
    }
    candidate = _candidate_from_omnix(row)
    assert candidate["target_table"] == "omnix_cases"
    assert candidate["ticket_id"] == "T123"
    assert candidate["customer_hp"] == "62812345678"


def test_candidate_from_voice():
    row = {
        "id": "456",
        "unique_id": "V456",
        "clid_normalized": "62812345678",
        "interaction_at": "2026-07-27T10:00:00Z",
        "call_status": "ANSWERED",
        "call_event": "Voice Call",
    }
    candidate = _candidate_from_voice(row)
    assert candidate["target_table"] == "voice_interactions"
    assert candidate["ticket_id"] == "V456"
    assert candidate["matched_voice"]["call_status"] == "ANSWERED"

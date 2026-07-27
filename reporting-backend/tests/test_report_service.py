from datetime import date
from app.services.report_service import (
    ReportService,
    _duration_label,
    _normalize_channel,
    _with_report_defaults,
)


def test_duration_label():
    assert _duration_label(0) == "0m 0s"
    assert _duration_label(65) == "1m 5s"
    assert _duration_label(3665) == "1h 1m 5s"


def test_normalize_channel():
    assert _normalize_channel("wa") == "Whatsapp"
    assert _normalize_channel("IG Message") == "DM Instagram"
    assert _normalize_channel("EMAIL") == "Email"
    assert _normalize_channel("unknown") is None


def test_with_report_defaults():
    defaults = _with_report_defaults({}, "Voice")
    assert defaults["customer"] == "Mazuta Group"
    assert defaults["segment"] == "Digital"
    assert defaults["sub_segment"] == "Voice"


def test_get_options_fallback():
    options = ReportService.get_options()
    assert "report_types" in options
    assert isinstance(options["report_types"], list)

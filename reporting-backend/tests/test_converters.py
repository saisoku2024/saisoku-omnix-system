from app.utils.converters import safe_datetime


def test_safe_datetime_treats_naive_excel_dates_as_jakarta_time():
    assert safe_datetime("28.07.2026 17:03:04") == "2026-07-28T17:03:04+07:00"


def test_safe_datetime_preserves_explicit_timezone_offsets():
    assert safe_datetime("2026-07-28T17:03:04+00:00") == "2026-07-28T17:03:04+00:00"

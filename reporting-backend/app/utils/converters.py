from decimal import Decimal
import pandas as pd


def safe_str(v):
    if pd.isna(v):
        return None
    s = str(v).strip()
    return s if s else None


def safe_numeric(v):
    if pd.isna(v) or v == "":
        return None
    try:
        return float(v)
    except Exception:
        return None


def safe_datetime(v):
    if pd.isna(v) or v == "":
        return None
    try:
        dt = pd.to_datetime(v)
        if pd.isna(dt):
            return None
        return dt.isoformat()
    except Exception:
        return None


def duration_to_seconds(v):
    if pd.isna(v) or v == "":
        return None

    try:
        # angka langsung
        if isinstance(v, (int, float, Decimal)):
            return int(float(v))

        # pandas timedelta
        if isinstance(v, pd.Timedelta):
            return int(v.total_seconds())

        value = str(v)

        # format "0 days 00:05:30"
        if "days" in value:
            td = pd.to_timedelta(value)
            return int(td.total_seconds())

        parts = value.split(":")

        if len(parts) == 3:
            h, m, s = parts
            return int(h) * 3600 + int(m) * 60 + int(float(s))

        if len(parts) == 2:
            m, s = parts
            return int(m) * 60 + int(float(s))

        return int(float(value))

    except Exception:
        return None
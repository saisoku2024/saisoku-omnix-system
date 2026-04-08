from datetime import datetime
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
        return pd.to_datetime(v).to_pydatetime()
    except Exception:
        return None


def duration_to_seconds(v):
    if pd.isna(v) or v == "":
        return None
    try:
        if isinstance(v, (int, float, Decimal)):
            return int(float(v))
        parts = str(v).split(":")
        if len(parts) == 3:
            h, m, s = map(int, parts)
            return h * 3600 + m * 60 + s
        if len(parts) == 2:
            m, s = map(int, parts)
            return m * 60 + s
        return int(float(v))
    except Exception:
        return None
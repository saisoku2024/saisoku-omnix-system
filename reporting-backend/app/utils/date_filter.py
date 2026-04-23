from datetime import date, datetime, timezone
from calendar import monthrange
from typing import Tuple


def get_date_range(granularity: str, period: str, year: int) -> Tuple[str, str]:
    granularity = granularity.lower()
    if granularity == "monthly":
        granularity = "month"
    elif granularity == "quarterly":
        granularity = "quarter"
    elif granularity == "yearly":
        granularity = "year"

    def to_iso(d: date, end=False) -> str:
        """Convert date ke ISO 8601 UTC string untuk Supabase filter"""
        if end:
            # End = hari berikutnya jam 00:00 (exclusive upper bound)
            from datetime import timedelta
            d = d + timedelta(days=1)
        return datetime(d.year, d.month, d.day, tzinfo=timezone.utc).isoformat()

    # ── MONTH ──────────────────────────────────────────────────────────────
    if granularity == "month":
        try:
            month = datetime.strptime(period, "%b").month
        except ValueError:
            try:
                month = int(period)
            except ValueError:
                raise ValueError(f"Invalid month period: {period}")

        start_date = date(year, month, 1)
        end_date   = date(year, month, monthrange(year, month)[1])
        return to_iso(start_date), to_iso(end_date, end=True)

    # ── QUARTER ────────────────────────────────────────────────────────────
    if granularity == "quarter":
        q_num = int(''.join(filter(str.isdigit, period)))
        if q_num not in [1, 2, 3, 4]:
            raise ValueError("Quarter must be 1, 2, 3, or 4")

        start_month = (q_num - 1) * 3 + 1
        end_month   = start_month + 2
        start_date  = date(year, start_month, 1)
        end_date    = date(year, end_month, monthrange(year, end_month)[1])
        return to_iso(start_date), to_iso(end_date, end=True)

    # ── YEAR ───────────────────────────────────────────────────────────────
    if granularity == "year":
        return to_iso(date(year, 1, 1)), to_iso(date(year, 12, 31), end=True)

    raise ValueError("granularity must be 'month', 'quarter', or 'year'")
from datetime import date
from calendar import monthrange
from typing import Optional, Tuple


def get_date_range(
    granularity: str,
    year: int,
    month: Optional[int] = None,
    quarter: Optional[int] = None,
) -> Tuple[date, date]:
    if granularity == "month":
        if month is None:
            raise ValueError("month is required when granularity='month'")
        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])
        return start_date, end_date

    if granularity == "quarter":
        if quarter is None:
            raise ValueError("quarter is required when granularity='quarter'")
        if quarter not in [1, 2, 3, 4]:
            raise ValueError("quarter must be 1, 2, 3, or 4")

        start_month = (quarter - 1) * 3 + 1
        end_month = start_month + 2

        start_date = date(year, start_month, 1)
        end_date = date(year, end_month, monthrange(year, end_month)[1])
        return start_date, end_date

    if granularity == "year":
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        return start_date, end_date

    raise ValueError("granularity must be 'month', 'quarter', or 'year'")
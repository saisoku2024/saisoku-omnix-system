from datetime import date, datetime
from calendar import monthrange
from typing import Tuple

def get_date_range(granularity: str, period: str, year: int) -> Tuple[date, date]:
    # 1. Normalisasi Granularity (Biar 'monthly' gak error lagi)
    granularity = granularity.lower()
    if granularity == "monthly":
        granularity = "month"
    elif granularity == "quarterly":
        granularity = "quarter"
    elif granularity == "yearly":
        granularity = "year"

    # 2. Logika untuk BULAN (contoh period: "Apr" atau "04")
    if granularity == "month":
        try:
            # Jika period berupa nama bulan (Apr, May, etc)
            month = datetime.strptime(period, "%b").month
        except ValueError:
            try:
                # Jika period berupa angka (04, 4)
                month = int(period)
            except ValueError:
                raise ValueError(f"Invalid month period: {period}")
        
        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])
        return start_date, end_date

    # 3. Logika untuk QUARTER (contoh period: "Q1", "Q2")
    if granularity == "quarter":
        # Ambil angka dari "Q1" -> 1
        q_num = int(''.join(filter(str.isdigit, period)))
        if q_num not in [1, 2, 3, 4]:
            raise ValueError("Quarter must be 1, 2, 3, or 4")

        start_month = (q_num - 1) * 3 + 1
        end_month = start_month + 2
        start_date = date(year, start_month, 1)
        end_date = date(year, end_month, monthrange(year, end_month)[1])
        return start_date, end_date

    # 4. Logika untuk TAHUN
    if granularity == "year":
        return date(year, 1, 1), date(year, 12, 31)

    raise ValueError("granularity must be 'month', 'quarter', or 'year'")
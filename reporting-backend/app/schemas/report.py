from datetime import date
from typing import Optional

from pydantic import BaseModel


# ============================================================
# REPORT PREVIEW
# ============================================================

class PreviewRequest(BaseModel):
    report_type: str

    channel: Optional[str] = ""
    brand: Optional[str] = ""
    main_category: Optional[str] = ""

    start_date: date
    end_date: date


# ============================================================
# REPORT EXPORT
# ============================================================

class ExportRequest(BaseModel):
    report_type: str

    channel: Optional[str] = ""
    brand: Optional[str] = ""
    main_category: Optional[str] = ""

    start_date: date
    end_date: date

    divisi: Optional[str] = ""
    departemen: Optional[str] = ""
    customer: Optional[str] = ""

    nama_layanan: Optional[str] = ""
    nama_sub_layanan: Optional[str] = ""
    layanan_cc_non_cc: Optional[str] = ""

    segment: Optional[str] = ""
    sub_segment: Optional[str] = ""
    kota: Optional[str] = ""
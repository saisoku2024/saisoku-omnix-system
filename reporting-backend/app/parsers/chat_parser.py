import csv
import io
import re
import logging
from datetime import datetime
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# The 5 Core Target Brands requested by user
BRAND_PATTERNS = [
    ("Tineco", re.compile(r"\b(tineco|floor\s*one|ifloor|pure\s*one|s3|s5|s7|carpet\s*one)\b", re.IGNORECASE)),
    ("Ecovacs", re.compile(r"\b(ecovacs|ecovas|deebot|winbot|t10|t20|t30|x1|x2|n8|n10)\b", re.IGNORECASE)),
    ("Laifen", re.compile(r"\b(laifen|hairdryer|hair\s*dryer|wave)\b", re.IGNORECASE)),
    ("Tymo", re.compile(r"\b(tymo|straightener|sway)\b", re.IGNORECASE)),
    ("Yoniev", re.compile(r"\b(yoniev|y1|y2)\b", re.IGNORECASE)),
]

PARTNER_PATTERNS = [
    ("Unicom", re.compile(r"\b(unicom)\b", re.IGNORECASE)),
    ("Mitracare", re.compile(r"\b(mitracare|mitra\s*care)\b", re.IGNORECASE)),
    ("Plaza Segi 8", re.compile(r"\b(segi\s*8|segi8|pattimura|surabaya)\b", re.IGNORECASE)),
    ("PRJ Kemayoran", re.compile(r"\b(prj|jiexpo|kemayoran)\b", re.IGNORECASE)),
    ("Tokopedia", re.compile(r"\b(tokopedia|tokped|toped)\b", re.IGNORECASE)),
    ("Shopee", re.compile(r"\b(shopee)\b", re.IGNORECASE)),
    ("Blibli", re.compile(r"\b(blibli)\b", re.IGNORECASE)),
]

def clean_val(val: Any) -> str:
    if val is None:
        return ""
    text = str(val).strip()
    # Strip leading/trailing single quotes like "'1043613851484827'"
    if text.startswith("'") and text.endswith("'") and len(text) > 1:
        text = text[1:-1]
    return text.strip()

def detect_brand(message: str, subject: str = "") -> str:
    combined = f"{subject} {message}"
    for brand_name, pattern in BRAND_PATTERNS:
        if pattern.search(combined):
            return brand_name
    return "Other"

def detect_partner(message: str, subject: str = "") -> str:
    combined = f"{subject} {message}"
    for partner_name, pattern in PARTNER_PATTERNS:
        if pattern.search(combined):
            return partner_name
    return "General"

def parse_date(date_str: str) -> str:
    cleaned = clean_val(date_str)
    if not cleaned or cleaned == "-":
        return None
    try:
        dt = datetime.strptime(cleaned, "%Y-%m-%d %H:%M:%S")
        return dt.isoformat()
    except Exception:
        return cleaned

def parse_chat_csv_content(content_bytes: bytes) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Parses a CSV file containing chat transcripts (e.g. contoh percakapan.csv)
    Returns (records, summary_stats)
    """
    # Try decoding
    text_content = ""
    for encoding in ["utf-8-sig", "utf-8", "latin-1"]:
        try:
            text_content = content_bytes.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if not text_content:
        raise ValueError("Gagal membaca encoding file CSV")

    reader = csv.DictReader(io.StringIO(text_content))
    records = []

    brand_counts: Dict[str, int] = {}
    partner_counts: Dict[str, int] = {}
    session_brands: Dict[str, str] = {}

    # First pass: collect records and detect per-message brand/partner
    temp_rows = []
    for row in reader:
        session_id = clean_val(row.get("session_id"))
        if not session_id:
            continue

        message = clean_val(row.get("message"))
        subject = clean_val(row.get("subject"))

        brand = detect_brand(message, subject)
        partner = detect_partner(message, subject)

        if brand != "Other":
            session_brands[session_id] = brand

        temp_rows.append({
            "id_interaction": clean_val(row.get("id_interaction")),
            "session_id": session_id,
            "channel_name": clean_val(row.get("channel_name")),
            "from_id": clean_val(row.get("from_id")),
            "from_username": clean_val(row.get("from_username")),
            "from_name": clean_val(row.get("from_name")),
            "agent_name": clean_val(row.get("agent_name")),
            "action_type": clean_val(row.get("action_type")).upper(),
            "subject": subject,
            "message": message,
            "date_origin": parse_date(row.get("date_origin")),
            "date_received": parse_date(row.get("date_received")),
            "response_time_sec": int(float(clean_val(row.get("response_time")) or 0)),
            "detected_brand": brand,
            "detected_partner": partner,
        })

    # Second pass: propagate session-level brand to messages in the same session
    for r in temp_rows:
        session_id = r["session_id"]
        if r["detected_brand"] == "Other" and session_id in session_brands:
            r["detected_brand"] = session_brands[session_id]

        brand = r["detected_brand"]
        partner = r["detected_partner"]

        brand_counts[brand] = brand_counts.get(brand, 0) + 1
        partner_counts[partner] = partner_counts.get(partner, 0) + 1
        records.append(r)

    summary = {
        "total_rows": len(records),
        "total_sessions": len(set(r["session_id"] for r in records)),
        "brand_breakdown": brand_counts,
        "partner_breakdown": partner_counts,
    }

    return records, summary

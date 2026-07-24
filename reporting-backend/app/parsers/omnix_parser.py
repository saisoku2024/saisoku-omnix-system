import pandas as pd

def safe_str(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    return s if s != "" else None


def safe_str_raw(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None

    s = str(val).strip()
    return s if s != "" else None


BRAND_KEYWORD_MAP = [
    ("Tineco", ["tineco", "ifloor", "floor one", "floorone", "carpet one", "pure one", "toasty one", "s3", "s5", "s7", "smart washer"]),
    ("Ecovacs", ["ecovacs", "deebot", "winbot", "goat", "atmo", "omni", "n8", "n10", "t9", "t10", "t20", "t30", "x1", "x2", "robot vacuum"]),
    ("Yoniev", ["yoniev", "yoni"]),
    ("Laifen", ["laifen", "swift", "wave", "hair dryer"]),
    ("Usmile", ["usmile", "electric toothbrush", "sikat gigi"]),
    ("Dreame", ["dreame"]),
    ("Roborock", ["roborock"]),
    ("Dyson", ["dyson"]),
    ("Yeedi", ["yeedi"]),
]


def infer_brand(row):
    raw_brand = safe_str_raw(
        row.get("brand") or row.get("Brand") or row.get("BRAND") or row.get("merk") or row.get("Merk") or row.get("MERK")
    )
    if raw_brand and raw_brand.lower() not in ["unknown", "null", "none", "", "-", "n/a"]:
        return raw_brand

    values = [
        row.get("brand") or row.get("Brand"),
        row.get("mainCategory") or row.get("main_category"),
        row.get("category"),
        row.get("subCategory") or row.get("subcategory"),
        row.get("detailSubCategory") or row.get("detail_subcategory"),
        row.get("subject"),
        row.get("product"),
    ]
    haystack = " ".join(str(value or "") for value in values).lower()

    for brand_name, keywords in BRAND_KEYWORD_MAP:
        for kw in keywords:
            if kw in haystack:
                return brand_name

    return raw_brand or "Lainnya / Unassigned"


from app.services.subject_standardizer import SubjectStandardizer


def parse_omnix_rows(df, upload_id):
    rows = []

    for _, row in df.iterrows():
        row_dict = row.to_dict()

        created_raw = row.get("date_created_at")
        created_at = safe_datetime(created_raw)
        interaction_at = safe_datetime(row.get("date_origin_interaction"))

        # Automatic Subject Standardization
        subject_info = SubjectStandardizer.classify_row(row_dict)

        record = {
            "upload_id": upload_id,

            # Columns in omnix_cases schema
            "ticket_number": safe_str(row.get("ticket_number")),
            "channel": safe_str(row.get("channel_name")),
            "account_name": safe_str(row.get("account_name")),
            "customer_name": safe_str(row.get("customer_name")),

            "brand": infer_brand(row_dict),
            "main_category": safe_str(row.get("mainCategory")),
            "category": safe_str(row.get("category")),
            "sub_category": safe_str(row.get("subCategory")),
            "detail_sub_category": safe_str(row.get("detailSubCategory")),

            "subject": safe_str(row.get("subject")),

            # Automatic Subject Standardization Result
            "subject_normalized": subject_info["subject_normalized"],

            "agent_name": safe_str(row.get("agent_name")),
            "status": safe_str(row.get("status")),

            "handling_time_sec": safe_int(row.get("handling_time")),
            "response_time_sec": safe_int(row.get("first_response_time")),

            # Flexible column lookup for waiting_time
            "waiting_time_sec": safe_int(
                row.get("waiting_time") or row.get("customer_waiting_time") or row.get("waiting_time_sec")
            ),

            "created_at_source": created_at,
            "interaction_at": interaction_at or created_at,

            "customer_hp": safe_str(row.get("customer_hp") or row.get("phone_number") or row.get("no_hp")),

            # Keep full raw payload as JSONB for auditability
            "raw_payload": row_dict,
        }

        rows.append(record)

    return rows


def safe_int(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return 0
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return 0


def safe_datetime(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    try:
        dt = pd.to_datetime(val)
        if pd.isna(dt):
            return None
        return dt.isoformat()
    except Exception:
        return None

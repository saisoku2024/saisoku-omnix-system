import re
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
            if re.search(r"\b" + re.escape(kw) + r"\b", haystack):
                return brand_name

    return raw_brand or "Lainnya / Unassigned"


from app.services.subject_standardizer import SubjectStandardizer


def parse_omnix_rows(df, upload_id):
    rows = []

    for _, row in df.iterrows():
        row_dict = row.to_dict()

        ticket_id = normalize_ticket_id(
            row.get("ticket_id")
            or row.get("ticket_number")
            or row.get("ticket_no")
            or row.get("id_interaction")
            or row.get("session_id")
            or row.get("id")
        )

        created_raw = row.get("date_created_at") or row.get("created_at") or row.get("date_open")
        created_at = safe_datetime(created_raw)
        interaction_raw = (
            row.get("date_origin_interaction")
            or row.get("date_start_interaction")
            or row.get("interaction_at")
            or row.get("date_open")
            or created_raw
        )
        interaction_at = safe_datetime(interaction_raw) or created_at

        # Automatic Subject Standardization
        subject_info = SubjectStandardizer.classify_row(row_dict)

        record = {
            "upload_id": upload_id,

            # Columns in omnix_cases schema
            "ticket_id": ticket_id,
            "channel": safe_str(row.get("channel_name") or row.get("channel")),
            "source_name": safe_str(row.get("source_name") or row.get("channel_name") or row.get("source")),
            "customer_name": safe_str(row.get("customer_name") or row.get("customer")),

            "brand": infer_brand(row_dict),
            "product": safe_str(row.get("product") or row.get("product_name")),
            "principal_group": safe_str(row.get("principal_group") or row.get("principal")),
            "principal_category": safe_str(row.get("principal_category")),
            "main_category": safe_str(row.get("mainCategory") or row.get("main_category")),
            "category": safe_str(row.get("category")),
            "subcategory": safe_str(row.get("subCategory") or row.get("subcategory") or row.get("sub_category")),
            "detail_subcategory": safe_str(row.get("detailSubCategory") or row.get("detail_subcategory") or row.get("detail_sub_category")),
            "detail_subcategory2": safe_str(row.get("detailSubCategory2") or row.get("detail_subcategory2")),

            "subject": safe_str(row.get("subject")),

            # Automatic Subject Standardization Result
            "subject_normalized": subject_info["subject_normalized"],

            "agent_name": safe_str(row.get("agent_name") or row.get("agent")),
            "ticket_status_name": safe_str(row.get("status") or row.get("ticket_status_name")),
            "is_escalated": safe_str(row.get("is_escalated") or row.get("escalation_status")),

            "handling_time_sec": safe_int(row.get("handling_time") or row.get("handlingTime")),
            "response_time_sec": safe_int(row.get("first_response_time") or row.get("responseTime")),

            # Flexible column lookup for waiting_time
            "waiting_time_sec": safe_int(
                row.get("waiting_time") or row.get("customer_waiting_time") or row.get("waiting_time_sec") or row.get("waitingTime")
            ),

            "created_at": created_at,
            "interaction_at": interaction_at,
            "date_first_response_interaction": safe_datetime(row.get("date_first_response_interaction") or row.get("first_response_at")),
            "date_end_interaction": safe_datetime(row.get("date_end_interaction") or row.get("resolved_at") or row.get("date_close")),

            "customer_hp": safe_str(row.get("customer_hp") or row.get("phone_number") or row.get("no_hp")),
            "feedback": safe_str(row.get("feedback") or row.get("resolution")),
            "csat_dispatch_status": safe_str(row.get("csat_dispatch_status")),
            "csat_response_status": safe_str(row.get("csat_response_status")),
            "rating_csat": safe_str(row.get("rating_csat") or row.get("csat_score")),
        }

        rows.append(record)

    return rows


from app.utils.converters import safe_datetime, normalize_ticket_id


def safe_int(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return 0
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return 0

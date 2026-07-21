from app.utils.converters import safe_str, safe_datetime, duration_to_seconds
from app.utils.normalizers import normalize_phone
from app.services.subject_standardizer import SubjectStandardizer


def safe_str_raw(val):
    import pandas as pd

    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None

    s = str(val).strip()
    return s if s != "" else None


def infer_brand(row):
    known_brands = ["Tineco", "Ecovacs", "Yoniev", "Laifen", "Usmile"]
    values = [
        row.get("brand"),
        row.get("category"),
        row.get("subCategory"),
        row.get("detailSubCategory"),
        row.get("subject"),
    ]
    haystack = " ".join(str(value or "") for value in values).lower()

    for brand in known_brands:
        if brand.lower() in haystack:
            return brand

    return safe_str_raw(row.get("brand"))


def parse_omnix_rows(df, upload_id):
    rows = []

    for _, row in df.iterrows():
        row_dict = row.to_dict()

        created_raw = row.get("date_created_at")
        created_at = safe_datetime(created_raw)
        interaction_at = safe_datetime(row.get("date_origin_interaction"))

        # Automatic Subject Standardization
        subject_info = SubjectStandardizer.classify_row(row_dict)

        rows.append({
            # ==================================================
            # SYSTEM
            # ==================================================
            "upload_id": upload_id,
            "ticket_id": safe_str_raw(row.get("ticketId_masking") or row.get("ticket_id")),

            "interaction_at": interaction_at,
            "created_at": created_at,

            # ==================================================
            # SUBJECT STANDARDIZATION & METADATA
            # ==================================================
            "subject": subject_info["subject_normalized"] or safe_str(row.get("subject")),
            "subject_original": subject_info["subject_original"],
            "subject_normalized": subject_info["subject_normalized"],
            "mapping_status": subject_info["mapping_status"],
            "mapping_source": subject_info["mapping_source"],
            "mapping_version": subject_info["mapping_version"],

            # ==================================================
            # CUSTOMER
            # ==================================================
            "customer_name": safe_str(row.get("customer_name")),
            "customer_hp": normalize_phone(row.get("customer_hp")),

            # ==================================================
            # CHANNEL
            # ==================================================
            "channel": safe_str(row.get("channel_name")),

            # ==================================================
            # PRINCIPAL REPORT FIELDS
            # ==================================================
            "source_name": safe_str(row.get("source_name")),
            "date_first_response_interaction": safe_datetime(row.get("date_first_response_interaction")),
            "date_end_interaction": safe_datetime(row.get("date_end_interaction")),
            "is_escalated": safe_str(row.get("is_escalated")),
            "ticket_status_name": safe_str(row.get("ticket_status_name")),

            # ==================================================
            # CATEGORY HIERARCHY
            # ==================================================
            "main_category": safe_str(row.get("mainCategory")),
            "brand": infer_brand(row),
            "category": safe_str(row.get("category")),
            "subcategory": safe_str(row.get("subCategory")),
            "detail_subcategory": safe_str(row.get("detailSubCategory")),
            "detail_subcategory2": safe_str_raw(row.get("detailSubCategory2")),

            # ==================================================
            # AGENT
            # ==================================================
            "agent_name": safe_str(row.get("created_by_name")),

            # ==================================================
            # TIME METRICS
            # ==================================================
            "handling_time_sec": duration_to_seconds(row.get("handlingTime")),
            "response_time_sec": duration_to_seconds(row.get("responseTime")),
            "waiting_time_sec": duration_to_seconds(row.get("waitingTime")),

            # ==================================================
            # FEEDBACK
            # ==================================================
            "feedback": safe_str(row.get("feedback")),
        })

    return rows

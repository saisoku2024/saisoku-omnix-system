import logging
from collections import defaultdict
from datetime import date, datetime, timedelta

from app.core.supabase import supabase
from app.utils.normalizers import normalize_phone

logger = logging.getLogger(__name__)


DIGITAL_REPORT_DEFAULTS = {
    "divisi": "Industrial & Consumer Service",
    "departemen": "Industrial & Consumer Service",
    "customer": "Mazuta Group",
    "nama_layanan": "Mazuta Care",
    "nama_sub_layanan": "",
    "layanan_cc_non_cc": "CC",
    "segment": "Digital",
    "kota": "Surabaya",
}

DIGITAL_CHANNELS = ["Whatsapp", "DM Instagram", "Email"]
DIGITAL_AGENT_TARGET = 12
SCAN_PAGE_SIZE = 1000
MAX_EXPORT_ROWS = 50000


def _as_date(value) -> date:
    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    return datetime.fromisoformat(str(value)).date()


def _date_range(start_date, end_date):
    start = _as_date(start_date)
    end = _as_date(end_date)
    days = (end - start).days

    return [start + timedelta(days=offset) for offset in range(days + 1)]


def _iso_date(value) -> str:
    return _as_date(value).isoformat()


def _normalize_channel(value: str | None) -> str | None:
    normalized = (value or "").strip().lower()

    if normalized in {"whatsapp", "wa"}:
        return "Whatsapp"

    if normalized in {"ig message", "instagram", "dm instagram", "ig"}:
        return "DM Instagram"

    if normalized == "email":
        return "Email"

    return None


def _weekday_label(value: date) -> str:
    return value.strftime("%A")


def _month_label(value: date) -> str:
    return value.strftime("%B %Y")


def _duration_label(total_seconds: int | float | None) -> str:
    seconds = int(total_seconds or 0)
    minutes, remaining_seconds = divmod(max(0, seconds), 60)
    hours, remaining_minutes = divmod(minutes, 60)

    if hours > 0:
        return f"{hours}h {remaining_minutes}m {remaining_seconds}s"

    return f"{remaining_minutes}m {remaining_seconds}s"


def _with_report_defaults(payload: dict, sub_segment: str = "") -> dict:
    return {
        "divisi": payload.get("divisi") or DIGITAL_REPORT_DEFAULTS["divisi"],
        "departemen": payload.get("departemen") or DIGITAL_REPORT_DEFAULTS["departemen"],
        "customer": payload.get("customer") or DIGITAL_REPORT_DEFAULTS["customer"],
        "nama_layanan": payload.get("nama_layanan") or DIGITAL_REPORT_DEFAULTS["nama_layanan"],
        "nama_sub_layanan": payload.get("nama_sub_layanan") or DIGITAL_REPORT_DEFAULTS["nama_sub_layanan"],
        "layanan_cc_non_cc": payload.get("layanan_cc_non_cc") or DIGITAL_REPORT_DEFAULTS["layanan_cc_non_cc"],
        "segment": payload.get("segment") or DIGITAL_REPORT_DEFAULTS["segment"],
        "sub_segment": payload.get("sub_segment") or sub_segment,
        "kota": payload.get("kota") or DIGITAL_REPORT_DEFAULTS["kota"],
    }


def _fetch_omnix_digital_rows(start_date, end_date, payload: dict) -> list[dict]:
    rows = []
    offset = 0
    end_exclusive = (_as_date(end_date) + timedelta(days=1)).isoformat()

    while True:
        query = (
            supabase.table("omnix_cases")
            .select(
                "interaction_at,source_name,channel,agent_name,response_time_sec,"
                "handling_time_sec,date_first_response_interaction,date_end_interaction,"
                "brand,main_category"
            )
            .gte("interaction_at", _iso_date(start_date))
            .lt("interaction_at", end_exclusive)
            .is_("deleted_at", "null")
            .order("interaction_at")
            .range(offset, offset + SCAN_PAGE_SIZE - 1)
        )

        brand = payload.get("brand")
        if brand:
            query = query.eq("brand", brand)

        main_category = payload.get("main_category")
        if main_category:
            query = query.eq("main_category", main_category)

        response = query.execute()
        batch = response.data or []
        rows.extend(batch)

        if len(batch) < SCAN_PAGE_SIZE or len(rows) >= MAX_EXPORT_ROWS:
            break

        offset += SCAN_PAGE_SIZE

    channel_filter = _normalize_channel(payload.get("channel"))
    if not channel_filter:
        return rows

    return [
        row
        for row in rows
        if (
            _normalize_channel(row.get("source_name"))
            or _normalize_channel(row.get("channel"))
        ) == channel_filter
    ]


class ReportService:
    # ==========================================
    # LOAD DROPDOWN OPTIONS
    # ==========================================
    @staticmethod
    def get_options():
        try:
            res = supabase.rpc("report_filter_options").execute()
            data = res.data or {}

            return {
                "report_types": [
                    {
                        "label": "Traffic Digital",
                        "value": "traffic_digital",
                    },
                    {
                        "label": "Traffic Inbound",
                        "value": "traffic_inbound",
                    },
                ],
                "channels": data.get("channels", []),
                "brands": data.get("brands", []),
                "main_categories": data.get("main_categories", []),
            }

        except Exception as e:
            logger.error(f"REPORT OPTIONS ERROR : {e}", exc_info=True)

            return {
                "report_types": [],
                "channels": [],
                "brands": [],
                "main_categories": [],
            }

    # ==========================================
    # REPORT PREVIEW
    # ==========================================
    @staticmethod
    def export_preview(
        report_type,
        start_date,
        end_date,
        brand,
        channel,
        main_category,
    ):
        try:
            start_str = start_date.isoformat() if hasattr(start_date, "isoformat") else (str(start_date) if start_date else None)
            end_str = end_date.isoformat() if hasattr(end_date, "isoformat") else (str(end_date) if end_date else None)

            if report_type == "traffic_digital":
                res = supabase.rpc(
                    "report_preview_digital_daily",
                    {
                        "p_start_date": start_str,
                        "p_end_date": end_str,
                        "p_brand": brand,
                        "p_channel": channel,
                        "p_main_category": main_category,
                        "p_divisi": "",
                        "p_departemen": "",
                        "p_customer": "",
                        "p_nama_layanan": "",
                        "p_nama_sub_layanan": "",
                        "p_layanan_cc_non_cc": "",
                        "p_segment": "",
                        "p_sub_segment": "",
                        "p_kota": "",
                    },
                ).execute()
                rows = res.data or []
                for row in rows:
                    if isinstance(row.get("d_aht"), (int, float)):
                        row["d_aht"] = round(float(row["d_aht"]) * 60)
                    if isinstance(row.get("d_response_time"), (int, float)):
                        row["d_response_time"] = round(float(row["d_response_time"]) * 60)
                return rows

            elif report_type == "data_pelanggan":
                return ReportService.export_customer({
                    "start_date": start_str,
                    "end_date": end_str,
                    "brand": brand,
                    "channel": channel,
                    "main_category": main_category,
                })

            else:
                res = supabase.rpc(
                    "report_preview_inbound_daily",
                    {
                        "p_start_date": start_str,
                        "p_end_date": end_str,
                        "p_divisi": "",
                        "p_departemen": "",
                        "p_customer": "",
                        "p_nama_layanan": "",
                        "p_nama_sub_layanan": "",
                        "p_layanan_cc_non_cc": "",
                        "p_segment": "",
                        "p_sub_segment": "",
                        "p_kota": "",
                    },
                ).execute()
                return res.data or []

        except Exception as e:
            logger.error(f"REPORT PREVIEW ERROR : {e}", exc_info=True)
            return []

    # ==========================================
    # EXPORT DIGITAL
    # ==========================================
    @staticmethod
    def export_digital(payload):
        try:
            start_date = payload.get("start_date")
            end_date = payload.get("end_date")
            if not start_date or not end_date:
                return []

            counts = defaultdict(int)
            handling_times = defaultdict(list)
            response_times = defaultdict(list)
            rows = _fetch_omnix_digital_rows(start_date, end_date, payload)

            for row in rows:
                channel = (
                    _normalize_channel(row.get("source_name"))
                    or _normalize_channel(row.get("channel"))
                )
                if channel not in DIGITAL_CHANNELS:
                    continue

                day = _as_date(row.get("interaction_at"))
                key = (day, channel)
                counts[key] += 1

                # Calculate handling time (AHT) with timestamp fallback if 0
                handling_time = row.get("handling_time_sec")
                if not handling_time or float(handling_time) == 0:
                    dt_end = row.get("date_end_interaction")
                    dt_start = row.get("interaction_at")
                    if dt_end and dt_start:
                        try:
                            t1 = datetime.fromisoformat(str(dt_end).replace("Z", "+00:00"))
                            t0 = datetime.fromisoformat(str(dt_start).replace("Z", "+00:00"))
                            diff = (t1 - t0).total_seconds()
                            if diff > 0:
                                handling_time = diff
                        except Exception:
                            pass

                if handling_time and float(handling_time) > 0:
                    handling_times[key].append(float(handling_time))

                # Calculate response time (ART) with timestamp fallback if 0
                response_time = row.get("response_time_sec")
                if not response_time or float(response_time) == 0:
                    dt_first = row.get("date_first_response_interaction")
                    dt_start = row.get("interaction_at")
                    if dt_first and dt_start:
                        try:
                            t1 = datetime.fromisoformat(str(dt_first).replace("Z", "+00:00"))
                            t0 = datetime.fromisoformat(str(dt_start).replace("Z", "+00:00"))
                            diff = (t1 - t0).total_seconds()
                            if diff > 0:
                                response_time = diff
                        except Exception:
                            pass

                if response_time and float(response_time) > 0:
                    response_times[key].append(float(response_time))

            selected_channels = [
                _normalize_channel(payload.get("channel"))
            ] if _normalize_channel(payload.get("channel")) else DIGITAL_CHANNELS

            output = []
            for day in _date_range(start_date, end_date):
                for channel in selected_channels:
                    if not channel:
                        continue

                    key = (day, channel)
                    case_total = counts[key]
                    h_times = handling_times[key]
                    r_times = response_times[key]

                    avg_handling_seconds = (
                        round(sum(h_times) / len(h_times))
                        if h_times else 0
                    )
                    avg_response_seconds = (
                        round(sum(r_times) / len(r_times))
                        if r_times else 0
                    )
                    defaults = _with_report_defaults(payload, channel)

                    output.append({
                        "bulan": _month_label(day),
                        **defaults,
                        "tanggal": day.isoformat(),
                        "hari": _weekday_label(day),
                        "d_agent_digital": DIGITAL_AGENT_TARGET,
                        "d_case_in": case_total,
                        "d_case_out": case_total,
                        "d_case_out_within_sl": case_total,
                        "d_abandon": 0,
                        "d_aht": avg_handling_seconds,
                        "d_target_aht": 0,
                        "d_response_time": avg_response_seconds,
                        "d_target_response_time": 0,
                        "d_response_rate": 100 if case_total else 0,
                        "d_target_response_rate": 0,
                        "d_achievement": 100 if case_total else 0,
                        "d_analisis_kategori": "",
                        "d_analisis_detail": "",
                        "d_action_plan": "",
                    })

            return output

        except Exception as e:
            logger.error(f"DIGITAL EXPORT ERROR : {e}", exc_info=True)
            return []

    # ==========================================
    # EXPORT INBOUND
    # ==========================================
    @staticmethod
    def export_inbound(payload):
        try:
            start_date = payload.get("start_date")
            end_date = payload.get("end_date")

            rpc_payload = {
                "p_start_date": start_date.isoformat() if hasattr(start_date, "isoformat") else start_date,
                "p_end_date": end_date.isoformat() if hasattr(end_date, "isoformat") else end_date,
                "p_divisi": payload.get("divisi", ""),
                "p_departemen": payload.get("departemen", ""),
                "p_customer": payload.get("customer", ""),
                "p_nama_layanan": payload.get("nama_layanan", ""),
                "p_nama_sub_layanan": payload.get("nama_sub_layanan", ""),
                "p_layanan_cc_non_cc": payload.get("layanan_cc_non_cc", ""),
                "p_segment": payload.get("segment", ""),
                "p_sub_segment": payload.get("sub_segment", ""),
                "p_kota": payload.get("kota", ""),
            }

            res = supabase.rpc(
                "report_export_inbound_daily",
                rpc_payload,
            ).execute()

            result = []
            for row in res.data or []:
                row_date = _as_date(row.get("tanggal"))
                result.append({
                    **row,
                    "bulan": _month_label(row_date),
                    "i_aht": _duration_label(row.get("i_aht")),
                    "i_target_aht": _duration_label(row.get("i_target_aht")),
                    **_with_report_defaults({
                        **payload,
                        "segment": payload.get("segment") or "Voice",
                        "sub_segment": payload.get("sub_segment") or "Voice",
                    }, "Voice"),
                })

            return result

        except Exception as e:
            logger.error(f"VOICE EXPORT ERROR : {e}", exc_info=True)
            return []

    # ==========================================
    # EXPORT CUSTOMER DATA
    # ==========================================
    @staticmethod
    def export_customer(payload):
        try:
            start_date = payload.get("start_date")
            end_date = payload.get("end_date")
            if not start_date or not end_date:
                return []

            end_exclusive = (_as_date(end_date) + timedelta(days=1)).isoformat()

            channel_filter = str(payload.get("channel") or "").strip().lower()
            brand_filter = str(payload.get("brand") or "").strip().lower()
            main_cat_filter = str(payload.get("main_category") or "").strip().lower()

            rows = []
            offset = 0
            batch_size = 5000

            while True:
                query = (
                    supabase.table("omnix_cases")
                    .select("customer_name,customer_hp,interaction_at,channel,source_name,main_category,category,subcategory,agent_name,brand")
                    .gte("interaction_at", _iso_date(start_date))
                    .lt("interaction_at", end_exclusive)
                    .is_("deleted_at", "null")
                    .order("interaction_at")
                    .range(offset, offset + batch_size - 1)
                )

                response = query.execute()
                chunk = response.data or []
                rows.extend(chunk)
                if len(chunk) < batch_size or offset >= 500000:
                    break
                offset += batch_size

            # Excluded keywords
            EXCLUDED = {
                "test", "testing", "testing omnix", "other-testing omnix",
                "other-internal email", "other-salah sambung", "internal email", "salah sambung"
            }

            seen_hp = set()
            seen_name = set()
            filtered = []
            row_num = 1
            for r in rows:
                cat_raw = str(r.get("category") or "").strip()
                main_cat_raw = str(r.get("main_category") or "").strip()
                brand_raw = str(r.get("brand") or "").strip()
                ch_raw = str(r.get("source_name") or r.get("channel") or "").strip()
                c_name_raw = str(r.get("customer_name") or "").strip()

                cat_lower = cat_raw.lower()
                main_cat_lower = main_cat_raw.lower()

                # Exclusions
                if any(ex in cat_lower or ex in main_cat_lower for ex in EXCLUDED):
                    continue

                # Channel filter
                if channel_filter and channel_filter != "all":
                    normalized_ch = _normalize_channel(ch_raw)
                    if normalized_ch and normalized_ch.lower() != channel_filter:
                        if channel_filter not in ch_raw.lower():
                            continue

                # Brand Filter (matches brand column OR category column)
                if brand_filter and brand_filter != "all":
                    if brand_filter not in brand_raw.lower() and brand_filter not in cat_lower:
                        continue

                # Main Category Filter (matches main_category column)
                if main_cat_filter and main_cat_filter != "all":
                    if main_cat_filter not in main_cat_lower:
                        continue

                # Phone extraction & fallback (Opsi A)
                hp = str(r.get("customer_hp") or "").strip()
                if not hp or hp in {"-", "null", "none", ""}:
                    if c_name_raw and (c_name_raw.startswith("+62") or c_name_raw.startswith("62") or c_name_raw.startswith("08") or c_name_raw.startswith("'+62") or c_name_raw.startswith("'08")):
                        extracted = normalize_phone(c_name_raw.strip("'\"`"))
                        if extracted:
                            hp = extracted

                # Deduplication (Opsi B): keep only earliest interaction (awal contact)
                if hp and hp not in {"-", "null", "none", ""}:
                    if hp in seen_hp:
                        continue
                    seen_hp.add(hp)
                else:
                    name_key = c_name_raw.strip("'\"`").lower()
                    if name_key and name_key not in {"-", "null", "none", ""}:
                        if name_key in seen_name:
                            continue
                        seen_name.add(name_key)

                # Format interaction_at date nicely (DD-MM-YYYY HH:mm)
                raw_at = r.get("interaction_at")
                formatted_at = str(raw_at)
                if raw_at:
                    try:
                        dt = datetime.fromisoformat(str(raw_at).replace("Z", "+00:00"))
                        formatted_at = dt.strftime("%d-%m-%Y %H:%M")
                    except Exception:
                        pass

                clean_name = c_name_raw.strip("'\"`")
                filtered.append({
                    "No": row_num,
                    "Nama Pelanggan": clean_name or "-",
                    "Nomor HP": hp or "-",
                    "Tanggal Interaksi": formatted_at,
                    "Channel": _normalize_channel(ch_raw) or ch_raw or "-",
                    "Main Category": main_cat_raw or "-",
                    "Category": cat_raw or "-",
                })
                row_num += 1

            return filtered

        except Exception as e:
            logger.error(f"CUSTOMER DATA EXPORT ERROR : {e}", exc_info=True)
            return []

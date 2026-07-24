import logging
from collections import defaultdict
from datetime import date, datetime, timedelta

from app.core.supabase import supabase

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
    return value.strftime("%a")


def _month_label(value: date) -> str:
    return value.strftime("%Y - %m")


def _duration_label(seconds_value) -> str:
    try:
        seconds = int(round(float(seconds_value or 0)))
    except (TypeError, ValueError):
        seconds = 0

    minutes, seconds = divmod(max(seconds, 0), 60)
    return f"{minutes}:{seconds:02d}"


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

        if len(batch) < SCAN_PAGE_SIZE:
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

                response_time = row.get("response_time_sec")
                if response_time is not None:
                    response_times[key].append(float(response_time or 0))

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
                    times = response_times[key]
                    avg_response_seconds = (
                        round(sum(times) / len(times))
                        if times else 0
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
                        "d_aht": _duration_label(0),
                        "d_target_aht": _duration_label(0),
                        "d_response_time": _duration_label(avg_response_seconds),
                        "d_target_response_time": _duration_label(0),
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

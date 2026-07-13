from app.core.supabase import supabase


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
            print(f"REPORT OPTIONS ERROR : {e}")

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

            if report_type == "traffic_digital":

                res = supabase.rpc(
                    "report_preview_digital_daily",
                    {
                        "p_start_date": start_date.isoformat() if start_date else None,
                        "p_end_date": end_date.isoformat() if end_date else None,
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
                        "p_start_date": start_date.isoformat() if start_date else None,
                        "p_end_date": end_date.isoformat() if end_date else None,
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
            print(f"REPORT PREVIEW ERROR : {e}")
            return []

    # ==========================================
    # EXPORT DIGITAL
    # ==========================================
    @staticmethod
    def export_digital(payload):
        try:
            start_date = payload.get("start_date")
            end_date = payload.get("end_date")

            rpc_payload = {
                "p_start_date": start_date.isoformat() if hasattr(start_date, "isoformat") else start_date,
                "p_end_date": end_date.isoformat() if hasattr(end_date, "isoformat") else end_date,
                "p_brand": payload.get("brand", ""),
                "p_channel": payload.get("channel", ""),
                "p_main_category": payload.get("main_category", ""),
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
                "report_export_digital_daily",
                rpc_payload,
            ).execute()

            return res.data or []

        except Exception as e:
            print(f"DIGITAL EXPORT ERROR : {e}")
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

            return res.data or []

        except Exception as e:
            print(f"VOICE EXPORT ERROR : {e}")
            return []

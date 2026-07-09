from app.core.supabase import supabase

class ReportService:
    # ==========================================
    # LOAD DROPDOWN OPTIONS
    # ==========================================
    @staticmethod
    def get_options():
        """
        Mengambil opsi filter dari database menggunakan RPC.
        Memastikan report_types tetap ada meskipun RPC mengembalikan data filter lainnya.
        """
        try:
            res = supabase.rpc("report_filter_options").execute()
            data = res.data or {}
            
            return {
                "report_types": [
                    {"label": "Traffic Digital", "value": "traffic_digital"},
                    {"label": "Traffic Inbound", "value": "traffic_inbound"},
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
    # EXPORT PREVIEW
    # ==========================================
    @staticmethod
    def export_preview(report_type, start_date, end_date, brand, channel, main_category):
        """
        Mengambil preview data laporan. 
        Mengembalikan object dict sesuai return type RPC report_preview.
        """
        try:
            res = supabase.rpc(
                "report_preview",
                {
                    "p_report_type": report_type,
                    "p_start_date": start_date,
                    "p_end_date": end_date,
                    "p_brand": brand,
                    "p_channel": channel,
                    "p_main_category": main_category,
                },
            ).execute()
            
            return res.data or {}
        except Exception as e:
            print(f"REPORT PREVIEW ERROR : {e}")
            return {}

    # ==========================================
    # EXPORT DIGITAL
    # ==========================================
    @staticmethod
    def export_digital(payload):
        try:
            res = supabase.rpc("report_export_digital_daily", payload).execute()
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
            res = supabase.rpc("report_export_inbound_daily", payload).execute()
            return res.data or []
        except Exception as e:
            print(f"VOICE EXPORT ERROR : {e}")
            return []
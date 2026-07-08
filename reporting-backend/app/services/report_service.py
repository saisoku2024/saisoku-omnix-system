from app.core.supabase import supabase

class ReportService:
    # ==========================================
    # LOAD DROPDOWN OPTIONS
    # ==========================================
    @staticmethod
    def get_options():
        try:
            # Menggunakan query direct ke tabel sesuai struktur yang sudah Anda buat
            channels = supabase.table("omnix_cases").select("channel").not_.is_("channel", "null").execute()
            brands = supabase.table("omnix_cases").select("category").not_.is_("category", "null").execute()
            main_categories = supabase.table("omnix_cases").select("main_category").not_.is_("main_category", "null").execute()

            return {
                "report_types": [
                    {"label": "Traffic Digital", "value": "traffic_digital"},
                    {"label": "Traffic Inbound", "value": "traffic_inbound"}
                ],
                "channels": sorted(list({r["channel"] for r in (channels.data or []) if r.get("channel")})),
                "brands": sorted(list({r["category"] for r in (brands.data or []) if r.get("category")})),
                "main_categories": sorted(list({r["main_category"] for r in (main_categories.data or []) if r.get("main_category")})),
            }
        except Exception as e:
            print(f"ERROR REPORT OPTIONS: {e}")
            return {"report_types": [], "channels": [], "brands": [], "main_categories": []}

    # ==========================================
    # EXPORT PREVIEW
    # ==========================================
    @staticmethod
    def export_preview(start_date, end_date, brand, channel, main_category):
        try:
            res = supabase.rpc(
                "report_preview",
                {
                    "p_start_date": start_date,
                    "p_end_date": end_date,
                    "p_brand": brand,
                    "p_channel": channel,
                    "p_main_category": main_category,
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
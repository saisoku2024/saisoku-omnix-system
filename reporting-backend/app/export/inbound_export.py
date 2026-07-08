from app.export.excel_service import ExcelService


class InboundExport:

    HEADERS = [
        "Bulan",
        "Divisi",
        "Departemen",
        "Customer",
        "Nama Layanan",
        "Nama Sub-Layanan",
        "Layanan CC / Non CC",
        "Segment",
        "Sub Segment",
        "Kota",
        "Tanggal",
        "Hari",
        "I Agent Inbound",
        "I Call Offered",
        "I ACD",
        "I ACD within SL",
        "I Target SL (Detik)",
        "I Abandon",
        "I AHT (Detik)",
        "I Target AHT (Detik)",
        "I SL (%)",
        "I Target SL (%)",
        "I SCR (%)",
        "I Target SCR (%)",
        "I Achievement Inbound",
        "I Inbound Analisis Ketidaktercapaian (Kategori)",
        "I Inbound Action Plan",
    ]

    @staticmethod
    def generate(data: list):

        wb, ws = ExcelService.create_workbook("Traffic Inbound")

        # Header
        ExcelService.write_headers(
            ws,
            InboundExport.HEADERS,
        )

        rows = []

        for item in data:

            rows.append([
                item.get("bulan"),
                item.get("divisi"),
                item.get("departemen"),
                item.get("customer"),
                item.get("nama_layanan"),
                item.get("nama_sub_layanan"),
                item.get("layanan_cc_non_cc"),
                item.get("segment"),
                item.get("sub_segment"),
                item.get("kota"),
                item.get("tanggal"),
                item.get("hari"),
                item.get("i_agent_inbound"),
                item.get("i_call_offered"),
                item.get("i_acd"),
                item.get("i_acd_within_sl"),
                item.get("i_target_sl_detik"),
                item.get("i_abandon"),
                item.get("i_aht"),
                item.get("i_target_aht"),
                item.get("i_sl"),
                item.get("i_target_sl"),
                item.get("i_scr"),
                item.get("i_target_scr"),
                item.get("i_achievement"),
                item.get("i_analisis_kategori"),
                item.get("i_action_plan"),
            ])

        ExcelService.write_rows(
            ws,
            rows,
        )

        ExcelService.auto_width(ws)

        return ExcelService.to_bytes(wb)
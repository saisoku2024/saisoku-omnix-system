from app.export.excel_service import ExcelService


class DigitalExport:

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
        "D Agent Digital",
        "D Case In",
        "D Case Out",
        "D Case Out within SL",
        "D Abandon",
        "D AHT (Minute)",
        "D Target AHT (Minute)",
        "D Response Time (Minute)",
        "D Target Response Time (Minute)",
        "D Response Rate",
        "D Target Response Rate",
        "D Achievement Digital",
        "D Digital Analisis Ketidaktercapaian (Kategori)",
        "D Digital Analisis Ketidaktercapaian (Detail)",
        "D Digital Action Plan",
    ]

    @staticmethod
    def generate(data: list):

        wb, ws = ExcelService.create_workbook("Traffic Digital")

        # Header
        ExcelService.write_headers(
            ws,
            DigitalExport.HEADERS,
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
                item.get("d_agent_digital"),
                item.get("d_case_in"),
                item.get("d_case_out"),
                item.get("d_case_out_within_sl"),
                item.get("d_abandon"),
                item.get("d_aht"),
                item.get("d_target_aht"),
                item.get("d_response_time"),
                item.get("d_target_response_time"),
                item.get("d_response_rate"),
                item.get("d_target_response_rate"),
                item.get("d_achievement"),
                item.get("d_analisis_kategori"),
                item.get("d_analisis_detail"),
                item.get("d_action_plan"),
            ])

        ExcelService.write_rows(
            ws,
            rows,
        )

        ExcelService.auto_width(ws)

        return ExcelService.to_bytes(wb)
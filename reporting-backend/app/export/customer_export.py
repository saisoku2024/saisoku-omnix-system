from app.export.excel_service import ExcelService


class CustomerExport:

    HEADERS = [
        "No",
        "Nama Pelanggan",
        "Nomor HP",
        "Tanggal Interaksi",
        "Channel",
        "Main Category",
        "Category",
        "Subcategory",
        "Agent Name",
    ]

    @staticmethod
    def generate(data: list):

        wb, ws = ExcelService.create_workbook("Data Pelanggan")

        # Header
        ExcelService.write_headers(
            ws,
            CustomerExport.HEADERS,
        )

        rows = []

        for idx, item in enumerate(data, 1):
            rows.append([
                idx,
                item.get("customer_name") or "-",
                item.get("customer_hp") or "-",
                item.get("interaction_at") or "-",
                item.get("channel") or item.get("source_name") or "-",
                item.get("main_category") or "-",
                item.get("category") or "-",
                item.get("subcategory") or "-",
                item.get("agent_name") or "-",
            ])

        ExcelService.write_rows(
            ws,
            rows,
        )

        ExcelService.auto_width(ws)

        return ExcelService.to_bytes(wb)

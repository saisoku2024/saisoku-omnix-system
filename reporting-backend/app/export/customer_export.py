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
                item.get("Nama Pelanggan") or item.get("customer_name") or "-",
                item.get("Nomor HP") or item.get("customer_hp") or "-",
                item.get("Tanggal Interaksi") or item.get("interaction_at") or "-",
                item.get("Channel") or item.get("channel") or "-",
                item.get("Main Category") or item.get("main_category") or "-",
                item.get("Category") or item.get("category") or "-",
            ])

        ExcelService.write_rows(
            ws,
            rows,
        )

        ExcelService.auto_width(ws)

        return ExcelService.to_bytes(wb)

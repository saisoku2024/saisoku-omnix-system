from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.services.principal_service import get_principal_report
import pandas as pd
import io

router = APIRouter(
    prefix="/principal-report",
    tags=["Principal Report"]
)

@router.get("/export")
def export_principal_report(start_date: str, end_date: str):
    
    # 1. Ambil data dengan fallback jika None
    data = get_principal_report(start_date, end_date)
    if not data:
        data = []

    df = pd.DataFrame(data)

    # 2. Urutan kolom final (dipindah ke atas sebagai template)
    final_columns = [
        "Ticket ID", "Customer Name", "Customer Phone", "Contact Channel",
        "Ticket Created Date", "First Response Time", "Ticket Resolved Time",
        "Main Category", "Subcategory", "Detail Subcategory",
        "Principal Group", "Principal Category", "Ticket Status",
        "Resolution / Feedback", "CSAT Survey Dispatch Status",
        "CSAT Response Status", "CSAT Score"
    ]

    # 3. Handle jika data dari database kosong
    if df.empty:
        # Buat dataframe kosong tapi tetap memiliki header agar Excel rapi
        df = pd.DataFrame(columns=final_columns)
    else:
        # ==========================================
        # FORMAT TANGGAL
        # ==========================================
        date_cols = [
            "interaction_at",
            "date_first_response_interaction",
            "date_end_interaction"
        ]
        
        for col in date_cols:
            if col in df.columns:
                df[col] = (
                    pd.to_datetime(df[col], errors="coerce")
                    .dt.strftime("%Y-%m-%d %H:%M:%S")
                )

        # ==========================================
        # FORMAT TICKET STATUS (Handle String & Boolean)
        # ==========================================
        if "is_escalated" in df.columns:
            df["is_escalated"] = (
                df["is_escalated"]
                .replace({
                    True: "Escalated",
                    False: "Not Escalated",
                    "true": "Escalated",
                    "false": "Not Escalated",
                    "escalated": "Escalated",
                    "not escalated": "Not Escalated"
                })
                .fillna("Not Escalated")
            )

        # ==========================================
        # FORMAT CSAT
        # ==========================================
        if "rating_csat" in df.columns:
            df["rating_csat"] = (
                df["rating_csat"]
                .fillna("")
                .astype(str)
                .replace({"nan": "", "None": ""})
            )

        # ==========================================
        # RENAME KOLOM
        # ==========================================
        df = df.rename(columns={
            "ticket_id": "Ticket ID",
            "customer_name": "Customer Name",
            "customer_hp": "Customer Phone",
            "source_name": "Contact Channel",
            "interaction_at": "Ticket Created Date",
            "date_first_response_interaction": "First Response Time",
            "date_end_interaction": "Ticket Resolved Time",
            "main_category": "Main Category",
            "subcategory": "Subcategory",
            "detail_subcategory": "Detail Subcategory",
            "principal_group": "Principal Group",
            "principal_category": "Principal Category",
            "is_escalated": "Ticket Status",
            "feedback": "Resolution / Feedback",
            "csat_dispatch_status": "CSAT Survey Dispatch Status",
            "csat_response_status": "CSAT Response Status",
            "rating_csat": "CSAT Score"
        })

        # ==========================================
        # FILTER SESUAI URUTAN FINAL
        # ==========================================
        existing_columns = [c for c in final_columns if c in df.columns]
        df = df[existing_columns]

    # Bersihkan sisa nilai kosong/NaN
    df = df.fillna("")

    # ==========================================
    # PROSES EXPORT KE EXCEL
    # ==========================================
    output = io.BytesIO()

    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Principal Report")
        worksheet = writer.sheets["Principal Report"]

        # Auto-adjust lebar kolom
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter

            for cell in column:
                try:
                    max_length = max(max_length, len(str(cell.value)))
                except Exception:
                    pass

            worksheet.column_dimensions[column_letter].width = min(max_length + 3, 60)

    # Kembalikan pointer file ke awal
    output.seek(0)

    # Format header dipasang kutip agar aman
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="principal_report_{start_date}_{end_date}.xlsx"'
        }
    )

@router.get("/summary")
def get_summary(
    start_date: str,
    end_date: str
):
    data = get_principal_report(
        start_date,
        end_date
    )

    total_ticket = len(data)

    csat_response = len([
        x for x in data
        if str(
            x.get("csat_response_status", "")
        ).upper() == "Y"
    ])

    response_rate = (
        round(
            (csat_response / total_ticket) * 100,
            2
        )
        if total_ticket > 0
        else 0
    )

    return {
        "total_ticket": total_ticket,
        "csat_response": csat_response,
        "response_rate": f"{response_rate}%"
    }
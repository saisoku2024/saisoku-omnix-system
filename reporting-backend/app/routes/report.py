from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.core.security import require_admin_token
from app.services.report_service import ReportService
from app.export.digital_export import DigitalExport
from app.export.inbound_export import InboundExport
from app.schemas.report import PreviewRequest, ExportRequest

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
    dependencies=[Depends(require_admin_token)],
)

# ==========================================
# LOAD REPORT FILTER OPTIONS
# ==========================================
@router.get("/options")
def report_options():
    """
    Load dropdown options for Report Center.
    """
    return ReportService.get_options()


# ==========================================
# REPORT PREVIEW
# ==========================================
@router.post("/preview")
def report_preview(req: PreviewRequest):
    try:
        return ReportService.export_preview(
            report_type=req.report_type,
            channel=req.channel,
            brand=req.brand,
            main_category=req.main_category,
            start_date=req.start_date,
            end_date=req.end_date,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Gagal memuat preview laporan")


# ==========================================
# EXPORT EXCEL
# ==========================================
@router.post(
    "/export/digital",
    response_class=StreamingResponse,
)
def export_digital(
    req: ExportRequest,
):
    try:
        data = ReportService.export_digital(req.model_dump())
        if not data:
            raise HTTPException(status_code=404, detail="No data found for Digital Export.")
            
        excel = DigitalExport.generate(data)
        filename = f"traffic_digital_{datetime.now():%Y%m%d_%H%M%S}.xlsx"
        
        return StreamingResponse(
            excel,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail="Gagal melakukan ekspor laporan digital")


@router.post(
    "/export/inbound",
    response_class=StreamingResponse,
)
def export_inbound(
    req: ExportRequest,
):
    try:
        data = ReportService.export_inbound(req.model_dump())
        if not data:
            raise HTTPException(status_code=404, detail="No data found for Inbound Export.")
            
        excel = InboundExport.generate(data)
        filename = f"traffic_inbound_{datetime.now():%Y%m%d_%H%M%S}.xlsx"
        
        return StreamingResponse(
            excel,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail="Gagal melakukan ekspor laporan inbound")

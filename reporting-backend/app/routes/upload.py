from fastapi import APIRouter, HTTPException
from app.services.upload_service import process_upload

router = APIRouter()


@router.post("/process/{upload_id}")
def process_uploaded_file(upload_id: str):
    try:
        result = process_upload(upload_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.app.database import get_analysis_by_id
from backend.app.config import REPORTS_DIR

router = APIRouter(prefix="/api/reports", tags=["Forensic Reports"])

@router.get("/{analysis_id}/pdf")
def download_pdf_report(analysis_id: str):
    record = get_analysis_by_id(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    analysis_type = record.get("analysis_type", "email")
    pdf_filename = f"report_{analysis_type}_{analysis_id}.pdf"
    pdf_path = REPORTS_DIR / pdf_filename

    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF report file for {analysis_id} not found.")

    return FileResponse(
        path=str(pdf_path),
        filename=pdf_filename,
        media_type="application/pdf"
    )

@router.get("/{analysis_id}")
def get_report_metadata(analysis_id: str):
    record = get_analysis_by_id(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    return {
        "analysis_id": analysis_id,
        "timestamp": record.get("timestamp"),
        "analysis_type": record.get("analysis_type"),
        "classification": record.get("classification"),
        "risk_level": record.get("risk_level"),
        "overall_score": record.get("overall_score"),
        "pdf_download_url": f"/api/reports/{analysis_id}/pdf"
    }

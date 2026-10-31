from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.app.database import get_recent_analyses, get_analysis_by_id

router = APIRouter(prefix="/api/history", tags=["Analysis History"])
analysis_router = APIRouter(prefix="/api/analysis", tags=["Analysis Details"])

@router.get("")
def list_history(
    limit: int = Query(50, ge=1, le=100),
    type: Optional[str] = Query(None, description="'email' or 'image'")
):
    records = get_recent_analyses(limit=limit, analysis_type=type)
    return {
        "count": len(records),
        "items": records
    }

@router.get("/{analysis_id}")
def get_analysis_details(analysis_id: str):
    record = get_analysis_by_id(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Analysis with ID '{analysis_id}' not found.")
    return record

@analysis_router.get("/{analysis_id}")
def get_analysis_by_alias(analysis_id: str):
    return get_analysis_details(analysis_id)

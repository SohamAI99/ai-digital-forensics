from fastapi import APIRouter
from backend.app.database import get_dashboard_summary
from backend.app.services.email_detector import email_detector_service
from backend.app.services.vision_detector import vision_detector_service
from backend.app.schemas import DashboardSummaryResponse

router = APIRouter(prefix="/api", tags=["Dashboard & System"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "email_model_loaded": email_detector_service.is_loaded,
        "vision_model_loaded": vision_detector_service.is_loaded,
        "email_model_type": type(email_detector_service.model).__name__ if email_detector_service.model else "None",
        "vision_model_name": vision_detector_service.MODEL_NAME,
        "vision_device": str(vision_detector_service.device)
    }

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_summary():
    summary_data = get_dashboard_summary()
    return DashboardSummaryResponse(**summary_data)

@router.get("/evaluation/metrics")
def get_evaluation_metrics():
    return email_detector_service.evaluation_meta

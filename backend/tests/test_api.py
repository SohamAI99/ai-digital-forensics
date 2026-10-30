import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["email_model_loaded"] is True
    assert data["vision_model_loaded"] is True

def test_dashboard_summary_endpoint():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "email_total" in data
    assert "image_total" in data
    assert "recent_activity" in data

def test_email_analyze_endpoint():
    response = client.post(
        "/api/email/analyze",
        data={"email_text": "URGENT: Click here to verify your banking credentials immediately or account will be locked."}
    )
    assert response.status_code == 200
    data = response.json()
    assert "analysis_id" in data
    assert data["prediction"] == "Phishing Email"
    assert data["risk_level"] in ["High Risk", "Medium Risk"]
    assert len(data["evidence"]) > 0

def test_history_endpoint():
    response = client.get("/api/history")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["count"] >= 1

def test_evaluation_metrics_endpoint():
    response = client.get("/api/evaluation/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "accuracy" in data["metrics"]
    assert data["metrics"]["accuracy"] >= 0.90

def test_image_analyze_endpoint():
    import numpy as np
    import cv2
    img = np.ones((120, 120, 3), dtype=np.uint8) * 150
    _, buf = cv2.imencode(".jpg", img)
    response = client.post(
        "/api/image/analyze",
        files={"file": ("test_sample.jpg", buf.tobytes(), "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "analysis_id" in data
    assert "prediction" in data
    assert "deepfake_probability" in data
    assert "gradcam_url" in data
    assert "frequency" in data

    # Test report PDF download endpoint
    analysis_id = data["analysis_id"]
    rep_resp = client.get(f"/api/reports/{analysis_id}/pdf")
    assert rep_resp.status_code == 200
    assert rep_resp.headers["content-type"] == "application/pdf"

    # Test single history item endpoint
    hist_resp = client.get(f"/api/history/{analysis_id}")
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert hist_data["id"] == analysis_id

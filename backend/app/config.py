import os
from pathlib import Path
# Standard configuration

# Base paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
os.environ.setdefault("TORCH_HOME", str(PROJECT_ROOT / ".cache" / "torch"))
BACKEND_DIR = PROJECT_ROOT / "backend"
STORAGE_DIR = BACKEND_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
ARTIFACTS_DIR = STORAGE_DIR / "artifacts"
REPORTS_DIR = STORAGE_DIR / "reports"
DATABASE_PATH = STORAGE_DIR / "forensics.db"

MODEL_PATH = PROJECT_ROOT / "phishing_email_model.joblib"
EVALUATION_PATH = BACKEND_DIR / "evaluation_results.json"

# Create directories
for d in [STORAGE_DIR, UPLOADS_DIR, ARTIFACTS_DIR, REPORTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Risk Thresholds
RISK_LOW_MAX = 30.0
RISK_MEDIUM_MAX = 70.0

# External API Keys (environment variables with empty fallbacks)
VIRUSTOTAL_API_KEY = os.environ.get("VIRUSTOTAL_API_KEY", "")
PHISHTANK_API_KEY = os.environ.get("PHISHTANK_API_KEY", "")

# Server Config
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", 8000))
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

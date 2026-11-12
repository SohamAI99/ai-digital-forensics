import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from backend.app.config import ARTIFACTS_DIR, REPORTS_DIR, CORS_ORIGINS
from backend.app.database import init_db

from backend.app.api.email_routes import router as email_router
from backend.app.api.image_routes import router as image_router
from backend.app.api.dashboard_routes import router as dashboard_router
from backend.app.api.history_routes import router as history_router, analysis_router
from backend.app.api.reports_routes import router as reports_router, report_singular_router

# Initialize database tables
init_db()

app = FastAPI(
    title="Integrated AI & Digital Forensic Framework API",
    description="Backend API for Email Phishing Threat Detection and Deepfake Image Forensics.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static artifacts and reports directories
app.mount("/artifacts", StaticFiles(directory=str(ARTIFACTS_DIR)), name="artifacts")
app.mount("/reports", StaticFiles(directory=str(REPORTS_DIR)), name="reports")

# Include Routers
app.include_router(dashboard_router)
app.include_router(email_router)
app.include_router(image_router)
app.include_router(history_router)
app.include_router(analysis_router)
app.include_router(reports_router)
app.include_router(report_singular_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Never expose raw traces to frontend; return safe message
    print(f"[Unhandled Error] {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred while processing the forensic request."}
    )

if __name__ == "__main__":
    import uvicorn
    from backend.app.config import HOST, PORT
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=True)

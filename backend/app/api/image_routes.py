import uuid
import cv2
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.app.schemas import ImageAnalyzeResponse, ExifMetadata, FrequencyMetrics, EvidenceItem
from backend.app.services.image_preprocessor import image_preprocessor_service
from backend.app.services.exif_service import exif_service
from backend.app.services.frequency_analyzer import frequency_analyzer_service
from backend.app.services.vision_detector import vision_detector_service
from backend.app.services.report_service import report_service
from backend.app.database import insert_analysis
from backend.app.config import ARTIFACTS_DIR

router = APIRouter(prefix="/api/image", tags=["Image Forensics"])

@router.post("/analyze", response_model=ImageAnalyzeResponse)
async def analyze_image(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No image file uploaded.")

    filename = file.filename or "uploaded_image.jpg"
    contents = await file.read()
    analysis_id = f"IMG-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now(timezone.utc).isoformat()

    # 1. Validate and load image + compute cryptographic SHA-256
    try:
        img_bgr, pil_img, metadata = image_preprocessor_service.validate_and_load(contents, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing error: {e}")

    sha256_hash = metadata.get("sha256") or hashlib.sha256(contents).hexdigest()

    # Save original image to artifacts
    orig_filename = f"orig_{analysis_id}.jpg"
    orig_path = ARTIFACTS_DIR / orig_filename
    cv2.imwrite(str(orig_path), img_bgr)
    orig_url = f"/artifacts/{orig_filename}"

    # 2. EXIF Metadata Extraction
    exif_res = exif_service.extract_exif(pil_img)

    # 3. Face Detection & Cropping (with center-crop fallback)
    face_detected, face_crop_url, face_crop_bgr = image_preprocessor_service.detect_and_crop_face(img_bgr, analysis_id)

    # 4. Frequency Analysis (FFT and DCT)
    freq_res = frequency_analyzer_service.analyze(face_crop_bgr, analysis_id)

    # 5. Vision Classifier & Grad-CAM Heatmap
    vision_res = vision_detector_service.predict_and_explain(face_crop_bgr, analysis_id)

    # 6. Evidence and Risk Formulation
    evidence = []
    deepfake_prob = vision_res["deepfake_probability"]
    base_vision_score = deepfake_prob * 60.0

    if deepfake_prob >= 0.70:
        evidence.append(EvidenceItem(
            category="model",
            title="High Probability of Synthetic Manipulation",
            description=f"Neural vision classifier estimated {deepfake_prob*100:.1f}% probability of generative or facial manipulation artifacts.",
            severity="high",
            score_impact=round(base_vision_score, 1)
        ))
    elif deepfake_prob >= 0.40:
        evidence.append(EvidenceItem(
            category="model",
            title="Borderline Manipulation Indicators",
            description=f"Classifier detected subtle structural anomalies ({deepfake_prob*100:.1f}% probability).",
            severity="medium",
            score_impact=round(base_vision_score, 1)
        ))
    else:
        evidence.append(EvidenceItem(
            category="model",
            title="Pristine Natural Image Profile",
            description=f"Model detected natural pixel distributions ({vision_res['pristine_probability']*100:.1f}% authentic probability).",
            severity="low",
            score_impact=round(base_vision_score, 1)
        ))

    # Frequency Evidence
    freq_score = 0.0
    if freq_res["azimuthal_deviation"] > 8.0:
        freq_score += 15.0
        evidence.append(EvidenceItem(
            category="frequency",
            title="Periodic Frequency Spikes Detected",
            description="Azimuthal deviation indicates directional periodicity characteristic of GAN upsampling filters.",
            severity="medium",
            score_impact=15.0
        ))
    if freq_res["high_freq_ratio"] > 0.45:
        freq_score += 10.0
        evidence.append(EvidenceItem(
            category="frequency",
            title="Elevated High-Frequency Residual Energy",
            description=f"High frequency energy ratio is {freq_res['high_freq_ratio']*100:.1f}%, reflecting unnatural edge noise or sharpening.",
            severity="medium",
            score_impact=10.0
        ))

    # EXIF Evidence
    exif_score = 0.0
    if exif_res.get("software"):
        exif_score += 15.0
        evidence.append(EvidenceItem(
            category="exif",
            title="Image Editing Software Traces in Header",
            description=f"Software metadata tag: {exif_res['software']}",
            severity="high",
            score_impact=15.0
        ))
    elif not exif_res.get("has_exif"):
        evidence.append(EvidenceItem(
            category="exif",
            title="Absence of Camera Sensor EXIF",
            description="No camera metadata found. Common in social platforms and synthetic images.",
            severity="info",
            score_impact=0.0
        ))

    total_risk = min(100.0, max(0.0, round(base_vision_score + freq_score + exif_score, 1)))
    if total_risk >= 70.0:
        risk_level = "High Risk"
    elif total_risk >= 30.0:
        risk_level = "Medium Risk"
    else:
        risk_level = "Low Risk"

    checks_performed = [
        "Cryptographic SHA-256 image integrity verification",
        "Pillow EXIF hardware and software metadata parsing",
        "OpenCV facial landmark and region extraction",
        "NumPy 2D Fast Fourier Transform (FFT) log-magnitude spectrum",
        "SciPy 2D Discrete Cosine Transform (DCT) energy distribution",
        "PyTorch CNN spatial-residual feature inference",
        "Grad-CAM visual convolutional layer attribution"
    ]

    checks_unavailable = [
        "Camera sensor photo-response non-uniformity (PRNU) fingerprint verification",
        "C2PA cryptographic content authenticity credential check"
    ]

    limitations = [
        "Absence of EXIF metadata is typical on web platforms and does not alone constitute manipulation proof.",
        "Grad-CAM demonstrates model attention regions, not definitive spatial boundaries of synthetic editing.",
        "Heavily compressed social media images may suppress high-frequency generative traces."
    ]

    # 7. Generate PDF Report
    report_dict = {
        "analysis_id": analysis_id,
        "filename": filename,
        "sha256": sha256_hash,
        "prediction": vision_res["prediction"],
        "deepfake_probability": vision_res["deepfake_probability"],
        "pristine_probability": vision_res["pristine_probability"],
        "risk_level": risk_level,
        "overall_risk_score": total_risk,
        "dimensions": [metadata["width"], metadata["height"]],
        "exif": exif_res,
        "frequency": freq_res,
        "evidence": [ev.model_dump() for ev in evidence]
    }
    
    report_pdf_path = None
    try:
        report_pdf_path = report_service.generate_image_pdf(analysis_id, report_dict)
    except Exception as e:
        print(f"[ImageRouter] PDF report error: {e}")

    # 8. Persist to Database
    insert_analysis(
        analysis_id=analysis_id,
        analysis_type="image",
        identifier=filename,
        classification=vision_res["prediction"],
        risk_level=risk_level,
        overall_score=total_risk,
        summary=f"Image evaluated as {vision_res['prediction']} (Deepfake score: {vision_res['deepfake_probability']*100:.1f}%).",
        details={
            "prediction": vision_res["prediction"],
            "deepfake_probability": vision_res["deepfake_probability"],
            "pristine_probability": vision_res["pristine_probability"],
            "face_detected": face_detected,
            "dimensions": [metadata["width"], metadata["height"]],
            "sha256": sha256_hash,
            "file_size_bytes": len(contents),
            "exif_has_data": exif_res.get("has_exif", False),
            "high_freq_ratio": freq_res.get("high_freq_ratio"),
            "evidence_list": [ev.model_dump() for ev in evidence]
        },
        report_pdf_path=report_pdf_path
    )

    return ImageAnalyzeResponse(
        analysis_id=analysis_id,
        timestamp=timestamp,
        filename=filename,
        sha256=sha256_hash,
        file_size_bytes=len(contents),
        dimensions=[metadata["width"], metadata["height"]],
        prediction=vision_res["prediction"],
        deepfake_probability=vision_res["deepfake_probability"],
        pristine_probability=vision_res["pristine_probability"],
        risk_level=risk_level,
        overall_risk_score=total_risk,
        face_detected=face_detected,
        face_crop_url=face_crop_url,
        original_image_url=orig_url,
        exif=ExifMetadata(**exif_res),
        frequency=FrequencyMetrics(**freq_res),
        gradcam_url=vision_res.get("gradcam_url"),
        evidence=evidence,
        checks_performed=checks_performed,
        checks_unavailable=checks_unavailable,
        limitations=limitations
    )

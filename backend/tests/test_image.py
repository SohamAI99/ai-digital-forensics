import cv2
import numpy as np
import pytest
from PIL import Image
import io
import hashlib
from backend.app.services.image_preprocessor import image_preprocessor_service
from backend.app.services.exif_service import exif_service
from backend.app.services.frequency_analyzer import frequency_analyzer_service
from backend.app.services.vision_detector import vision_detector_service

def create_synthetic_image_bytes(w=200, h=200, add_face=True) -> bytes:
    # Create simple RGB image
    img = np.ones((h, w, 3), dtype=np.uint8) * 128
    if add_face:
        # Draw a synthetic circle and features resembling face geometry
        cv2.circle(img, (100, 100), 50, (200, 180, 150), -1)
        cv2.circle(img, (85, 90), 8, (50, 50, 50), -1)
        cv2.circle(img, (115, 90), 8, (50, 50, 50), -1)
        cv2.ellipse(img, (100, 120), (20, 10), 0, 0, 180, (50, 50, 50), 3)

    is_success, buffer = cv2.imencode(".jpg", img)
    return buffer.tobytes()

def test_image_validation_valid():
    data = create_synthetic_image_bytes(100, 100)
    img_bgr, pil_img, meta = image_preprocessor_service.validate_and_load(data, "test.jpg")
    assert img_bgr.shape == (100, 100, 3)
    assert meta["width"] == 100
    assert meta["height"] == 100
    assert "sha256" in meta
    assert meta["sha256"] == hashlib.sha256(data).hexdigest()

def test_image_sha256_integrity():
    data = create_synthetic_image_bytes(80, 80)
    expected_hash = hashlib.sha256(data).hexdigest()
    _, _, meta = image_preprocessor_service.validate_and_load(data, "integrity_test.jpg")
    assert meta["sha256"] == expected_hash
    assert len(meta["sha256"]) == 64

def test_image_validation_corrupt():
    corrupt_data = b"NOT_A_VALID_IMAGE_HEADER_BYTES"
    with pytest.raises(ValueError) as exc:
        image_preprocessor_service.validate_and_load(corrupt_data, "bad.jpg")
    assert "Corrupted image file" in str(exc.value)

def test_face_crop_or_fallback():
    data = create_synthetic_image_bytes(200, 200, add_face=False)
    img_bgr, _, _ = image_preprocessor_service.validate_and_load(data, "test.jpg")
    detected, crop_url, crop_bgr = image_preprocessor_service.detect_and_crop_face(img_bgr, "TEST-01")
    assert crop_bgr is not None
    assert crop_url.startswith("/artifacts/crop_")

def test_frequency_analysis_fft_dct():
    img_bgr = np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8)
    res = frequency_analyzer_service.analyze(img_bgr, "FREQ-TEST")
    assert "fft_spectrum_url" in res
    assert "dct_spectrum_url" in res
    assert res["high_freq_ratio"] >= 0.0
    assert res["spectral_centroid"] > 0.0

def test_vision_detector_gradcam():
    img_bgr = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    res = vision_detector_service.predict_and_explain(img_bgr, "VIS-TEST")
    assert "prediction" in res
    assert "deepfake_probability" in res
    assert "pristine_probability" in res
    assert res["gradcam_url"] is not None

def test_exif_service_synthetic():
    data = create_synthetic_image_bytes(120, 120, add_face=False)
    _, pil_img, _ = image_preprocessor_service.validate_and_load(data, "test.jpg")
    exif = exif_service.extract_exif(pil_img, file_bytes=data, filename="test.jpg")
    assert "file_properties" in exif
    assert exif["file_properties"]["dimensions"] == "120 x 120 px"
    assert "metadata_verdict" in exif
    assert "raw_tags" in exif

def test_exif_ai_prompt_detection():
    from PIL import PngImagePlugin
    img = Image.new("RGB", (64, 64))
    png_info = PngImagePlugin.PngInfo()
    png_info.add_text("parameters", "photorealistic portrait, Steps: 25, Sampler: Euler a, CFG scale: 7, Seed: 42")
    buf = io.BytesIO()
    img.save(buf, format="PNG", pnginfo=png_info)
    png_bytes = buf.getvalue()
    buf.seek(0)
    pil_img = Image.open(buf)
    res = exif_service.extract_exif(pil_img, file_bytes=png_bytes, filename="ai_gen.png")
    assert res["ai_generation_detected"] is True
    assert any("Stable Diffusion" in sig for sig in res["ai_tool_signatures"])
    assert res["metadata_risk_score"] >= 90.0
    assert any("Generative AI metadata" in flag for flag in res["anomaly_flags"])

def test_exif_software_editing_detection():
    from PIL import PngImagePlugin
    img = Image.new("RGB", (64, 64))
    png_info = PngImagePlugin.PngInfo()
    png_info.add_text("Software", "Adobe Photoshop 2024 (Windows)")
    buf = io.BytesIO()
    img.save(buf, format="PNG", pnginfo=png_info)
    png_bytes = buf.getvalue()
    buf.seek(0)
    pil_img = Image.open(buf)
    res = exif_service.extract_exif(pil_img, file_bytes=png_bytes, filename="edited.png")
    assert res["editing_software_detected"] is True
    assert "Photoshop" in res["software"]
    assert any("edited with graphics software" in flag for flag in res["anomaly_flags"])

def test_exif_creation_and_modification_dates():
    from backend.app.services.report_service import report_service
    # 1. Test client_modified fallback
    data = create_synthetic_image_bytes(64, 64, add_face=False)
    _, pil_img, _ = image_preprocessor_service.validate_and_load(data, "test_dates.jpg")
    client_time = "2024-11-13T01:30:00.000Z"
    res = exif_service.extract_exif(pil_img, file_bytes=data, filename="test_dates.jpg", client_modified=client_time)
    assert "creation_date" in res
    assert "modification_date" in res
    assert "2024-11-13 01:30:00 UTC" in res["creation_date"]
    assert "2024-11-13 01:30:00 UTC" in res["modification_date"]
    assert res["file_properties"]["creation_date"] == res["creation_date"]
    assert res["camera_details"]["creation_date"] == res["creation_date"]
    assert "OS File System Timestamp Preserved" in res["file_properties"]["temporal_status"]

    # 2. Test PDF report includes the dates without error
    report_dict = {
        "analysis_id": "TEST-DATE-01",
        "filename": "test_dates.jpg",
        "sha256": "abcdef1234567890",
        "prediction": "Authentic",
        "deepfake_probability": 0.05,
        "pristine_probability": 0.95,
        "risk_level": "Low Risk",
        "overall_risk_score": 5.0,
        "dimensions": [64, 64],
        "exif": res,
        "frequency": {
            "high_freq_ratio": 0.1,
            "spectral_centroid": 12.0,
            "azimuthal_deviation": 1.5,
            "analysis_summary": "Clean spectrum"
        },
        "evidence": []
    }
    pdf_path = report_service.generate_image_pdf("TEST-DATE-01", report_dict)
    assert pdf_path.endswith(".pdf")


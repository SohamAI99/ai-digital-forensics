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

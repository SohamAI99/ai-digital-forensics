import os
import cv2
import numpy as np
import hashlib
from PIL import Image
from typing import Dict, Any, Tuple, Optional
from backend.app.config import ARTIFACTS_DIR

# OpenCV face detector setup
HAAR_CASCADE_PATH = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(HAAR_CASCADE_PATH)

class ImagePreprocessorService:
    MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

    @staticmethod
    def validate_and_load(file_bytes: bytes, filename: str) -> Tuple[np.ndarray, Image.Image, Dict[str, Any]]:
        """
        Validates image size, format, SHA-256 cryptographic hash, and decodes safely.
        Returns:
            (cv2_bgr_array, pil_image, metadata)
        """
        if len(file_bytes) > ImagePreprocessorService.MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File size exceeds 20MB limit ({len(file_bytes) / (1024*1024):.1f} MB).")

        ext = os.path.splitext(filename)[1].lower()
        if ext not in ImagePreprocessorService.ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file format '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP.")

        # Compute SHA-256 hash for forensic chain of custody
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()

        # Decode using OpenCV from byte buffer
        nparr = np.frombuffer(file_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            raise ValueError("Corrupted image file: unable to decode image pixels.")

        height, width, channels = img_bgr.shape
        if height < 32 or width < 32:
            raise ValueError(f"Image dimensions too small ({width}x{height}). Minimum required: 32x32.")

        # Also load as PIL Image for EXIF and transforms
        import io
        pil_img = Image.open(io.BytesIO(file_bytes))

        metadata = {
            "width": width,
            "height": height,
            "channels": channels,
            "format": pil_img.format or ext.replace(".", "").upper(),
            "mode": pil_img.mode,
            "sha256": sha256_hash,
            "size_bytes": len(file_bytes)
        }

        return img_bgr, pil_img, metadata

    @staticmethod
    def detect_and_crop_face(img_bgr: np.ndarray, analysis_id: str) -> Tuple[bool, Optional[str], np.ndarray]:
        """
        Detects primary face if present. If detected, crops with margin.
        If not detected, falls back to centered crop.
        Saves crop visualization to artifacts directory.
        """
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

        h, w = img_bgr.shape[:2]
        crop_filename = f"crop_{analysis_id}.jpg"
        crop_path = ARTIFACTS_DIR / crop_filename

        if len(faces) > 0:
            # Pick largest detected face
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            x, y, fw, fh = largest_face
            # Add 20% margin
            mx = int(fw * 0.2)
            my = int(fh * 0.2)
            x1 = max(0, x - mx)
            y1 = max(0, y - my)
            x2 = min(w, x + fw + mx)
            y2 = min(h, y + fh + my)
            face_crop = img_bgr[y1:y2, x1:x2]
            cv2.imwrite(str(crop_path), face_crop)
            return True, f"/artifacts/{crop_filename}", face_crop
        else:
            # Fallback center-crop
            min_dim = min(h, w)
            y1 = (h - min_dim) // 2
            x1 = (w - min_dim) // 2
            center_crop = img_bgr[y1:y1+min_dim, x1:x1+min_dim]
            cv2.imwrite(str(crop_path), center_crop)
            return False, f"/artifacts/{crop_filename}", center_crop

image_preprocessor_service = ImagePreprocessorService()

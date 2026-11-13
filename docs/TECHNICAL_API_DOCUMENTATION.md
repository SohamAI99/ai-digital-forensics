# AEGIS FORENSICS: Technical & API Specification Manual

**Document Version:** 2.1.0  
**Target Systems:** Forensic Laboratory Workstations, Court Production Servers, CI/CD Automated Pipelines  
**Compliance Standards:** ISO/IEC 27037:2012, NIST SP 800-86, FRE 901/902, 28 U.S.C. § 1746  

---

## 1. System Overview

AEGIS FORENSICS is an enterprise-grade digital forensics platform offering two strictly decoupled investigative engines:
1. **Email Threat Detection Engine**: High-accuracy natural language classifier (TF-IDF + Logistic Regression), LIME explainable attribution, lexical URL inspection, and RFC 5322 authentication header validation.
2. **Deepfake Image Forensics Engine**: Convolutional neural network (ResNet-18), Layer-4 Grad-CAM activation mapping, 2D FFT & 2D DCT frequency domain analysis, low-level binary stream parsing (SOF0 subsampling, DQT quality estimation), and dual-hash cryptographic verification.
3. **Legal Admissibility & Reporting Engine**: Dynamic evidence custodian tracking, 4-stage chain of custody ledgers, and dynamic two-pass ReportLab PDF generation yielding 12-section court-admissible forensic certificates.

---

## 2. API Endpoints Reference

All API routes are served through FastAPI and mounted under the `/api` prefix.

### 2.1 Health Check
- **Endpoint:** `GET /api/health`
- **Description:** Verifies service health, database connectivity, and loaded model weights.
- **Response:**
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "email_model_loaded": true,
    "image_model_loaded": true
  }
  ```

---

### 2.2 Image Forensics Analysis (With Dynamic Custodian)
- **Endpoint:** `POST /api/image/analyze`
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  | Field | Type | Required | Default | Description |
  |---|---|---|---|---|
  | `file` | `UploadFile` (binary) | Yes | - | Raw image file (`.jpg`, `.jpeg`, `.png`, `.webp` up to 20 MB) |
  | `custodian_name` | `string` | No | `"Soyam Maji (Soyam08)"` | Full name, agency, or badge of the Lead Evidence Custodian |

- **Processing Pipeline:**
  1. Computes **SHA-256** and **MD5** dual cryptographic hashes on raw bitstream.
  2. Validates image dimensions, channels, and format integrity via Pillow and OpenCV.
  3. Extracts EXIF tags or executes JPEG stream introspection (SOF0 subsampling, DQT scale).
  4. Runs Haar face detection to crop biometric Region of Interest (with fallback center-crop).
  5. Computes 2D Fast Fourier Transform (FFT) and 2D Discrete Cosine Transform (DCT) log-magnitude spectra.
  6. Executes ResNet-18 forward pass and computes Layer-4 Grad-CAM activation heatmap.
  7. Computes composite risk score and populates the 4-stage Chain of Custody ledger.
  8. Persists case record to SQLite database and returns forensic JSON payload.

- **Sample Response:**
  ```json
  {
    "analysis_id": "IMG-B6E04CC3",
    "filename": "suspect_evidence.jpg",
    "file_size_bytes": 24576,
    "sha256": "5fec67d52ca25cbfa6622958e0fb0d9f032bc004a24a001f488803aa2b153676",
    "md5": "74da694d6f33f2ea815909ca245e63c3",
    "custodian_name": "Soyam Maji (Soyam08)",
    "prediction": "Authentic / Unaltered",
    "confidence": 0.9412,
    "deepfake_probability": 0.0588,
    "risk_level": "low",
    "overall_risk_score": 15,
    "dimensions": [452, 678],
    "exif": {
      "has_exif": false,
      "metadata_verdict": "Metadata Stripped / Digital Stream",
      "metadata_risk_score": 20,
      "ai_generation_detected": false,
      "editing_software_detected": false,
      "file_properties": {
        "file_format": "JPEG",
        "mime_type": "image/jpeg",
        "chroma_subsampling": "YCbCr 4:2:0 (Standard 2x2 Subsampling)",
        "compression_quality": "High Fidelity DCT (~94%)",
        "creation_date": "Timestamp Not Recorded (Web / Stripped)",
        "modification_date": "OS File System Timestamp Preserved",
        "temporal_status": "Header Timestamps Stripped"
      },
      "camera_details": {
        "make": "Non-Hardware (Digital Source)",
        "model": "Digital Raster Stream (JPEG Canvas)",
        "lens_model": "Synthetic Sensor (Direct Pixel Matrix)",
        "exposure_time": "Non-Optical (Digital Rendering Pipeline)",
        "f_number": "Uniform Depth of Field (Synthetic f/0)",
        "iso": "Standard Gain (ISO 100 Equivalent)"
      },
      "anomaly_flags": [
        "No camera EXIF metadata present (standard for web uploads, screenshots, and stripped AI images)."
      ]
    },
    "frequency_analysis": {
      "high_frequency_ratio": 0.142,
      "spectral_centroid": 84.5,
      "azimuthal_deviation": 0.038
    },
    "evidence": [
      {
        "category": "Cryptographic Integrity",
        "title": "Dual-Hash Bitstream Intake Verification",
        "severity": "low",
        "score_impact": 0,
        "description": "Cryptographic integrity corroborated via dual MD5 and SHA-256 hashing."
      }
    ]
  }
  ```

---

### 2.3 Email Forensics Analysis
- **Endpoint:** `POST /api/email/analyze`
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "raw_text": "From: security@paypal-verify.com\nSubject: URGENT: Account Suspended\n\nPlease verify your account immediately at http://192.168.1.1/login or your funds will be frozen."
  }
  ```
- **Response:**
  ```json
  {
    "analysis_id": "EML-9A3F12CD",
    "prediction": "Phishing",
    "confidence": 0.982,
    "phishing_probability": 0.982,
    "risk_level": "high",
    "overall_risk_score": 88,
    "writing_style": {
      "urgency_score": 85,
      "urgency_keywords": ["urgent", "immediately", "frozen"],
      "credential_seeking": true,
      "financial_threat": true
    },
    "urls": [
      {
        "url": "http://192.168.1.1/login",
        "domain": "192.168.1.1",
        "is_ip_host": true,
        "is_suspicious_tld": false,
        "brand_spoofing_detected": true,
        "spoofed_brand": "PayPal",
        "risk_score": 95
      }
    ],
    "lime_explanations": [
      {"word": "immediately", "weight": 0.42},
      {"word": "verify", "weight": 0.38},
      {"word": "suspended", "weight": 0.35}
    ]
  }
  ```

---

### 2.4 Court-Admissible PDF Report Generation
- **Endpoint:** `GET /api/reports/{analysis_id}/pdf`
- **Response:** `application/pdf`
- **Headers:** `Content-Disposition: inline; filename="Forensic_Report_{analysis_id}.pdf"`
- **Architecture:**
  - Evaluates whether the requested case ID is an Image or Email examination.
  - For image cases, instantiates `get_forensic_canvas(case_ref, custodian_name)` inheriting from `reportlab.pdfgen.canvas.Canvas`.
  - Executes **two-pass layout rendering** (`_saved_page_states`) to dynamically inject running page counts (`Page X of Y`), running case header banners (`CR-FOR-2026-{id}`), and running custodian footers.
  - Embeds photographic exhibits with proportional bounding box scaling (`drawWidth` / `drawHeight`).
  - Outputs a fully formatted 12-section judicial certificate adhering to 28 U.S.C. § 1746 and ISO/IEC 27037.

---

### 2.5 Historical Audit Log & Dashboard Metrics
- **Endpoint:** `GET /api/history`
  - Query Parameters: `skip` (int, default: 0), `limit` (int, default: 50), `module` (optional string: `email` or `image`)
  - Returns paginated analysis audit logs stored in `forensics.db`.
- **Endpoint:** `GET /api/dashboard/summary`
  - Returns total counts, high-risk detection totals, deepfake detections, and recent 5 activities for the cockpit dashboard.

---

## 3. Cryptographic & Forensic Algorithms

### 3.1 Dual-Hash Bitstream Corroboration
```python
import hashlib

def compute_dual_hashes(bitstream: bytes) -> tuple[str, str]:
    """
    Computes dual cryptographic hashes (SHA-256 + MD5) per ISO/IEC 27037:2012
    and FRE 902(14) self-authentication guidelines.
    """
    sha256 = hashlib.sha256(bitstream).hexdigest()
    md5 = hashlib.md5(bitstream).hexdigest()
    return sha256, md5
```

### 3.2 JPEG SOF0 Chroma Subsampling Algorithm
```python
def inspect_sof0_chroma(file_bytes: bytes) -> str:
    sof0_idx = file_bytes.find(b'\xFF\xC0')
    if sof0_idx != -1 and sof0_idx + 12 < len(file_bytes):
        num_components = file_bytes[sof0_idx + 9]
        if num_components == 3:
            h_samp = file_bytes[sof0_idx + 11] >> 4
            v_samp = file_bytes[sof0_idx + 11] & 0x0F
            if h_samp == 2 and v_samp == 2:
                return 'YCbCr 4:2:0 (Standard 2x2 Subsampling)'
            elif h_samp == 2 and v_samp == 1:
                return 'YCbCr 4:2:2 (Horizontal Subsampling)'
            elif h_samp == 1 and v_samp == 1:
                return 'YCbCr 4:4:4 (Full Resolution Chroma)'
    return 'YCbCr Standard Subsampling'
```

### 3.3 JPEG DQT Quantization Matrix Quality Estimator
```python
def estimate_jpeg_quality(file_bytes: bytes) -> str:
    std_lum = [
        16, 11, 10, 16, 24, 40, 51, 61,
        12, 12, 14, 19, 26, 58, 60, 55,
        14, 13, 16, 24, 40, 57, 69, 56,
        14, 17, 22, 29, 51, 87, 80, 62,
        18, 22, 37, 56, 68, 109, 103, 77,
        24, 35, 55, 64, 81, 104, 113, 92,
        49, 64, 78, 87, 103, 121, 120, 101,
        72, 92, 95, 98, 112, 100, 103, 99
    ]
    dqt_idx = file_bytes.find(b'\xFF\xDB')
    if dqt_idx != -1 and dqt_idx + 69 < len(file_bytes):
        table = list(file_bytes[dqt_idx + 5 : dqt_idx + 69])
        scales = [t / s for t, s in zip(table, std_lum) if s > 0]
        avg_scale = sum(scales) / len(scales)
        if avg_scale <= 0.01:
            quality = 100
        elif avg_scale < 1.0:
            quality = round(100.0 - (avg_scale * 50.0))
        else:
            quality = round(5000.0 / (avg_scale * 100.0))
        return f"High Fidelity DCT (~{max(1, min(100, quality))}%)"
    return "Standard Quantization Table"
```

---

## 4. Database Schema (`forensics.db`)

AEGIS stores historical records in an ACID-compliant SQLite relational database located at `backend/storage/forensics.db`:

```sql
CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,               -- e.g. 'IMG-B6E04CC3' or 'EML-9A3F12CD'
    module TEXT NOT NULL,             -- 'image' or 'email'
    filename TEXT,                    -- Original evidentiary filename
    prediction TEXT NOT NULL,         -- 'Authentic', 'Deepfake', 'Phishing', etc.
    risk_level TEXT NOT NULL,         -- 'low', 'medium', 'high'
    overall_risk_score INTEGER NOT NULL, -- 0 to 100 composite score
    details_json TEXT NOT NULL,       -- Enriched forensic report JSON
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Within `details_json`, all forensic metadata is serialized:
- `sha256`: Hexadecimal SHA-256 digest
- `md5`: Hexadecimal MD5 digest
- `custodian_name`: Name of the Lead Evidence Custodian
- `file_size_bytes`: Raw byte size
- `exif`: Full EXIF and container properties dictionary
- `evidence`: Array of structured evidentiary findings
- `limitations`: Declared boundary conditions

---

## 5. Verification & Testing Commands

### 5.1 Backend Test Execution
Run all 24 unit and integration tests:
```powershell
.\venv\Scripts\Activate.ps1
python -m pytest backend/tests -v
```

### 5.2 Frontend Compilation & Type Checking
Verify clean TypeScript compilation and asset bundling:
```powershell
cd frontend
npm run build
```

### 5.3 Starting the Development Environment
- **Backend (Port 8000):**
  ```powershell
  python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
  ```
- **Frontend (Port 5173):**
  ```powershell
  cd frontend
  npm run dev
  ```


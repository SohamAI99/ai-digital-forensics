# System Architecture

## High-Level Design
```text
React/Vite Frontend
        ↓
     FastAPI
        ↓
 ┌───────────────┬────────────────┐
 │ Email Module  │ Image Module   │
 └───────────────┴────────────────┘
        ↓
 Evidence / Risk Layer
        ↓
 Reporting Layer
        ↓
 Database / Report Storage
```

## Email Backend
```text
EML/MSG
  ↓
Parser
  ↓
Header + Authentication
  ↓
URL/Domain Engine
  ↓
NLP Engine
  ↓
Attachment Forensics
  ↓
Evidence Aggregation
  ↓
Explainability
  ↓
Risk Assessment
  ↓
Report
```

## Image Backend
```text
JPG/JPEG/PNG
  ↓
Validation + SHA-256
  ↓
EXIF/Metadata
  ↓
Preprocessing
  ↓
FFT/DCT
  ↓
CNN/ViT Classifier
  ↓
Grad-CAM/Saliency
  ↓
Evidence Aggregation
  ↓
Risk Assessment
  ↓
Report
```

## Suggested Database Entities
- analysis
- email_analysis
- image_analysis
- evidence
- model_version
- report
- uploaded_file

Each record should preserve timestamps, internal IDs, module type, model version, assessment, and relevant evidence.

## Security
- Never execute attachments.
- Validate MIME type and file size.
- Sanitize filenames.
- Generate internal IDs.
- Store secrets in environment variables.
- Isolate failures between the two modules.

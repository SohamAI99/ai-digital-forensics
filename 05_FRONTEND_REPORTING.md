# Frontend and Reporting

## Frontend
Recommended:
- React
- Vite
- Tailwind CSS

The dashboard should clearly expose the two independent modules.

## Dashboard
Primary cards:
1. Email Threat & Forensic Analysis
2. Deepfake Image Forensics

## Email UI
- Upload .eml/.msg
- Analysis status
- Email classification
- URL/domain findings
- authentication findings
- attachment findings
- NLP explanation
- evidence
- risk assessment
- report generation

## Image UI
- Upload JPG/JPEG/PNG
- image preview
- metadata/EXIF
- FFT/DCT visualizations
- model result
- Grad-CAM/saliency
- evidence
- risk assessment
- report generation

## Unified History
Use one history interface while keeping email and image records logically independent.

## API Examples
```text
POST /api/email/analyze
POST /api/image/analyze
GET  /api/analysis/{id}
GET  /api/report/{id}
```

## Reporting
Reports should contain:
- file/analysis identifier
- timestamp
- module
- input properties
- evidence
- model and version
- result
- risk assessment
- explainability
- limitations

The report must distinguish forensic evidence from model interpretation.

# AI Guardian — Two-Module Project Context

## Official Project Title
**An Integrated AI and Digital Forensic Framework for Email Threat Detection and Deepfake Image Forensics**

## Scope
This project has exactly **two independent forensic modules**:

1. **Email Threat and Forensic Analysis**
2. **Deepfake Image Forensics**

A unified web frontend and shared reporting/evidence infrastructure support both modules.

### Current implementation does NOT include
- Audio analysis
- Video analysis
- Cross-modal fusion
- Active blocking/automated mitigation

Those are future-scope directions only.

## Master Architecture
```text
User
  ↓
Unified Web Dashboard
  ↓
FastAPI Backend
  ├── Email Forensics
  │   ├── Email Parser
  │   ├── Header/Auth Analysis
  │   ├── URL/Domain Engine
  │   ├── NLP Transformer
  │   └── Attachment Forensics
  │
  └── Image Forensics
      ├── File Validation
      ├── EXIF/Metadata
      ├── Preprocessing
      ├── FFT/DCT
      ├── CNN/ViT
      └── Grad-CAM/Saliency
  ↓
Evidence + Risk Assessment
  ↓
Forensic Report
```

## Image Pipeline
**Image → EXIF/Metadata → Preprocessing → FFT/DCT → CNN/ViT → Grad-CAM/Saliency → Real/Fake Assessment → Forensic Report**

## Email Pipeline
**EML/MSG → Parsing → Header/Auth → URL/Domain Analysis → NLP Social-Engineering Detection → Attachment Forensics → Explainability → Risk Assessment → Forensic Report**

## Core Principle
The system must make evidence traceable. A model prediction is an assessment, not absolute proof.

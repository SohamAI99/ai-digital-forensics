# Development and Evaluation Plan

## Phase 1 — Image Module
1. Upload/validation
2. SHA-256/file properties
3. EXIF extraction
4. preprocessing and face detection
5. FFT/DCT analysis
6. CNN baseline
7. prediction
8. Grad-CAM
9. evidence aggregation
10. FastAPI endpoint
11. React UI
12. report generation

## Phase 2 — Email Module
1. .eml upload
2. parse headers/body/links/attachments
3. SPF/DKIM/DMARC evidence
4. URL/domain analysis
5. rule baseline
6. TF-IDF baseline
7. DistilBERT
8. LIME/SHAP
9. evidence/risk layer
10. report

## Phase 3 — Unified Platform
- shared authentication if needed
- common upload/analysis model
- unified dashboard
- history
- shared reporting
- database

## Phase 4 — Testing
- unit tests
- integration tests
- malformed inputs
- large files
- benign vs malicious/synthetic samples
- failure isolation
- security tests

## Research Evaluation
Evaluate:
- accuracy
- precision
- recall
- F1
- ROC-AUC where applicable
- confusion matrix
- false positives/negatives
- robustness
- generalization

## Important Rule
Do not present target metrics as achieved results. The project report's target accuracy/F1 values are goals until experimentally demonstrated.

## Demo Flows
### Image
Upload image → metadata → frequency analysis → model → explanation → evidence → risk → report.

### Email
Upload email → parsing → authentication/URL analysis → NLP → attachment analysis → explanation → evidence → risk → report.

## Final Definition
One platform with two independent forensic modules:
**Email Detect → Evidence → Explain → Assess → Report**
and
**Image Detect → Evidence → Explain → Assess → Report**

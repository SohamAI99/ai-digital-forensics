# Deepfake Image Forensics

## Objective
Detect and investigate AI-generated or manipulated images using metadata, frequency-domain evidence, deep visual models, and explainability.

## Input
- JPG/JPEG
- PNG

## Stage 1 — Validation and Integrity
- Validate MIME type and extension
- Enforce file-size limits
- Calculate SHA-256
- Record image dimensions and file properties

## Stage 2 — EXIF/Metadata
Extract available metadata such as:
- camera/device information
- date/time
- software
- GPS when present
- image dimensions
- compression-related information

Metadata is supporting evidence, not proof of authenticity.

## Stage 3 — Preprocessing
Possible operations:
- RGB conversion
- resizing
- normalization
- face detection
- region-of-interest extraction

Preserve the original file and record preprocessing operations.

## Stage 4 — Frequency Analysis
Use:
- FFT (Fast Fourier Transform)
- DCT (Discrete Cosine Transform)

Purpose:
Identify frequency-domain patterns and compression/artifact characteristics that may provide supporting evidence of manipulation or synthetic generation.

## Stage 5 — Vision Model
Candidate models:
- Xception
- EfficientNet
- ResNet
- ViT
- Swin Transformer

A practical implementation can begin with a CNN baseline and later compare transformer-based models.

Labels may include:
- Real
- AI-generated/manipulated

Do not claim performance until the model has actually been trained and evaluated.

## Stage 6 — Explainability
Use Grad-CAM or saliency maps to show image regions that influenced the prediction.

Explainability indicates model attention/importance; it does not independently prove manipulation.

## Stage 7 — Assessment
Combine available evidence:
- metadata anomalies
- frequency-domain indicators
- model prediction
- explainability
- image properties

Produce a transparent assessment rather than an unsupported binary claim.

## Robustness Testing
Test effects of:
- JPEG compression
- resizing
- cropping
- screenshots
- re-encoding
- unseen generation/manipulation methods

## Evaluation
Report:
- accuracy
- precision
- recall
- F1
- ROC-AUC where applicable
- confusion matrix
- cross-dataset/generalization performance
- robustness results

Never invent results.

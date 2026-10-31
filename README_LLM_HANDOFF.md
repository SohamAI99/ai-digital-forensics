# LLM Handoff — AI Guardian Two-Module Context

Attach all seven markdown files to a new LLM/project context.

## Core instruction
Build and reason about the project as a cybersecurity and digital-forensics platform with exactly two current implementation modules:

1. Email Threat and Forensic Analysis
2. Deepfake Image Forensics

Use the supplied documents as the authoritative project context.

## Architecture
- Unified React/Vite frontend
- FastAPI backend
- Independent Email and Image forensic services/modules
- Shared evidence/risk/reporting layer
- Database for analysis history and reports

## Explicitly out of current implementation scope
- Audio
- Video
- Cross-modal fusion
- Active automated blocking/mitigation

These may be mentioned only as future scope when explicitly requested.

## Development priority
**Image → Email → Shared Evidence/Reporting → Dashboard → Evaluation**

## Important
Never fabricate model results, accuracy, datasets, or completed features. Clearly label anything as implemented, planned, or future.

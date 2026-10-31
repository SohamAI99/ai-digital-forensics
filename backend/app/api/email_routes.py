import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from backend.app.schemas import EmailAnalyzeResponse, WritingStyleAnalysis, LimeFeature
from backend.app.services.email_detector import email_detector_service
from backend.app.services.email_parser import email_parser_service
from backend.app.services.email_writing_style import writing_style_analyzer
from backend.app.services.url_analyzer import url_analyzer_service
from backend.app.services.lime_service import lime_service
from backend.app.services.email_risk_engine import email_risk_engine
from backend.app.services.report_service import report_service
from backend.app.database import insert_analysis

router = APIRouter(prefix="/api/email", tags=["Email Forensics"])

@router.post("/analyze", response_model=EmailAnalyzeResponse)
async def analyze_email(
    email_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    analysis_id = f"EML-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now(timezone.utc).isoformat()

    # Determine input source
    raw_content = ""
    parsed_info = {}
    identifier = "Pasted Content"

    if file:
        filename = file.filename or "uploaded_email"
        identifier = filename
        contents = await file.read()
        
        # Validate file size (max 10MB)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Uploaded email file exceeds 10MB limit.")

        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext == "eml":
            parsed_info = email_parser_service.parse_eml_bytes(contents)
            raw_content = parsed_info.get("body", "")
            identifier = parsed_info.get("subject") or filename
        elif ext in ["txt", "msg"]:
            try:
                text_decoded = contents.decode("utf-8", errors="ignore")
                parsed_info = email_parser_service.parse_text_or_headers(text_decoded)
                raw_content = parsed_info.get("body", "")
                identifier = parsed_info.get("subject") or filename
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to parse text: {e}")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file format '.{ext}'. Supported: .eml, .txt, .msg")
    elif email_text and email_text.strip():
        raw_content = email_text.strip()
        parsed_info = email_parser_service.parse_text_or_headers(raw_content)
        raw_content = parsed_info.get("body", raw_content)
        identifier = parsed_info.get("subject") or (raw_content[:40] + "...")
    else:
        raise HTTPException(status_code=400, detail="Either email_text or an uploaded .eml file must be provided.")

    # 1. Run Machine Learning Classifier
    model_res = email_detector_service.predict(raw_content)

    # 2. Run Writing Style Analysis
    writing_style = writing_style_analyzer.analyze(raw_content)

    # 3. Analyze URLs
    urls_found = parsed_info.get("urls", [])
    urls_analysis = url_analyzer_service.analyze_urls(urls_found)

    # 4. Attachment Inspection
    attachments = parsed_info.get("attachments", [])

    # 5. Recorded Auth Headers
    auth_headers = parsed_info.get("authentication_headers", {})

    # 6. Multi-Factor Risk Assessment (including header discrepancies)
    risk_level, overall_score, evidence, checks_performed, checks_unavailable, limitations = (
        email_risk_engine.assess_risk(
            model_res,
            writing_style,
            urls_analysis,
            attachments,
            auth_headers,
            parsed_info=parsed_info
        )
    )

    # 7. LIME Explanation
    lime_res = lime_service.explain(raw_content, num_features=8)
    lime_features = [
        LimeFeature(word=item["word"], weight=item["weight"])
        for item in lime_res.get("features", [])
    ]

    # 8. Generate PDF Report
    report_dict = {
        "analysis_id": analysis_id,
        "identifier": identifier,
        "prediction": model_res["prediction"],
        "phishing_probability": model_res["phishing_probability"],
        "safe_probability": model_res["safe_probability"],
        "risk_level": risk_level,
        "overall_risk_score": overall_score,
        "evidence": [ev.model_dump() for ev in evidence],
        "lime_features": [f.model_dump() for f in lime_features]
    }
    
    report_pdf_path = None
    try:
        report_pdf_path = report_service.generate_email_pdf(analysis_id, report_dict)
    except Exception as e:
        print(f"[EmailRouter] Report generation error: {e}")

    # 9. Persist to Database
    db_details = {
        "prediction": model_res["prediction"],
        "phishing_probability": model_res["phishing_probability"],
        "safe_probability": model_res["safe_probability"],
        "risk_level": risk_level,
        "overall_risk_score": overall_score,
        "urls_count": len(urls_found),
        "attachments_count": len(attachments),
        "writing_style": writing_style,
        "evidence_count": len(evidence),
        "sender": parsed_info.get("sender"),
        "recipient": parsed_info.get("recipient"),
        "reply_to": parsed_info.get("reply_to"),
        "subject": parsed_info.get("subject"),
        "message_id": parsed_info.get("message_id"),
        "received_hops": parsed_info.get("received_hops", 0),
        "spf_result": auth_headers.get("spf_result", "Unknown"),
        "dkim_result": auth_headers.get("dkim_result", "None"),
        "dmarc_result": auth_headers.get("dmarc_result", "None"),
        "evidence_list": [ev.model_dump() for ev in evidence]
    }
    insert_analysis(
        analysis_id=analysis_id,
        analysis_type="email",
        identifier=identifier,
        classification=model_res["prediction"],
        risk_level=risk_level,
        overall_score=overall_score,
        summary=f"Email classified as {model_res['prediction']} with risk score {overall_score}/100 ({risk_level}).",
        details=db_details,
        report_pdf_path=report_pdf_path
    )

    return EmailAnalyzeResponse(
        analysis_id=analysis_id,
        timestamp=timestamp,
        identifier=identifier,
        prediction=model_res["prediction"],
        phishing_probability=model_res["phishing_probability"],
        safe_probability=model_res["safe_probability"],
        risk_level=risk_level,
        overall_risk_score=overall_score,
        parsed_metadata={
            "sender": parsed_info.get("sender"),
            "recipient": parsed_info.get("recipient"),
            "reply_to": parsed_info.get("reply_to"),
            "subject": parsed_info.get("subject"),
            "date": parsed_info.get("date"),
            "message_id": parsed_info.get("message_id"),
            "received_hops": parsed_info.get("received_hops", 0),
            "reply_to_mismatch": parsed_info.get("reply_to_mismatch", False),
            "body_snippet": raw_content[:300] + ("..." if len(raw_content) > 300 else "")
        },
        writing_style=WritingStyleAnalysis(**writing_style),
        urls=urls_analysis,
        attachments=attachments,
        authentication_headers=auth_headers,
        lime_features=lime_features,
        lime_status=lime_res.get("status", "LIME analysis completed"),
        evidence=evidence,
        checks_performed=checks_performed,
        checks_unavailable=checks_unavailable,
        limitations=limitations
    )

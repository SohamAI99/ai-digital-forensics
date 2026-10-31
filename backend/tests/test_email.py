import pytest
from backend.app.services.email_detector import email_detector_service
from backend.app.services.email_parser import email_parser_service
from backend.app.services.email_writing_style import writing_style_analyzer
from backend.app.services.url_analyzer import url_analyzer_service
from backend.app.services.email_risk_engine import email_risk_engine

def test_model_loaded():
    assert email_detector_service.is_loaded is True
    assert email_detector_service.model is not None

def test_sample_predictions():
    phishing_sample = "URGENT: Your bank account will be suspended today! Verify immediately by clicking here."
    res_phish = email_detector_service.predict(phishing_sample)
    assert res_phish["prediction"] == "Phishing Email"
    assert res_phish["phishing_probability"] > 0.70

    safe_sample = "Hi team, please find the meeting notes attached for tomorrow's project discussion. Thanks."
    res_safe = email_detector_service.predict(safe_sample)
    assert res_safe["prediction"] == "Safe Email"
    assert res_safe["safe_probability"] > 0.70

def test_empty_input():
    res = email_detector_service.predict("")
    assert res["is_empty"] is True
    assert "Inconclusive" in res["prediction"]

def test_writing_style_urgency():
    sample = "URGENT ACTION REQUIRED: Account will be suspended within 24 hours! Update password now!"
    res = writing_style_analyzer.analyze(sample)
    assert res["urgency_detected"] is True
    assert res["credential_harvest_detected"] is True
    assert res["excessive_punctuation"] is True

def test_url_analyzer_ip_host():
    url = "http://192.168.1.100/login/verify.php"
    res = url_analyzer_service.analyze_url(url)
    assert res["is_ip_host"] is True
    assert res["risk_score"] >= 40

def test_url_analyzer_brand_spoofing():
    url = "https://paypal.com.account-verification-security.net/signin"
    res = url_analyzer_service.analyze_url(url)
    assert res["brand_spoofing"] is True
    assert res["risk_score"] >= 40

def test_email_risk_engine_scoring():
    model_res = {"phishing_probability": 0.95, "safe_probability": 0.05}
    style_res = {"urgency_detected": True, "credential_harvest_detected": True, "threat_detected": False}
    urls_res = [{"is_ip_host": True, "brand_spoofing": False, "has_suspicious_tld": False, "url": "http://1.2.3.4"}]
    risk_level, score, evidence, _, _, _ = email_risk_engine.assess_risk(
        model_res, style_res, urls_res, [], {}
    )
    assert risk_level == "High Risk"
    assert score >= 70.0
    assert len(evidence) >= 3

def test_email_parser_headers_and_reply_to_mismatch():
    raw_email = (
        "From: boss@legitcompany.com\r\n"
        "To: employee@legitcompany.com\r\n"
        "Reply-To: attacker@spoofeddomain.net\r\n"
        "Subject: Urgent wire transfer request\r\n"
        "Message-ID: <wire-9912@legitcompany.com>\r\n"
        "Received: from relay1.net by mx.legitcompany.com\r\n\r\n"
        "Please process this wire transfer immediately."
    )
    parsed = email_parser_service.parse_text_or_headers(raw_email)
    assert parsed["sender"] == "boss@legitcompany.com"
    assert parsed["reply_to"] == "attacker@spoofeddomain.net"
    assert parsed["message_id"] == "<wire-9912@legitcompany.com>"
    assert parsed["reply_to_mismatch"] is True
    assert parsed["received_hops"] >= 1

    # Verify risk engine flags this mismatch as high severity evidence
    _, _, evidence, _, _, _ = email_risk_engine.assess_risk(
        {"phishing_probability": 0.5}, {}, [], [], {}, parsed_info=parsed
    )
    mismatch_ev = [e for e in evidence if e.category == "headers" and "Reply-To" in e.title]
    assert len(mismatch_ev) == 1
    assert mismatch_ev[0].severity == "high"

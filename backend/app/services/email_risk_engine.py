from typing import Dict, Any, List, Tuple, Optional
from backend.app.schemas import EvidenceItem
from backend.app.config import RISK_LOW_MAX, RISK_MEDIUM_MAX

class EmailRiskEngine:
    @staticmethod
    def assess_risk(
        model_result: Dict[str, Any],
        writing_style: Dict[str, Any],
        urls_analysis: List[Dict[str, Any]],
        attachments: List[Dict[str, Any]],
        auth_headers: Dict[str, Any],
        parsed_info: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, float, List[EvidenceItem], List[str], List[str], List[str]]:
        """
        Calculates an explainable overall risk score (0-100) and risk level.
        Does not combine unrelated probabilities blindly; uses a transparent multi-factor scoring formula.
        """
        evidence: List[EvidenceItem] = []
        checks_performed = [
            "TF-IDF Logistic Regression classification",
            "Urgency and coercive language detection",
            "Credential harvesting keyword search",
            "Lexical URL analysis (IP host, brand spoofing, suspicious TLDs)",
            "Attachment metadata, MIME type and file extension inspection",
            "RFC 822 header discrepancy and relay hop tracking",
            "Live DNS SPF and DMARC record verification via dnspython"
        ]
        
        checks_unavailable = [
            "External threat intelligence sandbox scanning (VirusTotal key optional/offline)",
            "Live URL crawling / payload sandbox execution (prohibited for safety)"
        ]

        limitations = [
            "Model scores are statistical estimates based on Kaggle phishing corpus, not cryptographic proof.",
            "Spoofed emails with clean text and no malicious links may achieve lower risk scores.",
            "Missing external threat intelligence does not imply the email is safe.",
            "Network conditions or firewall rules may affect live DNS TXT lookups."
        ]

        # 1. Base ML Model Score (weight up to 50 points)
        phishing_prob = model_result.get("phishing_probability", 0.0)
        base_ml_score = phishing_prob * 50.0
        
        if phishing_prob > 0.70:
            evidence.append(EvidenceItem(
                category="model",
                title="High Phishing Confidence from ML Classifier",
                description=f"TF-IDF + Logistic Regression estimated a {phishing_prob*100:.1f}% probability of phishing patterns.",
                severity="high",
                score_impact=round(base_ml_score, 1)
            ))
        elif phishing_prob > 0.40:
            evidence.append(EvidenceItem(
                category="model",
                title="Moderate Phishing Confidence",
                description=f"Classifier indicated borderline phishing indicators ({phishing_prob*100:.1f}% probability).",
                severity="medium",
                score_impact=round(base_ml_score, 1)
            ))
        else:
            evidence.append(EvidenceItem(
                category="model",
                title="Legitimate Email Pattern Match",
                description=f"Model detected benign communication patterns ({100 - phishing_prob*100:.1f}% safe score).",
                severity="low",
                score_impact=round(base_ml_score, 1)
            ))

        total_score = base_ml_score

        # 2. Writing Style signals (up to 25 points)
        style_score = 0.0
        if writing_style.get("credential_harvest_detected"):
            style_score += 15.0
            evidence.append(EvidenceItem(
                category="writing_style",
                title="Credential or Sensitive Data Request",
                description="Message solicits password, login credentials, or personal verification data.",
                severity="high",
                score_impact=15.0
            ))
        
        if writing_style.get("urgency_detected"):
            style_score += 10.0
            evidence.append(EvidenceItem(
                category="writing_style",
                title="Urgency / Psychological Pressure Cues",
                description="Message imposes urgent deadlines, account lockouts, or immediate action demands.",
                severity="medium",
                score_impact=10.0
            ))

        if writing_style.get("threat_detected"):
            style_score += 10.0
            evidence.append(EvidenceItem(
                category="writing_style",
                title="Legal or Coercive Threats",
                description="Threatening language regarding legal action or permanent penalties observed.",
                severity="high",
                score_impact=10.0
            ))

        total_score += min(style_score, 25.0)

        # 3. URL Lexical Signals (up to 20 points)
        url_score = 0.0
        for u in urls_analysis:
            if u.get("is_ip_host"):
                url_score += 20.0
                evidence.append(EvidenceItem(
                    category="url",
                    title="Direct IP Address in URL Link",
                    description=f"Link targets raw IP '{u['url']}' rather than a verified hostname.",
                    severity="high",
                    score_impact=20.0
                ))
                break
            elif u.get("brand_spoofing"):
                url_score += 15.0
                evidence.append(EvidenceItem(
                    category="url",
                    title="Domain Brand Spoofing Suspected",
                    description=f"URL '{u['url']}' includes brand identifiers outside the root domain.",
                    severity="high",
                    score_impact=15.0
                ))
                break
            elif u.get("has_suspicious_tld"):
                url_score += 10.0
                evidence.append(EvidenceItem(
                    category="url",
                    title="Abusive Top-Level Domain (TLD)",
                    description=f"Link uses TLD often associated with throwaway phishing domains: {u['domain']}",
                    severity="medium",
                    score_impact=10.0
                ))
                break

        total_score += min(url_score, 20.0)

        # 4. Attachment Risk Signals (up to 15 points)
        att_score = 0.0
        for att in attachments:
            if att.get("risk_level") == "High":
                att_score += 15.0
                evidence.append(EvidenceItem(
                    category="attachment",
                    title=f"High-Risk Executable Attachment: {att['filename']}",
                    description=f"Dangerous payload ({att.get('mime_type', 'binary')}) detected with hash {att.get('sha256', '')[:12]}...",
                    severity="high",
                    score_impact=15.0
                ))
                break
            elif att.get("risk_level") == "Medium":
                att_score += 8.0
                evidence.append(EvidenceItem(
                    category="attachment",
                    title=f"Suspicious Container Attachment: {att['filename']}",
                    description="Archive or macro file type requiring deep inspection.",
                    severity="medium",
                    score_impact=8.0
                ))
                break

        total_score += min(att_score, 15.0)

        # 5. Header Anomalies (Reply-To mismatch)
        if parsed_info and parsed_info.get("reply_to_mismatch"):
            total_score += 15.0
            evidence.append(EvidenceItem(
                category="headers",
                title="Reply-To Domain Mismatch Detected",
                description=f"Reply-To address '{parsed_info.get('reply_to')}' points to a different domain than sender '{parsed_info.get('sender')}'.",
                severity="high",
                score_impact=15.0
            ))

        # 6. Recorded & Live Authentication Headers
        spf_res = auth_headers.get("spf_result", "Unknown")
        dkim_res = auth_headers.get("dkim_result", "None")
        if spf_res == "Fail/Softfail" or dkim_res == "Fail":
            total_score += 10.0
            evidence.append(EvidenceItem(
                category="authentication",
                title="Header Authentication Failure Recorded",
                description=f"Header indicates SPF: {spf_res}, DKIM: {dkim_res}.",
                severity="medium",
                score_impact=10.0
            ))
        elif spf_res == "Pass" and dkim_res == "Pass":
            total_score = max(0.0, total_score - 10.0)
            evidence.append(EvidenceItem(
                category="authentication",
                title="Header Authentication Pass Recorded",
                description="Both SPF and DKIM pass notations were observed in Received headers.",
                severity="info",
                score_impact=-10.0
            ))

        # Check live DNS SPF/DMARC result if available
        live_dns = auth_headers.get("live_dns", {})
        if live_dns.get("live_dns_checked"):
            if not live_dns.get("spf_record") and not live_dns.get("dmarc_record"):
                evidence.append(EvidenceItem(
                    category="authentication",
                    title="Missing DNS SPF and DMARC Protection",
                    description=f"Sender domain '{live_dns.get('domain')}' has neither SPF nor DMARC TXT records published in public DNS.",
                    severity="medium",
                    score_impact=5.0
                ))
                total_score += 5.0
            elif live_dns.get("dmarc_record"):
                evidence.append(EvidenceItem(
                    category="authentication",
                    title="Published DMARC Policy Verified",
                    description=f"Sender domain published valid DMARC TXT record in DNS.",
                    severity="info",
                    score_impact=0.0
                ))

        # Clamp between 0.0 and 100.0
        final_score = max(0.0, min(100.0, round(total_score, 1)))

        if final_score >= RISK_MEDIUM_MAX:
            risk_level = "High Risk"
        elif final_score >= RISK_LOW_MAX:
            risk_level = "Medium Risk"
        else:
            risk_level = "Low Risk"

        return risk_level, final_score, evidence, checks_performed, checks_unavailable, limitations

email_risk_engine = EmailRiskEngine()

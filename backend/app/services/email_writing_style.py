import re
from typing import Dict, Any, List

class WritingStyleAnalyzer:
    URGENCY_KEYWORDS = [
        "urgent", "immediately", "immediate action", "within 24 hours", "account suspended",
        "suspended", "suspension", "terminated", "terminate", "action required",
        "expires today", "final notice", "security alert", "critical update", "unauthorized access",
        "lock out", "locked out", "limited access", "deadline", "act now"
    ]

    CREDENTIAL_KEYWORDS = [
        "verify your account", "confirm your identity", "enter your password", "update your details",
        "update password", "reset password", "change password", "password", "login credentials",
        "social security", "credit card", "billing information", "banking login",
        "security questions", "otp", "one-time password", "click below to sign in", "re-enter password",
        "verify identity", "confirm password"
    ]

    THREAT_KEYWORDS = [
        "legal action", "law enforcement", "arrest warrant", "police", "court summons",
        "permanent closure", "irreversible", "prosecution", "penalty", "financial penalty",
        "breach of contract", "account deleted"
    ]

    SUSPICIOUS_PHRASES = [
        "congratulations you have won", "lottery winner", "wire transfer", "western union",
        "dear valued customer", "dear customer", "undisclosed recipient", "claim your prize",
        "inheritance fund", "beneficiary", "crypto transfer", "bitcoin payment"
    ]

    @staticmethod
    def analyze(text: str) -> Dict[str, Any]:
        """
        Extracts writing-style indicators based on linguistic patterns, urgency cues,
        threat language, and punctuation density.
        """
        text_lower = text.lower()
        
        detected_urgency = [k for k in WritingStyleAnalyzer.URGENCY_KEYWORDS if re.search(r'\b' + re.escape(k) + r'\b', text_lower)]
        detected_cred = [k for k in WritingStyleAnalyzer.CREDENTIAL_KEYWORDS if re.search(r'\b' + re.escape(k) + r'\b', text_lower)]
        detected_threat = [k for k in WritingStyleAnalyzer.THREAT_KEYWORDS if re.search(r'\b' + re.escape(k) + r'\b', text_lower)]
        detected_suspicious = [k for k in WritingStyleAnalyzer.SUSPICIOUS_PHRASES if re.search(r'\b' + re.escape(k) + r'\b', text_lower)]
        
        # Punctuation analysis
        exclamation_count = text.count("!")
        question_count = text.count("?")
        dollar_count = text.count("$")
        caps_words = re.findall(r'\b[A-Z]{3,}\b', text)
        
        excessive_punctuation = (exclamation_count >= 2 or dollar_count >= 2 or len(caps_words) >= 3)
        
        all_detected = detected_urgency + detected_cred + detected_threat + detected_suspicious

        return {
            "urgency_detected": len(detected_urgency) > 0,
            "credential_harvest_detected": len(detected_cred) > 0,
            "threat_detected": len(detected_threat) > 0,
            "excessive_punctuation": excessive_punctuation,
            "suspicious_phrases": all_detected,
            "detected_keywords": list(set(all_detected)),
            "metrics": {
                "urgency_count": len(detected_urgency),
                "credential_request_count": len(detected_cred),
                "threat_count": len(detected_threat),
                "exclamation_count": exclamation_count,
                "all_caps_word_count": len(caps_words)
            }
        }

writing_style_analyzer = WritingStyleAnalyzer()

import re
import ipaddress
from urllib.parse import urlparse, unquote
from typing import Dict, Any, List
import tldextract
from backend.app.config import VIRUSTOTAL_API_KEY, PHISHTANK_API_KEY

SUSPICIOUS_TLDS = {
    "xyz", "top", "buzz", "club", "work", "icu", "fit", "tk", "ml", "ga", "cf", "gq",
    "country", "stream", "kim", "download", "racing", "win", "bid"
}

POPULAR_BRANDS = [
    "paypal", "apple", "google", "microsoft", "netflix", "amazon", "chase", "bankofamerica",
    "wellsfargo", "facebook", "instagram", "linkedin", "dropbox", "dhl", "fedex", "usps"
]

class UrlAnalyzerService:
    @staticmethod
    def analyze_url(raw_url: str) -> Dict[str, Any]:
        """
        Performs safe local lexical inspection of a URL.
        Does NOT connect to or visit the target URL.
        """
        # Ensure scheme for proper urlparse
        formatted_url = raw_url
        if not re.match(r'^[a-zA-Z]+://', raw_url):
            formatted_url = "http://" + raw_url

        try:
            parsed = urlparse(formatted_url)
            host = parsed.hostname or ""
            path = parsed.path or ""
        except Exception:
            host = raw_url
            path = ""

        # Extract TLD parts
        extracted = tldextract.extract(formatted_url)
        domain = f"{extracted.domain}.{extracted.suffix}" if extracted.suffix else extracted.domain
        subdomain = extracted.subdomain
        suffix = extracted.suffix.lower()

        # 1. IP Host check
        is_ip_host = False
        try:
            ipaddress.ip_address(host)
            is_ip_host = True
        except ValueError:
            is_ip_host = False

        # 2. Suspicious TLD
        has_suspicious_tld = suffix in SUSPICIOUS_TLDS

        # 3. Excessive subdomains or deceptive brand spoofing
        dots_in_sub = subdomain.count(".")
        excessive_subdomains = dots_in_sub >= 2 or len(subdomain) > 25
        
        # Brand spoofing in subdomain or path
        brand_spoofing = False
        target_brand = None
        for brand in POPULAR_BRANDS:
            if brand in subdomain.lower() or brand in path.lower():
                if brand != extracted.domain.lower():
                    brand_spoofing = True
                    target_brand = brand
                    break

        # 4. Punycode or URL encoding abuse
        has_punycode_or_encoding = ("xn--" in host.lower()) or ("%" in raw_url and "%" in unquote(raw_url))

        # Threat Intelligence check status
        threat_intel_status = "Not configured (VIRUSTOTAL_API_KEY absent)"
        threat_intel_details = None

        if VIRUSTOTAL_API_KEY:
            # When key is configured, query could be made here safely via GET to VT API
            threat_intel_status = "API Key present; offline check preferred to preserve privacy."
        else:
            threat_intel_status = "External Threat Intelligence Not Configured"

        risk_score = 0
        risk_flags = []
        if is_ip_host:
            risk_score += 40
            risk_flags.append("Host is an IP address instead of a recognized domain")
        if brand_spoofing:
            risk_score += 40
            risk_flags.append(f"Possible brand spoofing of '{target_brand}' in host/path while registered domain is '{domain}'")
        if has_suspicious_tld:
            risk_score += 20
            risk_flags.append(f"Suspicious top-level domain '.{suffix}' frequently abused in phishing")
        if excessive_subdomains:
            risk_score += 15
            risk_flags.append("Unusually deep subdomain structure")
        if has_punycode_or_encoding:
            risk_score += 20
            risk_flags.append("Contains Punycode (IDN homograph candidate) or excessive URL encoding")

        return {
            "url": raw_url,
            "domain": domain,
            "subdomain": subdomain,
            "is_ip_host": is_ip_host,
            "has_suspicious_tld": has_suspicious_tld,
            "excessive_subdomains": excessive_subdomains,
            "has_punycode_or_encoding": has_punycode_or_encoding,
            "brand_spoofing": brand_spoofing,
            "threat_intel_status": threat_intel_status,
            "threat_intel_details": threat_intel_details,
            "risk_score": min(risk_score, 100),
            "risk_flags": risk_flags
        }

    @staticmethod
    def analyze_urls(urls: List[str]) -> List[Dict[str, Any]]:
        return [UrlAnalyzerService.analyze_url(u) for u in urls[:25]]

url_analyzer_service = UrlAnalyzerService()

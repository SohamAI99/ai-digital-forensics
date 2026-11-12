import email
from email import policy
from email.parser import BytesParser, Parser
import re
import hashlib
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

class EmailParserService:
    @staticmethod
    def extract_urls(text: str) -> List[str]:
        """Extracts all http/https/www URLs and naked domain links from text."""
        url_pattern = re.compile(
            r'https?://[^\s<>"\',;]+|www\.[^\s<>"\',;]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s<>"\',;]*)?',
            re.IGNORECASE
        )
        matches = url_pattern.findall(text)
        cleaned = []
        for m in matches:
            m_clean = m.rstrip('.,)>]}')
            # Filter common false positives like email addresses or file names
            if "@" in m_clean or m_clean.endswith(".py") or m_clean.endswith(".csv"):
                continue
            if "." in m_clean and len(m_clean) > 4:
                cleaned.append(m_clean)
        # Unique preserving order
        seen = set()
        unique_urls = []
        for u in cleaned:
            if u not in seen:
                seen.add(u)
                unique_urls.append(u)
        return unique_urls

    @staticmethod
    def query_dns_auth(sender_address: str) -> Dict[str, Any]:
        """
        Performs non-blocking live DNS SPF and DMARC TXT record checks for the sender domain.
        Fails safely if offline or DNS resolution is unavailable.
        """
        result = {
            "live_dns_checked": False,
            "spf_record": None,
            "dmarc_record": None,
            "dns_status": "Not queried"
        }
        if not sender_address:
            result["dns_status"] = "No sender address found"
            return result

        domain_match = re.search(r'@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', sender_address)
        if not domain_match:
            result["dns_status"] = "Invalid sender domain format"
            return result

        domain = domain_match.group(1).lower().strip()
        result["domain"] = domain

        try:
            import dns.resolver
            resolver = dns.resolver.Resolver()
            resolver.lifetime = 1.5
            resolver.timeout = 1.5

            # 1. Query SPF TXT record
            try:
                answers = resolver.resolve(domain, 'TXT')
                for rdata in answers:
                    txt_str = "".join([
                        s.decode('utf-8', errors='ignore') if isinstance(s, bytes) else str(s)
                        for s in rdata.strings
                    ])
                    if "v=spf1" in txt_str.lower():
                        result["spf_record"] = txt_str
                        break
            except Exception:
                pass

            # 2. Query DMARC TXT record
            try:
                dmarc_domain = f"_dmarc.{domain}"
                answers = resolver.resolve(dmarc_domain, 'TXT')
                for rdata in answers:
                    txt_str = "".join([
                        s.decode('utf-8', errors='ignore') if isinstance(s, bytes) else str(s)
                        for s in rdata.strings
                    ])
                    if "v=dmarc1" in txt_str.lower():
                        result["dmarc_record"] = txt_str
                        break
            except Exception:
                pass

            result["live_dns_checked"] = True
            result["dns_status"] = "DNS records queried successfully"
        except Exception as e:
            result["dns_status"] = f"Live DNS check skipped or network unavailable: {e}"

        return result

    @staticmethod
    def parse_eml_bytes(data: bytes) -> Dict[str, Any]:
        """Parses raw EML bytes into structured fields and attachment metadata."""
        msg = BytesParser(policy=policy.default).parsebytes(data)
        return EmailParserService._process_message_object(msg)

    @staticmethod
    def parse_text_or_headers(text: str) -> Dict[str, Any]:
        """Parses raw text which might be headers + body or plain body."""
        # If it looks like RFC 822 format (contains From:, Subject:, etc.)
        if "From:" in text and ("Subject:" in text or "To:" in text):
            msg = Parser(policy=policy.default).parsestr(text)
            return EmailParserService._process_message_object(msg)
        else:
            # Plain body text
            urls = EmailParserService.extract_urls(text)
            return {
                "sender": None,
                "recipient": None,
                "reply_to": None,
                "subject": "Pasted Email Content",
                "date": None,
                "message_id": None,
                "received_hops": 0,
                "received_chain": [],
                "reply_to_mismatch": False,
                "body": text,
                "urls": urls,
                "attachments": [],
                "authentication_headers": {
                    "spf": "Not present in pasted body",
                    "dkim": "Not present in pasted body",
                    "dmarc": "Not present in pasted body",
                    "note": "Only full raw RFC822 (.eml) headers contain recorded SPF/DKIM authentication records.",
                    "live_dns": {"live_dns_checked": False, "dns_status": "No sender domain available in pasted body"}
                }
            }

    @staticmethod
    def _process_message_object(msg: email.message.EmailMessage) -> Dict[str, Any]:
        sender = msg.get("From", "")
        recipient = msg.get("To", "")
        reply_to = msg.get("Reply-To", "")
        subject = msg.get("Subject", "(No Subject)")
        date = msg.get("Date", "")
        message_id = msg.get("Message-ID", "")

        # Extract Received chain (hops)
        received_headers = msg.get_all("Received", [])
        received_hops = len(received_headers)
        received_chain = [str(r).strip().replace("\n", " ") for r in received_headers]

        # Detect Reply-To domain spoofing / discrepancy
        reply_to_mismatch = False
        if reply_to and sender:
            s_match = re.search(r'@([a-zA-Z0-9.-]+)', sender)
            r_match = re.search(r'@([a-zA-Z0-9.-]+)', reply_to)
            if s_match and r_match:
                if s_match.group(1).lower() != r_match.group(1).lower():
                    reply_to_mismatch = True

        # Extract body
        body = ""
        try:
            body_part = msg.get_body(preferencelist=('plain', 'html'))
            if body_part:
                body = body_part.get_content()
        except Exception:
            # Fallback iteration over parts
            for part in msg.walk():
                if part.get_content_type() == 'text/plain':
                    try:
                        body += part.get_content() + "\n"
                    except Exception:
                        pass

        if not body:
            # Fallback to string payload if plain
            payload = msg.get_payload()
            if isinstance(payload, str):
                body = payload

        # Extract Authentication Headers recorded in email
        received_spf = msg.get("Received-SPF", "")
        auth_results = msg.get("Authentication-Results", "")
        dkim_sig = msg.get("DKIM-Signature", "")
        arc_auth = msg.get("ARC-Authentication-Results", "")

        # Optional live DNS verification
        live_dns = EmailParserService.query_dns_auth(sender)

        auth_headers = {
            "received_spf": received_spf or "None recorded",
            "authentication_results": auth_results or "None recorded",
            "dkim_signature_present": bool(dkim_sig),
            "arc_authentication": arc_auth or "None recorded",
            "header_recorded_status": "Inspected from email header fields; live DNS verification performed where accessible.",
            "spf_result": "Pass" if "pass" in (received_spf + auth_results).lower() else ("Fail/Softfail" if "fail" in (received_spf + auth_results).lower() else "Unknown/None"),
            "dkim_result": "Pass" if "dkim=pass" in auth_results.lower() else ("Fail" if "dkim=fail" in auth_results.lower() else ("Present" if dkim_sig else "None")),
            "dmarc_result": "Pass" if "dmarc=pass" in auth_results.lower() else ("Fail" if "dmarc=fail" in auth_results.lower() else "None"),
            "live_dns": live_dns
        }

        # Extract Attachments safely (metadata only)
        attachments = []
        for part in msg.iter_attachments():
            fname = part.get_filename() or "unnamed_attachment"
            content_bytes = part.get_payload(decode=True) or b""
            size = len(content_bytes)
            sha256_hash = hashlib.sha256(content_bytes).hexdigest() if content_bytes else "empty"
            ext = ("." + fname.split(".")[-1].lower()) if "." in fname else ""
            mime_type = part.get_content_type() or "application/octet-stream"

            # Risk check on extensions
            dangerous_exts = {".exe", ".scr", ".bat", ".cmd", ".ps1", ".vbs", ".js", ".hta", ".iso", ".img", ".jar", ".msi"}
            suspicious_exts = {".zip", ".rar", ".7z", ".docm", ".xlsm", ".pptm", ".tar", ".gz"}
            if ext in dangerous_exts:
                risk = "High"
                note = "Executable file type detected. High risk in email attachments."
            elif ext in suspicious_exts:
                risk = "Medium"
                note = "Compressed archive or macro-enabled document. Requires inspection."
            else:
                risk = "Low"
                note = "Standard attachment format."

            attachments.append({
                "filename": fname,
                "extension": ext,
                "mime_type": mime_type,
                "size_bytes": size,
                "sha256": sha256_hash,
                "risk_level": risk,
                "note": note
            })

        urls = EmailParserService.extract_urls(body)

        return {
            "sender": sender,
            "recipient": recipient,
            "reply_to": reply_to,
            "subject": subject,
            "date": date,
            "message_id": message_id,
            "received_hops": received_hops,
            "received_chain": received_chain,
            "reply_to_mismatch": reply_to_mismatch,
            "body": body,
            "urls": urls,
            "attachments": attachments,
            "authentication_headers": auth_headers
        }

email_parser_service = EmailParserService()

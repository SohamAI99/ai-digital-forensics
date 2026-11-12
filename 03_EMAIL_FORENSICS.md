# Email Threat and Forensic Analysis

## Objective
Analyze suspicious emails for phishing and social-engineering indicators while preserving forensic evidence.

## Input
Primary:
- .eml

Optional:
- .msg
- pasted raw email

## Parser
Extract:
- From
- To
- Reply-To
- Subject
- Date
- Message-ID
- Received chain
- Authentication results
- Body
- URLs
- Attachments

## Header and Authentication Analysis
Analyze SPF, DKIM, and DMARC results when available in the email/header evidence.

Important: parsing a textual Authentication-Results header is not the same as independently verifying authentication.

## URL/Domain Engine
Analyze:
- URL structure
- domain
- IP-based URLs
- suspicious TLDs
- typosquatting/brand similarity
- redirects where safely supported
- reputation/OSINT sources when configured

Possible external sources:
- VirusTotal
- PhishTank
- OpenPhish
- WHOIS/domain information

Threat intelligence is supporting evidence, not absolute truth.

## NLP
Use a baseline such as TF-IDF + Logistic Regression/SVM and a Transformer such as DistilBERT/BERT for phishing/social-engineering classification.

Look for:
- urgency
- credential requests
- financial pressure
- impersonation
- suspicious instructions
- social-engineering language

## Attachment Forensics
- Calculate SHA-256
- Record filename and MIME type
- Inspect extension and structural properties
- Never execute attachments
- Optionally query reputation services by hash

## Explainability
Use LIME/SHAP where appropriate to identify influential textual features.

## Output
The email result should contain:
- classification
- risk assessment
- confidence
- evidence
- extracted IOCs
- authentication findings
- model/version
- explainability
- limitations
- forensic report reference

## Testing
Include benign emails, obvious phishing, sophisticated BEC/social engineering, malformed headers, suspicious URLs, and emails with attachments.

Evaluate precision, recall, F1, ROC-AUC where appropriate, and false-positive/false-negative behavior.

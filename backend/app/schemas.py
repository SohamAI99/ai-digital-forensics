from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class EmailAnalyzeRequest(BaseModel):
    email_text: Optional[str] = Field(None, description="Raw email text or body content")
    sender: Optional[str] = Field(None, description="Extracted sender address if known")
    recipient: Optional[str] = Field(None, description="Extracted recipient address if known")
    subject: Optional[str] = Field(None, description="Extracted subject line if known")

class EvidenceItem(BaseModel):
    category: str
    title: str
    description: str
    severity: str  # high, medium, low, info
    score_impact: float

class UrlFinding(BaseModel):
    url: str
    domain: str
    is_ip_host: bool
    has_suspicious_tld: bool
    excessive_subdomains: bool
    has_punycode_or_encoding: bool
    threat_intel_status: str
    threat_intel_details: Optional[str] = None

class AttachmentFinding(BaseModel):
    filename: str
    extension: str
    mime_type: Optional[str] = None
    size_bytes: int
    sha256: str
    risk_level: str
    note: str

class WritingStyleAnalysis(BaseModel):
    urgency_detected: bool
    credential_harvest_detected: bool
    threat_detected: bool
    excessive_punctuation: bool
    suspicious_phrases: List[str]
    detected_keywords: List[str]

class LimeFeature(BaseModel):
    word: str
    weight: float

class EmailAnalyzeResponse(BaseModel):
    analysis_id: str
    timestamp: str
    identifier: str
    prediction: str
    phishing_probability: float
    safe_probability: float
    risk_level: str
    overall_risk_score: float
    parsed_metadata: Dict[str, Any]
    writing_style: WritingStyleAnalysis
    urls: List[UrlFinding]
    attachments: List[AttachmentFinding]
    authentication_headers: Dict[str, Any]
    lime_features: List[LimeFeature]
    lime_status: str
    evidence: List[EvidenceItem]
    checks_performed: List[str]
    checks_unavailable: List[str]
    limitations: List[str]

class ExifMetadata(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    datetime_original: Optional[str] = None
    creation_date: Optional[str] = None
    modification_date: Optional[str] = None
    temporal_status: Optional[str] = None
    datetime_modified: Optional[str] = None
    software: Optional[str] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    has_exif: bool
    anomaly_flags: List[str] = []
    raw_tags: Dict[str, Any] = {}
    gps_info: Optional[Dict[str, Any]] = None
    camera_details: Optional[Dict[str, Any]] = Field(default_factory=dict)
    file_properties: Optional[Dict[str, Any]] = Field(default_factory=dict)
    ai_generation_detected: bool = False
    ai_tool_signatures: List[str] = Field(default_factory=list)
    ai_prompt_metadata: Optional[str] = None
    editing_software_detected: bool = False
    metadata_verdict: str = "Metadata Stripped / Inconclusive"
    metadata_risk_score: float = 0.0

class FrequencyMetrics(BaseModel):
    fft_spectrum_url: Optional[str] = None
    dct_spectrum_url: Optional[str] = None
    high_freq_ratio: float
    spectral_centroid: float
    azimuthal_deviation: float
    analysis_summary: str

class ImageAnalyzeResponse(BaseModel):
    analysis_id: str
    timestamp: str
    filename: str
    sha256: str
    file_size_bytes: int
    dimensions: List[int]
    prediction: str
    deepfake_probability: float
    pristine_probability: float
    risk_level: str
    overall_risk_score: float
    face_detected: bool
    face_crop_url: Optional[str] = None
    original_image_url: Optional[str] = None
    exif: ExifMetadata
    frequency: FrequencyMetrics
    gradcam_url: Optional[str] = None
    evidence: List[EvidenceItem]
    checks_performed: List[str]
    checks_unavailable: List[str]
    limitations: List[str]

class DashboardSummaryResponse(BaseModel):
    email_total: int
    image_total: int
    high_risk_emails: int
    potential_deepfakes: int
    recent_activity: List[Dict[str, Any]]

export interface EvidenceItem {
  category: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  score_impact: number;
}

export interface UrlFinding {
  url: string;
  domain: string;
  subdomain?: string;
  is_ip_host: boolean;
  has_suspicious_tld: boolean;
  excessive_subdomains: boolean;
  has_punycode_or_encoding: boolean;
  brand_spoofing?: boolean;
  threat_intel_status: string;
  threat_intel_details?: string | null;
  risk_score?: number;
  risk_flags?: string[];
}

export interface AttachmentFinding {
  filename: string;
  extension: string;
  mime_type?: string;
  size_bytes: number;
  sha256: string;
  risk_level: 'High' | 'Medium' | 'Low';
  note: string;
}

export interface WritingStyleAnalysis {
  urgency_detected: boolean;
  credential_harvest_detected: boolean;
  threat_detected: boolean;
  excessive_punctuation: boolean;
  suspicious_phrases: string[];
  detected_keywords: string[];
  metrics?: {
    urgency_count: number;
    credential_request_count: number;
    threat_count: number;
    exclamation_count: number;
    all_caps_word_count: number;
  };
}

export interface LimeFeature {
  word: string;
  weight: number;
}

export interface EmailAnalyzeResponse {
  analysis_id: string;
  timestamp: string;
  identifier: string;
  prediction: string;
  phishing_probability: number;
  safe_probability: number;
  risk_level: string;
  overall_risk_score: number;
  parsed_metadata: {
    sender?: string | null;
    recipient?: string | null;
    reply_to?: string | null;
    subject?: string | null;
    date?: string | null;
    message_id?: string | null;
    received_hops?: number;
    reply_to_mismatch?: boolean;
    body_snippet?: string;
  };
  writing_style: WritingStyleAnalysis;
  urls: UrlFinding[];
  attachments: AttachmentFinding[];
  authentication_headers: Record<string, any>;
  lime_features: LimeFeature[];
  lime_status: string;
  evidence: EvidenceItem[];
  checks_performed: string[];
  checks_unavailable: string[];
  limitations: string[];
}

export interface CameraDetails {
  make?: string | null;
  model?: string | null;
  lens_model?: string | null;
  iso?: number | string | null;
  exposure_time?: string | null;
  f_number?: string | null;
  focal_length?: string | null;
  flash?: string | null;
  white_balance?: string | null;
  metering_mode?: string | null;
  software?: string | null;
  datetime_original?: string | null;
  creation_date?: string | null;
  modification_date?: string | null;
}

export interface FileProperties {
  file_format?: string | null;
  mime_type?: string | null;
  dimensions?: string | null;
  megapixels?: string | null;
  aspect_ratio?: string | null;
  color_mode?: string | null;
  channels?: number | null;
  bit_depth?: string | null;
  file_size_formatted?: string | null;
  sha256?: string | null;
  dpi?: string | null;
  compression?: string | null;
  chroma_subsampling?: string | null;
  compression_quality?: string | null;
  encoding_process?: string | null;
  creation_date?: string | null;
  modification_date?: string | null;
  temporal_status?: string | null;
}

export interface ExifMetadata {
  make?: string | null;
  model?: string | null;
  datetime_original?: string | null;
  creation_date?: string | null;
  modification_date?: string | null;
  temporal_status?: string | null;
  datetime_modified?: string | null;
  software?: string | null;
  image_width?: number | null;
  image_height?: number | null;
  has_exif: boolean;
  anomaly_flags: string[];
  raw_tags: Record<string, any>;
  gps_info?: Record<string, any> | null;
  camera_details?: CameraDetails;
  file_properties?: FileProperties;
  ai_generation_detected?: boolean;
  ai_tool_signatures?: string[];
  ai_prompt_metadata?: string | null;
  editing_software_detected?: boolean;
  metadata_verdict?: string;
  metadata_risk_score?: number;
}

export interface FrequencyMetrics {
  fft_spectrum_url?: string | null;
  dct_spectrum_url?: string | null;
  high_freq_ratio: number;
  spectral_centroid: number;
  azimuthal_deviation: number;
  analysis_summary: string;
}

export interface ImageAnalyzeResponse {
  analysis_id: string;
  timestamp: string;
  filename: string;
  sha256: string;
  file_size_bytes: number;
  dimensions: [number, number];
  prediction: string;
  deepfake_probability: number;
  pristine_probability: number;
  risk_level: string;
  overall_risk_score: number;
  face_detected: boolean;
  face_crop_url?: string | null;
  original_image_url?: string | null;
  exif: ExifMetadata;
  frequency: FrequencyMetrics;
  gradcam_url?: string | null;
  evidence: EvidenceItem[];
  checks_performed: string[];
  checks_unavailable: string[];
  limitations: string[];
}

export interface DashboardSummary {
  email_total: number;
  image_total: number;
  high_risk_emails: number;
  potential_deepfakes: number;
  recent_activity: Array<{
    id: string;
    analysis_type: 'email' | 'image';
    timestamp: string;
    identifier: string;
    classification: string;
    risk_level: string;
    overall_score: number;
  }>;
}

export interface HistoryItem {
  id: string;
  analysis_type: 'email' | 'image';
  timestamp: string;
  identifier: string;
  classification: string;
  risk_level: string;
  overall_score: number;
  summary: string;
  details?: Record<string, any>;
  report_pdf_path?: string | null;
}

export interface HealthStatus {
  status: string;
  email_model_loaded: boolean;
  vision_model_loaded: boolean;
  email_model_type: string;
  vision_model_name: string;
  vision_device: string;
}

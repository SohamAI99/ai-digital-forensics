import type {
  EmailAnalyzeResponse,
  ImageAnalyzeResponse,
  DashboardSummary,
  HistoryItem,
  HealthStatus
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to reach backend health endpoint');
  return res.json();
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function analyzeEmail(text?: string, file?: File): Promise<EmailAnalyzeResponse> {
  const formData = new FormData();
  if (text) formData.append('email_text', text);
  if (file) formData.append('file', file);

  const res = await fetch(`${API_BASE}/email/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Email analysis failed');
  }

  return res.json();
}

export async function analyzeImage(file: File): Promise<ImageAnalyzeResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/image/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Image analysis failed');
  }

  return res.json();
}

export async function fetchHistory(type?: 'email' | 'image', limit = 50): Promise<{ count: number; items: HistoryItem[] }> {
  const url = new URL(`${API_BASE}/history`, window.location.origin);
  if (type) url.searchParams.set('type', type);
  url.searchParams.set('limit', limit.toString());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch analysis history');
  return res.json();
}

export async function fetchAnalysisDetails(id: string): Promise<HistoryItem> {
  const res = await fetch(`${API_BASE}/history/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch details for analysis ${id}`);
  return res.json();
}

export async function fetchEvaluationMetrics(): Promise<any> {
  const res = await fetch(`${API_BASE}/evaluation/metrics`);
  if (!res.ok) throw new Error('Failed to fetch model evaluation metrics');
  return res.json();
}

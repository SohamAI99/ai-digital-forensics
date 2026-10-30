import React, { useState } from 'react';
import {
  Mail,
  Upload,
  AlertCircle,
  Shield,
  Download,
  Zap,
  Info,
  Link as LinkIcon,
  Paperclip,
  RotateCcw
} from 'lucide-react';
import { analyzeEmail } from '../services/api';
import type { EmailAnalyzeResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';

const SAMPLE_PHISH = `From: Security Alert <service-update@account-security-alert.xyz>
To: target-user@company.com
Subject: URGENT: Your banking access has been suspended today
Date: Wed, 28 Oct 2026 09:14:22 +0000
Received-SPF: fail (domain of account-security-alert.xyz does not designate permitted sender)
Authentication-Results: spf=fail; dkim=fail; dmarc=fail

Dear Valued Customer,

We have detected unauthorized login attempts on your banking profile. Your account will be permanently locked out and suspended within 24 hours.

Immediate action required: Confirm your identity and enter your password now to avoid permanent closure.

Please verify your credentials immediately at:
http://192.168.1.50/login/update-credentials.php
https://paypal.com.account-update.xyz/verify

Thank you,
Corporate Security Team`;

const SAMPLE_SAFE = `From: Sarah Jenkins <s.jenkins@innovatetech.org>
To: team-lead@company.com
Subject: Project sprint agenda and roadmap notes
Date: Wed, 28 Oct 2026 10:30:00 +0000
Received-SPF: pass (google.com: domain of s.jenkins@innovatetech.org designates 209.85.220.41 as permitted sender)
Authentication-Results: spf=pass; dkim=pass (signature verified); dmarc=pass

Hi Team,

Please review the attached project roadmap for next week's sprint planning. We will meet tomorrow at 10:00 AM in Conference Room B or via the standard video bridge.

Let me know if there are any additional discussion topics you would like to add to the agenda.

Best regards,
Sarah Jenkins
Lead Software Engineer`;

export const EmailForensics: React.FC = () => {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [emailText, setEmailText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmailAnalyzeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'evidence' | 'lime' | 'urls' | 'headers' | 'attachments'>('evidence');

  const handleAnalyze = async () => {
    if (inputMode === 'text' && !emailText.trim()) {
      setError('Please paste email text or headers to analyze.');
      return;
    }
    if (inputMode === 'file' && !selectedFile) {
      setError('Please choose an .eml or .txt file to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await analyzeEmail(
        inputMode === 'text' ? emailText : undefined,
        inputMode === 'file' ? selectedFile || undefined : undefined
      );
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please verify the input.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setEmailText('');
    setSelectedFile(null);
    setError(null);
    setResult(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto theme-transition">
      {/* Input Section */}
      <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-semibold text-theme-heading">Email Investigation Workspace</h3>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center bg-theme-inset p-1 rounded-lg border border-theme text-xs">
            <button
              onClick={() => { setInputMode('text'); setError(null); }}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                inputMode === 'text' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-theme-muted hover:text-theme-heading'
              }`}
            >
              Paste Text / Headers
            </button>
            <button
              onClick={() => { setInputMode('file'); setError(null); }}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                inputMode === 'file' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-theme-muted hover:text-theme-heading'
              }`}
            >
              Upload .EML / .TXT
            </button>
          </div>
        </div>

        {/* Input Box */}
        {inputMode === 'text' ? (
          <div>
            <textarea
              rows={8}
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste complete raw email message, RFC 822 headers, or email body text here..."
              className="w-full p-4 rounded-lg bg-theme-inset border border-theme-subtle text-theme-heading text-xs font-mono focus:border-blue-500 focus:outline-none transition leading-relaxed placeholder:text-theme-dim"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-theme-muted">Quick Samples:</span>
                <button
                  type="button"
                  onClick={() => setEmailText(SAMPLE_PHISH)}
                  className="px-2.5 py-1 text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded transition cursor-pointer font-medium"
                >
                  Phishing Sample
                </button>
                <button
                  type="button"
                  onClick={() => setEmailText(SAMPLE_SAFE)}
                  className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition cursor-pointer font-medium"
                >
                  Legitimate Sample
                </button>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-theme-muted hover:text-theme-heading flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-theme-subtle rounded-lg text-center bg-theme-inset hover:border-blue-500/50 transition">
            <Upload className="w-10 h-10 text-theme-dim mx-auto mb-3" />
            <p className="text-sm text-theme-heading font-medium">Select an .eml or .txt email file</p>
            <p className="text-xs text-theme-muted mt-1 mb-4">
              Metadata, headers, and body will be safely extracted without executing attachments.
            </p>
            <input
              type="file"
              accept=".eml,.txt,.msg"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-xs text-theme-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />
            {selectedFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-3">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs tracking-wide transition shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Forensic Pipeline...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Execute Email Threat Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results View */}
      {result && (
        <div className="space-y-6">
          {/* Top Result Banner */}
          <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-theme">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-theme-heading tracking-wide">
                    {result.prediction}
                  </h3>
                  <RiskBadge level={result.risk_level} score={result.overall_risk_score} />
                </div>
                <p className="text-xs text-theme-muted font-mono mt-1">
                  Case Reference: {result.analysis_id} &bull; Target: {result.identifier}
                </p>
              </div>

              {/* Download Report Button */}
              <a
                href={`/api/reports/${result.analysis_id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-theme-subtle hover:bg-slate-200 dark:hover:bg-slate-700 text-theme-main hover:text-theme-heading text-xs font-semibold border border-theme flex items-center space-x-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Export Court-Grade PDF Report</span>
              </a>
            </div>

            {/* Scores & Probabilities Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Overall Risk Score */}
              <div className="p-4 rounded-lg bg-theme-inset border border-theme">
                <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                  <span>Calculated Risk Assessment</span>
                  <span className="font-mono text-theme-heading font-semibold">{result.overall_risk_score}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      result.overall_risk_score >= 70
                        ? 'bg-rose-500'
                        : result.overall_risk_score >= 30
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${result.overall_risk_score}%` }}
                  />
                </div>
                <p className="text-[11px] text-theme-muted mt-2">
                  Multi-factor composite score (ML + heuristics + URLs + headers).
                </p>
              </div>

              {/* ML Model Phishing Score */}
              <div className="p-4 rounded-lg bg-theme-inset border border-theme">
                <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                  <span>ML Classifier Phishing Score</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">
                    {(result.phishing_probability * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${result.phishing_probability * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-theme-muted mt-2">
                  TF-IDF Logistic Regression pipeline probability.
                </p>
              </div>

              {/* ML Model Legitimate Score */}
              <div className="p-4 rounded-lg bg-theme-inset border border-theme">
                <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                  <span>ML Classifier Legitimate Score</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {(result.safe_probability * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${result.safe_probability * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-theme-muted mt-2">
                  Probability of benign communication patterns.
                </p>
              </div>
            </div>
          </div>

          {/* Results Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-theme overflow-x-auto text-xs pb-1">
            {[
              { id: 'evidence', label: 'Threat Evidence', icon: AlertCircle, count: result.evidence.length },
              { id: 'lime', label: 'Explainable AI (LIME)', icon: Zap, count: result.lime_features.length },
              { id: 'urls', label: 'URL Forensics', icon: LinkIcon, count: result.urls.length },
              { id: 'headers', label: 'Authentication Headers', icon: Shield },
              { id: 'attachments', label: 'Attachments', icon: Paperclip, count: result.attachments.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2.5 font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10 font-semibold'
                      : 'border-transparent text-theme-muted hover:text-theme-heading'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-theme-subtle text-theme-main border border-theme font-mono">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Threat Evidence */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-theme-card border border-theme shadow-theme-card flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-theme-subtle text-theme-muted border border-theme">
                          {ev.category}
                        </span>
                        <span
                          className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                            ev.severity === 'high'
                              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                              : ev.severity === 'medium'
                              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {ev.severity} severity
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-theme-heading mt-1">{ev.title}</h4>
                      <p className="text-xs text-theme-main mt-1 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-theme flex items-center justify-between text-[11px] text-theme-muted">
                      <span>Score Impact:</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                        +{ev.score_impact} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Writing Style Signals Summary */}
              <div className="p-5 rounded-xl bg-theme-card border border-theme shadow-theme-card">
                <h4 className="text-xs font-semibold text-theme-heading uppercase tracking-wider mb-3">
                  Writing Style & Linguistic Indicators
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                  <div className="p-2.5 rounded bg-theme-inset border border-theme">
                    <p className="text-theme-muted text-[11px]">Urgency Cues</p>
                    <p className={`font-semibold mt-0.5 ${result.writing_style.urgency_detected ? 'text-rose-600 dark:text-rose-400' : 'text-theme-muted'}`}>
                      {result.writing_style.urgency_detected ? 'DETECTED' : 'Not detected'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-theme-inset border border-theme">
                    <p className="text-theme-muted text-[11px]">Credential Solicitations</p>
                    <p className={`font-semibold mt-0.5 ${result.writing_style.credential_harvest_detected ? 'text-rose-600 dark:text-rose-400' : 'text-theme-muted'}`}>
                      {result.writing_style.credential_harvest_detected ? 'DETECTED' : 'Not detected'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-theme-inset border border-theme">
                    <p className="text-theme-muted text-[11px]">Threat/Coercion</p>
                    <p className={`font-semibold mt-0.5 ${result.writing_style.threat_detected ? 'text-rose-600 dark:text-rose-400' : 'text-theme-muted'}`}>
                      {result.writing_style.threat_detected ? 'DETECTED' : 'Not detected'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-theme-inset border border-theme">
                    <p className="text-theme-muted text-[11px]">Excessive Punctuation</p>
                    <p className={`font-semibold mt-0.5 ${result.writing_style.excessive_punctuation ? 'text-amber-600 dark:text-amber-400' : 'text-theme-muted'}`}>
                      {result.writing_style.excessive_punctuation ? 'FLAGGED' : 'Normal'}
                    </p>
                  </div>
                </div>

                {result.writing_style.detected_keywords.length > 0 && (
                  <div>
                    <p className="text-[11px] text-theme-muted mb-2">Flagged vocabulary tokens in body:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.writing_style.detected_keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-mono"
                        >
                          "{kw}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: LIME Explainable AI */}
          {activeTab === 'lime' && (
            <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card space-y-5">
              <div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  <h4 className="text-sm font-semibold text-theme-heading">
                    LIME (Local Interpretable Model-agnostic Explanations)
                  </h4>
                </div>
                <p className="text-xs text-theme-muted mt-1">
                  Status: <span className="text-theme-heading font-mono">{result.lime_status}</span>
                </p>
                <p className="text-xs text-theme-muted mt-1">
                  Words shown below represent statistically perturbed features that influenced the
                  scikit-learn classifier toward Phishing (positive weight) or Legitimate (negative weight).
                </p>
              </div>

              {result.lime_features.length > 0 ? (
                <div className="space-y-3">
                  {result.lime_features.map((feat, i) => {
                    const isPhishingInfl = feat.weight > 0;
                    return (
                      <div key={i} className="flex items-center space-x-3 text-xs">
                        <span className="w-28 font-mono font-semibold text-theme-heading truncate text-right">
                          {feat.word}
                        </span>
                        <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden flex">
                          {isPhishingInfl ? (
                            <div
                              className="h-3 bg-rose-500 rounded-r-full"
                              style={{ width: `${Math.min(100, Math.abs(feat.weight) * 300)}%` }}
                            />
                          ) : (
                            <div
                              className="h-3 bg-emerald-500 rounded-r-full"
                              style={{ width: `${Math.min(100, Math.abs(feat.weight) * 300)}%` }}
                            />
                          )}
                        </div>
                        <span
                          className={`w-16 font-mono text-right font-bold ${
                            isPhishingInfl ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isPhishingInfl ? '+' : ''}{feat.weight.toFixed(3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-theme-muted italic">
                  No statistical LIME features were extracted for this input length.
                </p>
              )}
            </div>
          )}

          {/* Tab 3: URL Forensics */}
          {activeTab === 'urls' && (
            <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card space-y-4">
              <h4 className="text-sm font-semibold text-theme-heading flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Extracted URLs & Domain Profile</span>
              </h4>

              {result.urls.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-theme-muted bg-theme-inset border-b border-theme">
                      <tr>
                        <th className="py-2.5 px-3">Target URL</th>
                        <th className="py-2.5 px-3">Domain</th>
                        <th className="py-2.5 px-3">IP Host?</th>
                        <th className="py-2.5 px-3">Brand Spoofing?</th>
                        <th className="py-2.5 px-3">Threat Intel Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-theme text-theme-main">
                      {result.urls.map((u, i) => (
                        <tr key={i} className="hover:bg-theme-subtle/50 transition">
                          <td className="py-2.5 px-3 font-mono text-theme-heading max-w-xs truncate">
                            {u.url}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400">{u.domain}</td>
                          <td className="py-2.5 px-3">
                            {u.is_ip_host ? (
                              <span className="text-rose-600 dark:text-rose-400 font-bold">YES (High Risk)</span>
                            ) : (
                              <span className="text-theme-muted">No</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {u.brand_spoofing ? (
                              <span className="text-rose-600 dark:text-rose-400 font-bold">SUSPECTED</span>
                            ) : (
                              <span className="text-theme-muted">None</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-theme-muted text-[11px]">
                            {u.threat_intel_status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-theme-muted">No embedded URLs found in the email body.</p>
              )}
            </div>
          )}

          {/* Tab 4: Authentication Headers */}
          {activeTab === 'headers' && (
            <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card space-y-4">
              <h4 className="text-sm font-semibold text-theme-heading flex items-center space-x-2">
                <Shield className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span>Recorded Email Authentication Headers</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted font-mono text-[11px]">SPF Header Notation</p>
                  <p className="font-semibold text-theme-heading mt-1">
                    {result.authentication_headers.spf_result || 'Unknown'}
                  </p>
                  <p className="text-[10px] text-theme-muted mt-2 truncate">
                    {result.authentication_headers.received_spf}
                  </p>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted font-mono text-[11px]">DKIM Status</p>
                  <p className="font-semibold text-theme-heading mt-1">
                    {result.authentication_headers.dkim_result || 'None'}
                  </p>
                  <p className="text-[10px] text-theme-muted mt-2">
                    Signature header present: {result.authentication_headers.dkim_signature_present ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted font-mono text-[11px]">DMARC Status</p>
                  <p className="font-semibold text-theme-heading mt-1">
                    {result.authentication_headers.dmarc_result || 'None'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <b>Forensic Distinction Note:</b> Authentication results shown above were read
                  strictly from recorded headers in the email message. The system does not claim
                  to have performed independent DNS key cryptographic verification.
                </span>
              </div>
            </div>
          )}

          {/* Tab 5: Attachments */}
          {activeTab === 'attachments' && (
            <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card space-y-4">
              <h4 className="text-sm font-semibold text-theme-heading flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Attachment Metadata Inspection</span>
              </h4>

              {result.attachments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-theme-muted bg-theme-inset border-b border-theme">
                      <tr>
                        <th className="py-2.5 px-3">File Name</th>
                        <th className="py-2.5 px-3">Extension</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">SHA-256 Hash</th>
                        <th className="py-2.5 px-3">Risk Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-theme text-theme-main">
                      {result.attachments.map((att, i) => (
                        <tr key={i} className="hover:bg-theme-subtle/50 transition">
                          <td className="py-2.5 px-3 font-medium text-theme-heading">{att.filename}</td>
                          <td className="py-2.5 px-3 font-mono">{att.extension}</td>
                          <td className="py-2.5 px-3 font-mono">{(att.size_bytes / 1024).toFixed(1)} KB</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-theme-muted truncate max-w-xs">
                            {att.sha256}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                att.risk_level === 'High'
                                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                  : att.risk_level === 'Medium'
                                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {att.risk_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-theme-muted">No attachments found in this email message.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

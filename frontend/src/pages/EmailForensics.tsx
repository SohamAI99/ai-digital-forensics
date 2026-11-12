import React, { useState, useRef } from 'react';
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
  RotateCcw,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { analyzeEmail } from '../services/api';
import type { EmailAnalyzeResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';

const SAMPLE_PHISH = `From: Security Alert <service-update@account-security-alert.xyz>
To: target-user@company.com
Reply-To: credential-collector@suspicious-relay.net
Subject: URGENT: Your banking access has been suspended today
Date: Wed, 28 Oct 2026 09:14:22 +0000
Message-ID: <20261028091422.88219.sec@account-security-alert.xyz>
Received: from mail-relay.phishhost.top (mail-relay.phishhost.top [198.51.100.22]) by mx.targetcompany.com
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
Reply-To: s.jenkins@innovatetech.org
Subject: Project sprint agenda and roadmap notes
Date: Wed, 28 Oct 2026 10:30:00 +0000
Message-ID: <CADe192xY92.sprint-agenda@mail.innovatetech.org>
Received: from mail-relay.google.com (mail-relay.google.com [209.85.220.41]) by mx.company.com
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
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmailAnalyzeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'evidence' | 'lime' | 'urls' | 'headers' | 'attachments'>('evidence');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['eml', 'txt', 'msg'].includes(ext || '')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please drop an .eml, .txt, or .msg file.');
      }
    }
  };

  const handleAnalyze = async () => {
    if (inputMode === 'text' && !emailText.trim()) {
      setError('Please paste email text or headers to analyze.');
      return;
    }
    if (inputMode === 'file' && !selectedFile) {
      setError('Please choose an .eml, .txt, or .msg file to upload.');
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
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              Upload .EML / .TXT / .MSG
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
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 border-2 border-dashed rounded-lg text-center bg-theme-inset transition cursor-pointer group ${
              isDragging
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-theme-subtle hover:border-blue-500/50'
            }`}
          >
            <Upload className="w-10 h-10 text-theme-dim group-hover:text-blue-500 mx-auto mb-3 transition" />
            <p className="text-sm text-theme-heading font-medium">
              Drag and drop an .eml, .txt, or .msg file here, or click to browse
            </p>
            <p className="text-xs text-theme-muted mt-1 mb-3">
              Metadata, headers, and body will be safely parsed without executing attachments.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".eml,.txt,.msg"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {selectedFile ? (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-2 font-medium">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            ) : (
              <span className="text-[11px] text-theme-muted font-mono">Max size: 10 MB</span>
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
              </div>

              {/* Phishing Probability */}
              <div className="p-4 rounded-lg bg-theme-inset border border-theme">
                <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                  <span>ML Phishing Probability</span>
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
              </div>

              {/* Safe Probability */}
              <div className="p-4 rounded-lg bg-theme-inset border border-theme">
                <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                  <span>ML Safe Probability</span>
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
              </div>
            </div>

            {/* Metadata Summary Banner */}
            {result.parsed_metadata && (
              <div className="mt-4 pt-3 border-t border-theme grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-theme-muted">
                <div>
                  <span className="text-theme-heading font-medium">From:</span> {result.parsed_metadata.sender || 'N/A'}
                </div>
                <div>
                  <span className="text-theme-heading font-medium">To:</span> {result.parsed_metadata.recipient || 'N/A'}
                </div>
                <div>
                  <span className="text-theme-heading font-medium">Reply-To:</span>{' '}
                  <span className={result.parsed_metadata.reply_to_mismatch ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                    {result.parsed_metadata.reply_to || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-theme-heading font-medium">Relay Hops:</span> {result.parsed_metadata.received_hops ?? 0}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-theme overflow-x-auto text-xs pb-1">
            {[
              { id: 'evidence', label: 'Forensic Evidence', icon: AlertCircle, count: result.evidence.length },
              { id: 'lime', label: 'LIME Explainability', icon: Zap },
              { id: 'urls', label: 'URL Inspection', icon: LinkIcon, count: result.urls.length },
              { id: 'headers', label: 'Authentication & Headers', icon: Shield },
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
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                      : 'border-transparent text-theme-muted hover:text-theme-heading'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {'count' in tab && tab.count !== undefined && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Forensic Evidence */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.evidence.map((ev, i) => (
                  <div key={i} className="p-4 rounded-xl bg-theme-card border border-theme shadow-theme-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {ev.category}
                      </span>
                      <span
                        className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                          ev.severity === 'high'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : ev.severity === 'medium'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {ev.severity} ({ev.score_impact >= 0 ? `+${ev.score_impact}` : ev.score_impact})
                      </span>
                    </div>
                    <h5 className="text-sm font-semibold text-theme-heading">{ev.title}</h5>
                    <p className="text-xs text-theme-main mt-1 leading-relaxed">{ev.description}</p>
                  </div>
                ))}
              </div>

              {/* Writing Style Signals Summary */}
              <div className="p-4 rounded-xl bg-theme-card border border-theme shadow-theme-card text-xs">
                <h5 className="font-semibold text-theme-heading mb-3 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Psychological & Social Engineering Signals</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-theme-inset rounded-lg border border-theme">
                    <span className="text-theme-muted block text-[10px]">Urgency / Pressure:</span>
                    <span className={`font-semibold ${result.writing_style.urgency_detected ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {result.writing_style.urgency_detected ? 'Detected' : 'None'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-theme-inset rounded-lg border border-theme">
                    <span className="text-theme-muted block text-[10px]">Credential Solicitation:</span>
                    <span className={`font-semibold ${result.writing_style.credential_harvest_detected ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {result.writing_style.credential_harvest_detected ? 'Detected' : 'None'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-theme-inset rounded-lg border border-theme">
                    <span className="text-theme-muted block text-[10px]">Coercive Threat:</span>
                    <span className={`font-semibold ${result.writing_style.threat_detected ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {result.writing_style.threat_detected ? 'Detected' : 'None'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-theme-inset rounded-lg border border-theme">
                    <span className="text-theme-muted block text-[10px]">Punctuation Density:</span>
                    <span className={`font-semibold ${result.writing_style.excessive_punctuation ? 'text-amber-600 dark:text-amber-400' : 'text-theme-heading'}`}>
                      {result.writing_style.excessive_punctuation ? 'High Anomaly' : 'Normal'}
                    </span>
                  </div>
                </div>
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

          {/* Tab 4: Authentication Headers & Live DNS */}
          {activeTab === 'headers' && (
            <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card space-y-4">
              <h4 className="text-sm font-semibold text-theme-heading flex items-center space-x-2">
                <Shield className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span>RFC 822 Email Headers & Authentication Analysis</span>
              </h4>

              {/* Reply-To Mismatch Alert */}
              {result.parsed_metadata?.reply_to_mismatch && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <b>CRITICAL SPOOFING INDICATOR:</b> Reply-To domain does not match From address domain.
                    Replies will be silently redirected to:{' '}
                    <span className="font-mono font-bold underline">{result.parsed_metadata.reply_to}</span>
                  </div>
                </div>
              )}

              {/* Core Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <span className="text-theme-muted text-[10px] block">Sender (From):</span>
                  <span className="font-mono text-theme-heading font-medium truncate block">
                    {result.parsed_metadata?.sender || 'None'}
                  </span>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <span className="text-theme-muted text-[10px] block">Recipient (To):</span>
                  <span className="font-mono text-theme-heading font-medium truncate block">
                    {result.parsed_metadata?.recipient || 'None'}
                  </span>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <span className="text-theme-muted text-[10px] block">Reply-To:</span>
                  <span className="font-mono text-theme-heading font-medium truncate block">
                    {result.parsed_metadata?.reply_to || 'None'}
                  </span>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <span className="text-theme-muted text-[10px] block">Relay Hops (Received):</span>
                  <span className="font-mono text-theme-heading font-semibold">
                    {result.parsed_metadata?.received_hops ?? 0} hops
                  </span>
                </div>
              </div>

              {/* Recorded Authentication Notations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-2">
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted font-mono text-[11px]">Recorded SPF Result</p>
                  <p className="font-semibold text-theme-heading mt-1">
                    {result.authentication_headers.spf_result || 'Unknown'}
                  </p>
                  <p className="text-[10px] text-theme-muted mt-2 truncate">
                    {result.authentication_headers.received_spf}
                  </p>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted font-mono text-[11px]">Recorded DKIM Result</p>
                  <p className="font-semibold text-theme-heading mt-1">
                    {result.authentication_headers.dkim_result || 'None'}
                  </p>
                  <p className="text-[10px] text-theme-muted mt-2">
                    Signature header present: {result.authentication_headers.dkim_signature_present ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted font-mono text-[11px]">Recorded DMARC Result</p>
                  <p className="font-semibold text-theme-heading mt-1">
                    {result.authentication_headers.dmarc_result || 'None'}
                  </p>
                </div>
              </div>

              {/* Live DNS Verification Section */}
              {result.authentication_headers?.live_dns && (
                <div className="p-4 bg-theme-inset rounded-lg border border-theme text-xs space-y-2">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-theme-heading">
                      Live DNS Verification ({result.authentication_headers.live_dns.domain || 'Domain'})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-theme-muted">
                      {result.authentication_headers.live_dns.dns_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-theme-muted text-[10px] block">Public SPF TXT Record:</span>
                      <code className="text-[11px] text-blue-600 dark:text-blue-400 break-all">
                        {result.authentication_headers.live_dns.spf_record || 'No SPF record found in public DNS'}
                      </code>
                    </div>
                    <div>
                      <span className="text-theme-muted text-[10px] block">Public DMARC TXT Record:</span>
                      <code className="text-[11px] text-blue-600 dark:text-blue-400 break-all">
                        {result.authentication_headers.live_dns.dmarc_record || 'No DMARC record found in public DNS'}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <b>Forensic Chain-of-Custody Note:</b> Header records reflect values transmitted within the email file. Live DNS lookups independently query current root nameservers for SPF and DMARC TXT records.
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
                        <th className="py-2.5 px-3">MIME Type</th>
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
                          <td className="py-2.5 px-3 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                            {att.mime_type || 'application/octet-stream'}
                          </td>
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

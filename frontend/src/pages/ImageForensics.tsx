import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Download,
  AlertCircle,
  Camera,
  Eye,
  Waves,
  Info,
  RotateCcw,
  FileImage,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { analyzeImage } from '../services/api';
import type { ImageAnalyzeResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const ImageForensics: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageAnalyzeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'evidence' | 'exif' | 'frequency' | 'gradcam'>('evidence');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Unsupported format. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File exceeds 20 MB limit.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image file first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await analyzeImage(selectedFile);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Image analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto theme-transition">
      {/* Upload Section */}
      <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            <h3 className="text-base font-semibold text-theme-heading">Image Forensic Investigation Workspace</h3>
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-theme-muted hover:text-theme-heading flex items-center space-x-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-center bg-theme-inset cursor-pointer hover:border-purple-500/60 transition group"
          >
            <Upload className="w-10 h-10 text-theme-muted group-hover:text-purple-500 mx-auto mb-3 transition" />
            <p className="text-sm text-theme-heading font-medium">Click to select an image file</p>
            <p className="text-xs text-theme-muted mt-1">Supported: JPG, JPEG, PNG, WEBP &bull; Max 20 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile && (
              <p className="text-xs text-purple-600 dark:text-purple-400 font-mono mt-4">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-theme-inset border border-theme flex items-center justify-center overflow-hidden min-h-[200px]">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-h-[260px] object-contain" />
            ) : (
              <div className="text-center p-6">
                <FileImage className="w-8 h-8 text-theme-dim mx-auto mb-2" />
                <p className="text-xs text-theme-dim">Image preview will appear here</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedFile}
            className="px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs tracking-wide transition shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Deepfake Forensic Pipeline...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                <span>Execute Image Forensic Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Top Result Banner */}
          <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-theme">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-theme-heading">{result.prediction}</h3>
                  <RiskBadge level={result.risk_level} score={result.overall_risk_score} />
                </div>
                <p className="text-xs text-theme-muted font-mono mt-1">
                  Case: {result.analysis_id} &bull; File: {result.filename} &bull; {result.dimensions[0]}×{result.dimensions[1]}px
                </p>
              </div>
              <a
                href={`/api/reports/${result.analysis_id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 flex items-center space-x-2 transition"
              >
                <Download className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span>Export PDF Report</span>
              </a>
            </div>

            {/* Score bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 rounded-lg bg-theme-inset border border-theme">
                <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                  <span>Overall Risk Assessment</span>
                  <span className="font-mono font-medium text-theme-heading">{result.overall_risk_score}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      result.overall_risk_score >= 70 ? 'bg-rose-500' : result.overall_risk_score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${result.overall_risk_score}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-theme-inset border border-theme">
                <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                  <span>Deepfake / Manipulated Score</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-medium">
                    {(result.deepfake_probability * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${result.deepfake_probability * 100}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-theme-inset border border-theme">
                <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                  <span>Pristine / Authentic Score</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    {(result.pristine_probability * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${result.pristine_probability * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visual Evidence: Images Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.original_image_url && (
              <div className="rounded-xl bg-theme-card border border-theme overflow-hidden shadow-theme-card">
                <div className="px-3 py-2 border-b border-theme text-xs text-theme-muted flex items-center space-x-1.5 bg-theme-inset/50 font-medium">
                  <Eye className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span>Original Image</span>
                </div>
                <div className="p-2 flex items-center justify-center bg-theme-inset">
                  <img src={result.original_image_url} alt="Original" className="max-h-48 object-contain rounded" />
                </div>
              </div>
            )}
            {result.face_crop_url && (
              <div className="rounded-xl bg-theme-card border border-theme overflow-hidden shadow-theme-card">
                <div className="px-3 py-2 border-b border-theme text-xs text-theme-muted flex items-center space-x-1.5 bg-theme-inset/50 font-medium">
                  <Camera className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                  <span>{result.face_detected ? 'Face Crop' : 'Center Crop'}</span>
                </div>
                <div className="p-2 flex items-center justify-center bg-theme-inset">
                  <img src={result.face_crop_url} alt="Crop" className="max-h-48 object-contain rounded" />
                </div>
              </div>
            )}
            {result.frequency.fft_spectrum_url && (
              <div className="rounded-xl bg-theme-card border border-theme overflow-hidden shadow-theme-card">
                <div className="px-3 py-2 border-b border-theme text-xs text-theme-muted flex items-center space-x-1.5 bg-theme-inset/50 font-medium">
                  <Waves className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                  <span>2D FFT Spectrum</span>
                </div>
                <div className="p-2 flex items-center justify-center bg-theme-inset">
                  <img src={result.frequency.fft_spectrum_url} alt="FFT" className="max-h-48 object-contain rounded" />
                </div>
              </div>
            )}
            {result.gradcam_url && (
              <div className="rounded-xl bg-theme-card border border-purple-300 dark:border-purple-900/40 overflow-hidden shadow-theme-card">
                <div className="px-3 py-2 border-b border-purple-200 dark:border-purple-900/40 text-xs text-purple-600 dark:text-purple-400 flex items-center space-x-1.5 bg-purple-500/5 font-medium">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Grad-CAM Heatmap</span>
                </div>
                <div className="p-2 flex items-center justify-center bg-theme-inset">
                  <img src={result.gradcam_url} alt="Grad-CAM" className="max-h-48 object-contain rounded" />
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-2 border-b border-theme overflow-x-auto text-xs pb-1">
            {[
              { id: 'evidence', label: 'Forensic Evidence', icon: AlertCircle, count: result.evidence.length },
              { id: 'exif', label: 'EXIF Metadata', icon: Camera },
              { id: 'frequency', label: 'Frequency Analysis', icon: Waves },
              { id: 'gradcam', label: 'Grad-CAM Explainability', icon: Cpu },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2.5 font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/10'
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

          {/* Evidence Tab */}
          {activeTab === 'evidence' && (
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
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : ev.severity === 'medium'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : ev.severity === 'info'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {ev.severity}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-theme-heading mt-1">{ev.title}</h4>
                  <p className="text-xs text-theme-main mt-1 leading-relaxed">{ev.description}</p>
                  <div className="mt-3 pt-2 border-t border-theme flex items-center justify-between text-[11px] text-theme-muted">
                    <span>Score Impact:</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                      {ev.score_impact > 0 ? '+' : ''}
                      {ev.score_impact} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EXIF Tab */}
          {activeTab === 'exif' && (
            <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card space-y-4">
              <h4 className="text-sm font-semibold text-theme-heading flex items-center space-x-2">
                <Camera className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span>EXIF Metadata Inspection</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted text-[11px]">Camera Make</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{result.exif.make || 'N/A'}</p>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted text-[11px]">Camera Model</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{result.exif.model || 'N/A'}</p>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted text-[11px]">Capture Time</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{result.exif.datetime_original || 'N/A'}</p>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted text-[11px]">Software Tag</p>
                  <p className="font-semibold text-theme-heading mt-0.5">{result.exif.software || 'None'}</p>
                </div>
              </div>
              {result.exif.anomaly_flags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-theme-muted font-semibold">Anomaly Observations:</p>
                  {result.exif.anomaly_flags.map((flag, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded text-xs text-amber-700 dark:text-amber-300 flex items-start space-x-2"
                    >
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <span>
                  Absence of EXIF metadata is common on social media uploads, screenshots, and AI-generated images. It does not alone constitute proof of manipulation.
                </span>
              </div>
            </div>
          )}

          {/* Frequency Tab */}
          {activeTab === 'frequency' && (
            <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card space-y-5">
              <h4 className="text-sm font-semibold text-theme-heading flex items-center space-x-2">
                <Waves className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                <span>2D FFT &amp; DCT Frequency Domain Analysis</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.frequency.fft_spectrum_url && (
                  <div className="rounded-lg bg-theme-inset border border-theme overflow-hidden">
                    <div className="px-3 py-2 border-b border-theme text-xs text-theme-heading font-semibold">
                      2D FFT Log-Magnitude Spectrum
                    </div>
                    <div className="p-3 flex justify-center bg-black/5 dark:bg-black/30">
                      <img src={result.frequency.fft_spectrum_url} alt="FFT" className="max-h-56 rounded" />
                    </div>
                  </div>
                )}
                {result.frequency.dct_spectrum_url && (
                  <div className="rounded-lg bg-theme-inset border border-theme overflow-hidden">
                    <div className="px-3 py-2 border-b border-theme text-xs text-theme-heading font-semibold">
                      2D DCT Coefficient Energy
                    </div>
                    <div className="p-3 flex justify-center bg-black/5 dark:bg-black/30">
                      <img src={result.frequency.dct_spectrum_url} alt="DCT" className="max-h-56 rounded" />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted text-[11px]">High-Freq Energy Ratio</p>
                  <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                    {(result.frequency.high_freq_ratio * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted text-[11px]">Spectral Centroid</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {result.frequency.spectral_centroid}
                  </p>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted text-[11px]">Azimuthal Deviation</p>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {result.frequency.azimuthal_deviation}
                  </p>
                </div>
              </div>
              <p className="text-xs text-theme-main leading-relaxed">{result.frequency.analysis_summary}</p>
            </div>
          )}

          {/* Grad-CAM Tab */}
          {activeTab === 'gradcam' && (
            <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card space-y-5">
              <h4 className="text-sm font-semibold text-theme-heading flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span>Grad-CAM Visual Attribution Heatmap</span>
              </h4>
              {result.gradcam_url ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="rounded-lg border border-purple-200 dark:border-purple-900/40 overflow-hidden bg-theme-inset p-3">
                    <img src={result.gradcam_url} alt="Grad-CAM" className="max-h-80 rounded" />
                  </div>
                  <div className="flex items-center space-x-4 text-[11px]">
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded bg-blue-600" />
                      <span className="text-theme-muted">Low Activation</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded bg-green-500" />
                      <span className="text-theme-muted">Moderate</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded bg-yellow-400" />
                      <span className="text-theme-muted">High</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded bg-red-500" />
                      <span className="text-theme-muted">Maximum Activation</span>
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-theme-muted italic">Grad-CAM heatmap could not be generated for this image.</p>
              )}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                <span>
                  Grad-CAM highlights convolutional feature regions that most influenced the neural classifier's prediction. Warmer (red) zones indicate higher model activation, not proven spatial boundaries of synthetic editing.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

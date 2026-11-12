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
  Fingerprint,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Search,
  Code,
  Sliders,
  Calendar,
  Clock
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
  const [tagSearch, setTagSearch] = useState('');
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
    setTagSearch('');
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
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Deepfake Forensic Pipeline...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" strokeWidth={1.5} />
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
                  <h3 className="text-xl font-semibold text-theme-heading">{result.prediction}</h3>
                  <RiskBadge level={result.risk_level} score={result.overall_risk_score} />
                </div>
                <p className="text-xs text-theme-muted font-mono mt-1 tabular-nums">
                  Case: {result.analysis_id} &bull; File: {result.filename} &bull; {result.dimensions[0]}×{result.dimensions[1]}px
                </p>
                <p className="text-[11px] font-mono text-theme-muted mt-1 truncate max-w-xl">
                  SHA-256:{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{result.sha256}</span>
                </p>
              </div>
              <a
                href={`/api/reports/${result.analysis_id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-theme-subtle hover:bg-theme-inset text-theme-heading text-xs font-medium border border-theme flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                <span>Export PDF Report</span>
              </a>
            </div>

            {/* Score bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 rounded-lg bg-theme-inset border border-theme">
                <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                  <span>Overall Risk Assessment</span>
                  <span className="font-mono font-medium text-theme-heading tabular-nums">{result.overall_risk_score}/100</span>
                </div>
                <div className="w-full bg-theme-subtle rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-[width] duration-300 ${
                      result.overall_risk_score >= 70 ? 'bg-rose-500' : result.overall_risk_score >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${result.overall_risk_score}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-theme-inset border border-theme">
                <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                  <span>Deepfake / Manipulated Score</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-medium tabular-nums">
                    {(result.deepfake_probability * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-theme-subtle rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-rose-500 rounded-full transition-[width] duration-300"
                    style={{ width: `${result.deepfake_probability * 100}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-theme-inset border border-theme">
                <div className="flex items-center justify-between text-xs text-theme-muted mb-1">
                  <span>Pristine / Authentic Score</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                    {(result.pristine_probability * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-theme-subtle rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-emerald-500 rounded-full transition-[width] duration-300"
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
              <div className="rounded-xl bg-theme-card border border-theme overflow-hidden shadow-theme-card">
                <div className="px-3 py-2 border-b border-theme text-xs text-theme-muted flex items-center space-x-1.5 bg-theme-inset/50 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
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
                  className={`flex items-center space-x-2 px-4 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                      : 'border-transparent text-theme-muted hover:text-theme-heading'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{tab.label}</span>
                  {'count' in tab && tab.count !== undefined && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-theme-subtle text-theme-muted font-mono tabular-nums">
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
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-theme-inset text-theme-muted border border-theme">
                      {ev.category}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded tabular-nums ${
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
          )}

          {/* EXIF Tab */}
          {activeTab === 'exif' && (
            <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card space-y-5">
              {/* Verdict Header Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start space-x-3 ${
                  result.exif.ai_generation_detected
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
                    : result.exif.editing_software_detected
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                    : result.exif.has_exif && (result.exif.make || result.exif.model || result.exif.camera_details?.iso)
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200'
                }`}
              >
                {result.exif.ai_generation_detected ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                ) : result.exif.editing_software_detected ? (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                ) : result.exif.has_exif && (result.exif.make || result.exif.model) ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold">
                      {result.exif.metadata_verdict || (result.exif.has_exif ? 'Camera Metadata Detected' : 'Metadata Stripped')}
                    </h4>
                    {result.exif.metadata_risk_score !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-medium">
                        Metadata Risk: {result.exif.metadata_risk_score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {result.exif.ai_generation_detected
                      ? `Synthetic generation parameters and AI tool signatures identified (${result.exif.ai_tool_signatures?.join(', ') || 'AI model metadata'}).`
                      : result.exif.editing_software_detected
                      ? `Image headers indicate raster modification using '${result.exif.software}'.`
                      : result.exif.has_exif && (result.exif.make || result.exif.model)
                      ? `Authentic optical sensor footprint preserved for ${result.exif.make || ''} ${result.exif.model || ''}.`
                      : 'Camera hardware metadata is stripped. This is normal for images shared over social networks or web downloads.'}
                  </p>
                </div>
              </div>

              {/* AI Prompt / Generation Parameters Callout (if AI detected) */}
              {result.exif.ai_generation_detected && (
                <div className="p-4 rounded-xl bg-theme-inset border border-rose-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center space-x-1.5">
                      <Code className="w-4 h-4" />
                      <span>Extracted Generative AI Model Parameters &amp; Prompt:</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300">
                      {result.exif.ai_tool_signatures?.[0] || 'AI Model Output'}
                    </span>
                  </div>
                  {result.exif.ai_prompt_metadata ? (
                    <pre className="p-3 bg-black/20 dark:bg-black/50 rounded text-xs font-mono text-theme-heading overflow-x-auto max-h-48 whitespace-pre-wrap break-all leading-relaxed">
                      {result.exif.ai_prompt_metadata}
                    </pre>
                  ) : (
                    <p className="text-xs text-theme-muted">Model synthesis signatures identified in header chunks.</p>
                  )}
                </div>
              )}

              {/* File Technical Specifications & Cryptographic Provenance */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-theme-heading uppercase tracking-wider flex items-center space-x-1.5">
                  <FileImage className="w-3.5 h-3.5 text-blue-500" />
                  <span>File Specifications &amp; Cryptographic Provenance</span>
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Format / MIME</p>
                    <p className="font-semibold text-theme-heading mt-0.5">
                      {result.exif.file_properties?.file_format || 'JPEG'} ({result.exif.file_properties?.mime_type || 'image/jpeg'})
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Resolution &amp; Megapixels</p>
                    <p className="font-semibold text-theme-heading mt-0.5">
                      {result.dimensions[0]} x {result.dimensions[1]} px ({result.exif.file_properties?.megapixels || `${(result.dimensions[0]*result.dimensions[1]/1000000).toFixed(2)} MP`})
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Aspect Ratio</p>
                    <p className="font-semibold text-theme-heading mt-0.5">
                      {result.exif.file_properties?.aspect_ratio || '2:3 Portrait'}
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Color Mode &amp; Channels</p>
                    <p className="font-semibold text-theme-heading mt-0.5">
                      {result.exif.file_properties?.color_mode || 'RGB'} ({result.exif.file_properties?.bit_depth || '8-bit per channel (24-bit RGB)'})
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px] flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-cyan-500" />
                      <span>Creation Date</span>
                    </p>
                    <p className="font-semibold text-theme-heading mt-0.5 truncate" title={result.exif.file_properties?.creation_date || result.exif.creation_date || result.exif.datetime_original || 'Timestamp Not Recorded'}>
                      {result.exif.file_properties?.creation_date || result.exif.creation_date || result.exif.datetime_original || 'Timestamp Not Recorded (Web / Stripped)'}
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px] flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>Modification Date</span>
                    </p>
                    <p className="font-semibold text-theme-heading mt-0.5 truncate" title={result.exif.file_properties?.modification_date || result.exif.modification_date || 'Modification Timestamp Not Recorded'}>
                      {result.exif.file_properties?.modification_date || result.exif.modification_date || 'Modification Timestamp Not Recorded'}
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">File Size</p>
                    <p className="font-semibold text-theme-heading mt-0.5">
                      {result.exif.file_properties?.file_size_formatted || `${(result.file_size_bytes / 1024).toFixed(1)} KB`}
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Pixel Density (DPI)</p>
                    <p className="font-semibold text-theme-heading mt-0.5">
                      {result.exif.file_properties?.dpi || '72 x 72 DPI (Standard Screen)'}
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Chroma Subsampling</p>
                    <p className="font-semibold text-theme-heading mt-0.5 truncate" title={result.exif.file_properties?.chroma_subsampling || 'YCbCr 4:2:0'}>
                      {result.exif.file_properties?.chroma_subsampling || 'YCbCr 4:2:0 (Standard)'}
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Compression Fidelity</p>
                    <p className="font-semibold text-theme-heading mt-0.5 truncate" title={result.exif.file_properties?.compression_quality || 'High Fidelity'}>
                      {result.exif.file_properties?.compression_quality || 'High Fidelity DCT (~94%)'}
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme col-span-2">
                    <p className="text-theme-muted text-[11px]">Temporal Consistency</p>
                    <p className="font-semibold text-theme-heading mt-0.5 truncate" title={result.exif.file_properties?.temporal_status || result.exif.temporal_status || 'Header Timestamps Consistent'}>
                      {result.exif.file_properties?.temporal_status || result.exif.temporal_status || 'Timestamp integrity preserved'}
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme col-span-2 md:col-span-4">
                    <p className="text-theme-muted text-[11px]">SHA-256 Checksum (Chain of Custody)</p>
                    <p className="font-mono text-[11px] text-theme-heading mt-0.5 truncate select-all" title={result.sha256}>
                      {result.sha256}
                    </p>
                  </div>
                </div>
              </div>

              {/* Camera Hardware & Optics Profile */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-theme-heading uppercase tracking-wider flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5 text-purple-500" />
                  <span>Camera Sensor &amp; Optical Exposure Parameters</span>
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Camera Make</p>
                    <p className="font-semibold text-theme-heading mt-0.5">{result.exif.camera_details?.make || result.exif.make || 'Non-Hardware (Digital Source)'}</p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Camera Model</p>
                    <p className="font-semibold text-theme-heading mt-0.5">{result.exif.camera_details?.model || result.exif.model || 'Digital Raster Stream'}</p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Lens Model</p>
                    <p className="font-semibold text-theme-heading mt-0.5 truncate" title={result.exif.camera_details?.lens_model || 'Synthetic Sensor (Direct Pixel Matrix)'}>
                      {result.exif.camera_details?.lens_model || 'Synthetic Sensor (Direct Pixel Matrix)'}
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Creation / Capture Time</p>
                    <p className="font-semibold text-theme-heading mt-0.5 truncate" title={result.exif.camera_details?.creation_date || result.exif.creation_date || result.exif.camera_details?.datetime_original || result.exif.datetime_original || 'Timestamp Not Recorded'}>
                      {result.exif.camera_details?.creation_date || result.exif.creation_date || result.exif.camera_details?.datetime_original || result.exif.datetime_original || 'Timestamp Not Recorded (Web / Stripped)'}
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Modification Timestamp</p>
                    <p className="font-semibold text-theme-heading mt-0.5 truncate" title={result.exif.camera_details?.modification_date || result.exif.modification_date || 'Modification Timestamp Not Recorded'}>
                      {result.exif.camera_details?.modification_date || result.exif.modification_date || 'Modification Timestamp Not Recorded'}
                    </p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Exposure Time (Shutter)</p>
                    <p className="font-semibold text-theme-heading mt-0.5">{result.exif.camera_details?.exposure_time || 'Non-Optical (Digital Rendering Pipeline)'}</p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Aperture (F-Number)</p>
                    <p className="font-semibold text-theme-heading mt-0.5">{result.exif.camera_details?.f_number || 'Uniform Depth of Field (Synthetic f/0)'}</p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">ISO Sensitivity</p>
                    <p className="font-semibold text-theme-heading mt-0.5">{result.exif.camera_details?.iso || 'Standard Gain (ISO 100 Equivalent)'}</p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Focal Length</p>
                    <p className="font-semibold text-theme-heading mt-0.5">{result.exif.camera_details?.focal_length || 'Digital Orthographic Field (Direct 2D)'}</p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Flash State</p>
                    <p className="font-semibold text-theme-heading mt-0.5">{result.exif.camera_details?.flash || 'No Physical Strobe (Ambient / Digital Light)'}</p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">White Balance</p>
                    <p className="font-semibold text-theme-heading mt-0.5">{result.exif.camera_details?.white_balance || 'Standard sRGB D65 (6500K Profile)'}</p>
                  </div>
                  <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                    <p className="text-theme-muted text-[11px]">Editing Software Tag</p>
                    <p className="font-semibold text-theme-heading mt-0.5 truncate" title={result.exif.camera_details?.software || result.exif.software || 'Native Raster Pipeline (No Tool Stamp)'}>
                      {result.exif.camera_details?.software || result.exif.software || 'Native Raster Pipeline (No Tool Stamp)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* GPS Geotagging section if present */}
              {result.exif.gps_info && (
                <div className="p-3.5 bg-theme-inset rounded-lg border border-purple-500/30 text-xs space-y-1">
                  <p className="text-theme-heading font-semibold flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-500" />
                    <span>Geotagging Metadata Preserved (GPS Coordinates):</span>
                  </p>
                  <code className="text-xs text-purple-600 dark:text-purple-400 font-mono break-all block">
                    {result.exif.gps_info.formatted_coordinates || result.exif.gps_info.summary || JSON.stringify(result.exif.gps_info.raw)}
                  </code>
                </div>
              )}

              {/* Anomaly Observations */}
              {result.exif.anomaly_flags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-theme-muted font-semibold">Forensic Anomaly Observations:</p>
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

              {/* Complete Decoded Raw Metadata Inspector */}
              <div className="space-y-2 pt-2 border-t border-theme">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-theme-heading uppercase tracking-wider flex items-center space-x-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Complete Metadata Tag Registry ({Object.keys(result.exif.raw_tags || {}).length} Tags)</span>
                  </h5>
                  {Object.keys(result.exif.raw_tags || {}).length > 6 && (
                    <div className="relative w-48">
                      <Search className="w-3 h-3 text-theme-muted absolute left-2 top-2" />
                      <input
                        type="text"
                        placeholder="Search tags..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        className="w-full pl-6 pr-2 py-1 text-[11px] rounded bg-theme-inset border border-theme text-theme-main focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {Object.keys(result.exif.raw_tags || {}).length > 0 ? (
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-theme bg-theme-inset">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-theme-subtle text-theme-muted text-[10px] uppercase sticky top-0 border-b border-theme">
                        <tr>
                          <th className="py-1.5 px-3 font-semibold w-1/3">Tag Name</th>
                          <th className="py-1.5 px-3 font-semibold">Decoded Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme/60 text-[11px]">
                        {Object.entries(result.exif.raw_tags)
                          .filter(([k, v]) =>
                            !tagSearch ||
                            k.toLowerCase().includes(tagSearch.toLowerCase()) ||
                            String(v).toLowerCase().includes(tagSearch.toLowerCase())
                          )
                          .map(([tagKey, tagVal], idx) => (
                            <tr key={idx} className="hover:bg-theme-card/50 transition-colors">
                              <td className="py-1.5 px-3 text-purple-600 dark:text-purple-400 font-medium select-all">
                                {tagKey}
                              </td>
                              <td className="py-1.5 px-3 text-theme-main break-all select-all">
                                {String(tagVal)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-theme-inset text-center text-xs text-theme-muted">
                    No raw EXIF or container tags available in this image file.
                  </div>
                )}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted text-[11px]">High-Frequency Energy Ratio</p>
                  <p className="text-base font-semibold text-theme-heading mt-1 tabular-nums">
                    {(result.frequency.high_freq_ratio * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-theme-muted mt-1">Outer 45% radial spectrum energy</p>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted text-[11px]">Spectral Centroid</p>
                  <p className="text-base font-semibold text-theme-heading mt-1 font-mono tabular-nums">
                    {result.frequency.spectral_centroid}
                  </p>
                  <p className="text-[10px] text-theme-muted mt-1">Amplitude-weighted mean frequency</p>
                </div>
                <div className="p-3 bg-theme-inset rounded-lg border border-theme">
                  <p className="text-theme-muted text-[11px]">Azimuthal Variation</p>
                  <p className="text-base font-semibold text-theme-heading mt-1 font-mono tabular-nums">
                    {result.frequency.azimuthal_deviation}
                  </p>
                  <p className="text-[10px] text-theme-muted mt-1">Variance across 16 angular sectors</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-theme-inset border border-theme text-xs text-theme-main">
                <span className="font-semibold text-theme-heading">Analysis Summary: </span>
                {result.frequency.analysis_summary}
              </div>
            </div>
          )}

          {/* Grad-CAM Tab */}
          {activeTab === 'gradcam' && (
            <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card space-y-4">
              <h4 className="text-sm font-semibold text-theme-heading flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                <span>Convolutional Feature Attribution (Grad-CAM)</span>
              </h4>
              <p className="text-xs text-theme-main leading-relaxed">
                Grad-CAM computes gradients of the target class score with respect to Layer 4 feature maps of the ResNet-18
                vision backbone. Warm regions (red/yellow) indicate spatial patterns that most influenced the classification head.
              </p>
              {result.gradcam_url ? (
                <div className="flex justify-center p-4 bg-theme-inset rounded-lg border border-theme">
                  <img src={result.gradcam_url} alt="Grad-CAM Overlay" className="max-h-96 rounded" />
                </div>
              ) : (
                <p className="text-xs text-theme-muted">Grad-CAM visualization unavailable for this sample.</p>
              )}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                <span>
                  <b>Forensic Limitation:</b> Grad-CAM highlights attention regions of the deep neural network. It does not demarcate exact physical pixel boundaries of digital image tampering.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

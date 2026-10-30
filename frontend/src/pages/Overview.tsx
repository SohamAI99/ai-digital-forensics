import React, { useEffect, useState } from 'react';
import {
  Mail,
  Image as ImageIcon,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Cpu,
  CheckCircle2,
  Clock
} from 'lucide-react';
import type { DashboardSummary } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { fetchDashboardSummary, fetchEvaluationMetrics } from '../services/api';

interface OverviewProps {
  onNavigate: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [evalMetrics, setEvalMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumData, evalData] = await Promise.all([
          fetchDashboardSummary(),
          fetchEvaluationMetrics().catch(() => null),
        ]);
        setSummary(sumData);
        setEvalMetrics(evalData);
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-theme-muted">Loading forensic overview dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Email Analyses */}
        <div className="p-5 rounded-xl bg-theme-card border border-theme flex items-center justify-between shadow-theme-card theme-transition">
          <div>
            <p className="text-xs font-medium text-theme-muted">Total Email Analyses</p>
            <h3 className="text-2xl font-bold text-theme-heading mt-1">
              {summary ? summary.email_total : 0}
            </h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 flex items-center space-x-1">
              <span>TF-IDF + Logistic Reg</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        {/* High Risk Emails */}
        <div className="p-5 rounded-xl bg-theme-card border border-theme flex items-center justify-between shadow-theme-card theme-transition">
          <div>
            <p className="text-xs font-medium text-theme-muted">High-Risk Phishing</p>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {summary ? summary.high_risk_emails : 0}
            </h3>
            <p className="text-[11px] text-theme-muted mt-1">Confirmed threat patterns</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Image Analyses */}
        <div className="p-5 rounded-xl bg-theme-card border border-theme flex items-center justify-between shadow-theme-card theme-transition">
          <div>
            <p className="text-xs font-medium text-theme-muted">Total Image Analyses</p>
            <h3 className="text-2xl font-bold text-theme-heading mt-1">
              {summary ? summary.image_total : 0}
            </h3>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">EXIF + 2D FFT/DCT</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <ImageIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Potential Deepfakes */}
        <div className="p-5 rounded-xl bg-theme-card border border-theme flex items-center justify-between shadow-theme-card theme-transition">
          <div>
            <p className="text-xs font-medium text-theme-muted">Potential Deepfakes</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {summary ? summary.potential_deepfakes : 0}
            </h3>
            <p className="text-[11px] text-theme-muted mt-1">Synthetic & edited images</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Module Launch Cards (Independent Modules) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Module Card */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-white to-blue-50/60 dark:from-[#0f172a] dark:to-[#131d33] border border-blue-200 dark:border-blue-900/40 relative overflow-hidden group shadow-theme-card theme-transition">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-theme-heading">Email Threat Forensics</h4>
                <p className="text-xs text-theme-muted">Module 1 &bull; Text & Infrastructure</p>
              </div>
            </div>
            <span className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20 font-mono font-medium">
              TF-IDF Pipeline
            </span>
          </div>

          <p className="text-xs text-theme-main leading-relaxed mb-5">
            Detects spear-phishing, credential harvesting, and deceptive lures using the validated
            scikit-learn pipeline, lexical URL profiling, header authentication analysis, and LIME
            feature attributions.
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-theme">
            <div className="flex items-center space-x-2 text-xs text-theme-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Joblib Model: 50,000 N-Grams</span>
            </div>
            <button
              onClick={() => onNavigate('email')}
              className="flex items-center space-x-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group-hover:translate-x-1 transition cursor-pointer"
            >
              <span>Launch Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Image Module Card */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-white to-purple-50/60 dark:from-[#0f172a] dark:to-[#1d1633] border border-purple-200 dark:border-purple-900/40 relative overflow-hidden group shadow-theme-card theme-transition">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-theme-heading">Deepfake Image Forensics</h4>
                <p className="text-xs text-theme-muted">Module 2 &bull; Vision & Frequency</p>
              </div>
            </div>
            <span className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-full border border-purple-500/20 font-mono font-medium">
              PyTorch Core
            </span>
          </div>

          <p className="text-xs text-theme-main leading-relaxed mb-5">
            Inspects static images for generative or synthetic manipulation through EXIF metadata
            integrity, 2D Fast Fourier Transform (FFT), Discrete Cosine Transform (DCT), and
            Grad-CAM convolutional attribution heatmaps.
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-theme">
            <div className="flex items-center space-x-2 text-xs text-theme-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Face Detector + Grad-CAM</span>
            </div>
            <button
              onClick={() => onNavigate('image')}
              className="flex items-center space-x-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 group-hover:translate-x-1 transition cursor-pointer"
            >
              <span>Launch Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Model Verification Benchmark Card */}
      {evalMetrics && evalMetrics.metrics && (
        <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card theme-transition">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-theme-heading">
                Saved Email Model Evaluation Benchmarks (Ground Truth)
              </h4>
            </div>
            <span className="text-xs text-theme-muted font-mono">
              Dataset: {evalMetrics.dataset.source_file} ({evalMetrics.dataset.deduplicated_records} deduplicated samples)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-theme-inset rounded-lg border border-theme">
              <p className="text-[11px] text-theme-muted">Accuracy</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {(evalMetrics.metrics.accuracy * 100).toFixed(2)}%
              </p>
            </div>
            <div className="p-3 bg-theme-inset rounded-lg border border-theme">
              <p className="text-[11px] text-theme-muted">Precision</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {(evalMetrics.metrics.precision * 100).toFixed(2)}%
              </p>
            </div>
            <div className="p-3 bg-theme-inset rounded-lg border border-theme">
              <p className="text-[11px] text-theme-muted">Recall</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {(evalMetrics.metrics.recall * 100).toFixed(2)}%
              </p>
            </div>
            <div className="p-3 bg-theme-inset rounded-lg border border-theme">
              <p className="text-[11px] text-theme-muted">F1-Score</p>
              <p className="text-lg font-bold text-violet-600 dark:text-violet-400 mt-0.5">
                {(evalMetrics.metrics.f1_score * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="p-3 bg-theme-inset rounded-lg border border-theme text-xs text-theme-muted flex flex-wrap justify-between items-center gap-2">
            <span>
              <b className="text-theme-heading">Test Partition:</b> {evalMetrics.dataset.test_samples} unseen emails &bull; 
              <b className="text-theme-heading"> True Positives:</b> {evalMetrics.metrics.confusion_matrix.true_positive_phishing} &bull; 
              <b className="text-theme-heading"> True Negatives:</b> {evalMetrics.metrics.confusion_matrix.true_negative_safe} &bull; 
              <b className="text-theme-heading"> False Positives:</b> {evalMetrics.metrics.confusion_matrix.false_positive_phishing} &bull; 
              <b className="text-theme-heading"> False Negatives:</b> {evalMetrics.metrics.confusion_matrix.false_negative_safe}
            </span>
            <span className="text-[11px] text-theme-muted font-mono">
              Evaluated via stratified 80/20 split
            </span>
          </div>
        </div>
      )}

      {/* Recent Activity Table */}
      <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card theme-transition">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-theme-heading flex items-center space-x-2">
            <Clock className="w-4 h-4 text-theme-muted" />
            <span>Recent Forensic Investigations</span>
          </h4>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer"
          >
            View Complete History &rarr;
          </button>
        </div>

        {summary && summary.recent_activity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-theme-muted bg-theme-inset border-b border-theme">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Module</th>
                  <th className="py-2.5 px-3">Target Subject / File</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y border-theme text-theme-main">
                {summary.recent_activity.map((item) => (
                  <tr key={item.id} className="hover:bg-theme-subtle/50 transition">
                    <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400 font-semibold">{item.id}</td>
                    <td className="py-2.5 px-3">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] bg-theme-inset border border-theme">
                        {item.analysis_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-theme-heading max-w-[200px] truncate">
                      {item.identifier}
                    </td>
                    <td className="py-2.5 px-3">{item.classification}</td>
                    <td className="py-2.5 px-3">
                      <RiskBadge level={item.risk_level} score={item.overall_score} />
                    </td>
                    <td className="py-2.5 px-3 text-theme-muted font-mono text-[11px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-theme-inset rounded-lg border border-dashed border-theme">
            <p className="text-sm text-theme-muted">No forensic investigations recorded yet.</p>
            <p className="text-xs text-theme-dim mt-1">
              Select either the Email Forensics or Image Forensics module to start an investigation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

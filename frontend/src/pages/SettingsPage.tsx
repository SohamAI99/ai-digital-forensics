import React from 'react';
import { Info, BookOpen, ShieldCheck, AlertTriangle, CheckCircle2, Database, Key } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl theme-transition">
      {/* About */}
      <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-theme-heading">About This Framework</h3>
        </div>
        <div className="text-xs text-theme-main space-y-2 leading-relaxed">
          <p>
            <b className="text-theme-heading">Project Title:</b>{' '}
            An Integrated AI and Digital Forensic Framework for Email Threat Detection and Deepfake Image Forensics
          </p>
          <p>
            <b className="text-theme-heading">Purpose:</b>{' '}
            A B.Tech Final-Year Computer Science capstone project combining machine-learning-powered email phishing detection with
            computer-vision-based deepfake image forensics, unified within a professional digital investigation dashboard.
          </p>
          <p>
            <b className="text-theme-heading">Architecture:</b>{' '}
            FastAPI Python backend + React TypeScript frontend. Email and image modules operate independently—they share
            infrastructure but never combine email content with image pixels.
          </p>
        </div>
      </div>

      {/* Email Module Methodology */}
      <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-theme-heading">Email Forensics Methodology</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-theme-inset rounded-lg border border-theme space-y-2">
            <h5 className="text-sm font-semibold text-theme-heading">ML Text Classification</h5>
            <ul className="text-theme-main space-y-1 list-disc list-inside">
              <li>TF-IDF vectorizer (max 50,000 unigram+bigram features, sublinear TF)</li>
              <li>Logistic Regression classifier (class-weight balanced)</li>
              <li>Trained on Kaggle Phishing_Email.csv (17,523 deduplicated samples)</li>
              <li>Evaluated: 98.20% accuracy, 97.62% F1 (80/20 stratified split)</li>
            </ul>
          </div>
          <div className="p-4 bg-theme-inset rounded-lg border border-theme space-y-2">
            <h5 className="text-sm font-semibold text-theme-heading">Multi-Factor Risk Engine</h5>
            <ul className="text-theme-main space-y-1 list-disc list-inside">
              <li>ML model phishing probability (up to 50 pts)</li>
              <li>Writing style: urgency, credentials, threats (up to 25 pts)</li>
              <li>URL lexical: IP hosts, brand spoofing, suspicious TLDs (up to 20 pts)</li>
              <li>Attachment risk: dangerous extensions (up to 15 pts)</li>
              <li>LIME text attribution for explainability</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Image Module Methodology */}
      <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          <h3 className="text-base font-semibold text-theme-heading">Image Forensics Methodology</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-theme-inset rounded-lg border border-theme space-y-2">
            <h5 className="text-sm font-semibold text-theme-heading">Vision Neural Network</h5>
            <ul className="text-theme-main space-y-1 list-disc list-inside">
              <li>ResNet-18 backbone with forensic classification head</li>
              <li>Binary output: Authentic / Potential Deepfake</li>
              <li>Grad-CAM heatmaps from Layer 4 activations</li>
              <li>ImageNet-pretrained baseline (not yet fine-tuned on deepfake data)</li>
            </ul>
          </div>
          <div className="p-4 bg-theme-inset rounded-lg border border-theme space-y-2">
            <h5 className="text-sm font-semibold text-theme-heading">Frequency &amp; Metadata Analysis</h5>
            <ul className="text-theme-main space-y-1 list-disc list-inside">
              <li>2D Fast Fourier Transform (FFT) log-magnitude spectrum</li>
              <li>2D Discrete Cosine Transform (DCT) energy distribution</li>
              <li>High-frequency ratio, spectral centroid, azimuthal deviation</li>
              <li>Pillow EXIF extraction with anomaly flagging</li>
              <li>OpenCV face detection (Haar cascade) with margin cropping</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Risk Scoring Thresholds */}
      <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card">
        <div className="flex items-center space-x-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <h3 className="text-base font-semibold text-theme-heading">Risk Scoring Thresholds</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">Low Risk</p>
            <p className="text-theme-main mt-1">Score: 0 – 29</p>
          </div>
          <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-lg text-center">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
            <p className="text-amber-700 dark:text-amber-400 font-bold text-sm">Medium Risk</p>
            <p className="text-theme-main mt-1">Score: 30 – 69</p>
          </div>
          <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-lg text-center">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
            <p className="text-rose-700 dark:text-rose-400 font-bold text-sm">High Risk</p>
            <p className="text-theme-main mt-1">Score: 70 – 100</p>
          </div>
        </div>
      </div>

      {/* External APIs */}
      <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card">
        <div className="flex items-center space-x-2 mb-4">
          <Key className="w-5 h-5 text-theme-muted" />
          <h3 className="text-base font-semibold text-theme-heading">Optional External API Integrations</h3>
        </div>
        <div className="text-xs text-theme-main space-y-2">
          <p>The following optional API keys can be set as environment variables on the backend:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="p-3 bg-theme-inset rounded-lg border border-theme">
              <p className="text-theme-muted text-[11px] font-mono font-semibold">VIRUSTOTAL_API_KEY</p>
              <p className="text-theme-main mt-0.5">URL reputation analysis via VirusTotal</p>
              <p className="text-amber-600 dark:text-amber-400 text-[11px] mt-1 font-medium">
                Status: Not configured (offline mode)
              </p>
            </div>
            <div className="p-3 bg-theme-inset rounded-lg border border-theme">
              <p className="text-theme-muted text-[11px] font-mono font-semibold">PHISHTANK_API_KEY</p>
              <p className="text-theme-main mt-0.5">Known phishing URL database check</p>
              <p className="text-amber-600 dark:text-amber-400 text-[11px] mt-1 font-medium">
                Status: Not configured (offline mode)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Storage */}
      <div className="p-6 rounded-xl bg-theme-card border border-theme shadow-theme-card">
        <div className="flex items-center space-x-2 mb-3">
          <Database className="w-5 h-5 text-theme-muted" />
          <h3 className="text-base font-semibold text-theme-heading">Data Storage &amp; Retention</h3>
        </div>
        <div className="text-xs text-theme-main space-y-1.5">
          <p>
            Analysis records are stored in a local SQLite database (
            <code className="text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded font-mono">
              backend/storage/forensics.db
            </code>
            ).
          </p>
          <p>
            Full email bodies are <b className="text-theme-heading">not</b> stored—only classification scores, evidence, and
            metadata identifiers are persisted.
          </p>
          <p>Uploaded images are temporarily saved as artifacts for report generation and are not retained after deletion.</p>
        </div>
      </div>
    </div>
  );
};

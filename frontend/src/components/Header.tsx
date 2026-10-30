import React from 'react';
import { Shield, RefreshCw, CheckCircle2, AlertTriangle, Sun, Moon } from 'lucide-react';
import type { HealthStatus } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentTab: string;
  health: HealthStatus | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  health,
  onRefresh,
  isRefreshing,
}) => {
  const { theme, toggleTheme } = useTheme();

  const getTitles = (tab: string) => {
    switch (tab) {
      case 'overview':
        return {
          title: 'Forensic System Overview',
          desc: 'Unified security operations & multi-modal threat investigation',
        };
      case 'email':
        return {
          title: 'Email Phishing & Threat Forensics',
          desc: 'TF-IDF Classifier, Linguistic Signals, URL Lexical Analysis & LIME Attribution',
        };
      case 'image':
        return {
          title: 'Deepfake & Image Forensics',
          desc: 'EXIF Metadata, 2D FFT/DCT Frequency Analysis, Neural Vision & Grad-CAM',
        };
      case 'history':
        return {
          title: 'Forensic Analysis History',
          desc: 'Audited case repository with tamper-evident evidence logs',
        };
      case 'reports':
        return {
          title: 'Forensic Examination Reports',
          desc: 'Comprehensive court-grade and audit PDF reports archive',
        };
      case 'settings':
        return {
          title: 'System Settings & Methodology',
          desc: 'Risk scoring thresholds, model documentation, and API integrations',
        };
      default:
        return { title: 'Dashboard', desc: 'Forensic Investigation Workspace' };
    }
  };

  const { title, desc } = getTitles(currentTab);

  return (
    <header className="h-16 px-6 bg-theme-header border-b border-theme flex items-center justify-between shrink-0 theme-transition">
      <div>
        <h2 className="text-base font-semibold text-theme-heading tracking-wide">{title}</h2>
        <p className="text-xs text-theme-muted">{desc}</p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Backend health status pill */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-theme-subtle border border-theme rounded-full text-xs theme-transition">
          {health?.email_model_loaded ? (
            <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">Email Model: Ready</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-rose-500 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">Email Model: Offline</span>
            </span>
          )}
          <span className="text-theme-dim opacity-40">|</span>
          {health?.vision_model_loaded ? (
            <span className="flex items-center space-x-1.5 text-purple-600 dark:text-purple-400">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">Vision Core: Ready</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">Vision Core: Standby</span>
            </span>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg bg-theme-subtle hover:bg-slate-200 dark:hover:bg-slate-700/80 text-theme-main hover:text-theme-heading transition border border-theme focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer flex items-center justify-center group"
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-amber-300 transition-transform duration-300 group-hover:-rotate-12" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
          )}
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh dashboard metrics"
          title="Refresh dashboard metrics"
          className="p-2 rounded-lg bg-theme-subtle hover:bg-slate-200 dark:hover:bg-slate-700/80 text-theme-main hover:text-theme-heading transition border border-theme disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};

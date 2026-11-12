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
          desc: 'Unified security operations & threat investigation',
        };
      case 'email':
        return {
          title: 'Email Phishing & Threat Forensics',
          desc: 'TF-IDF classifier, linguistic signals, URL lexical analysis & LIME attribution',
        };
      case 'image':
        return {
          title: 'Deepfake & Image Forensics',
          desc: 'EXIF metadata, 2D FFT/DCT frequency analysis, neural vision & Grad-CAM',
        };
      case 'history':
        return {
          title: 'Forensic Analysis History',
          desc: 'Audited case repository with tamper-evident evidence logs',
        };
      case 'reports':
        return {
          title: 'Forensic Examination Reports',
          desc: 'Court-grade and audit PDF reports archive',
        };
      case 'settings':
        return {
          title: 'System Settings & Methodology',
          desc: 'Risk scoring thresholds, model documentation & API integrations',
        };
      default:
        return { title: 'Dashboard', desc: 'Forensic Investigation Workspace' };
    }
  };

  const { title, desc } = getTitles(currentTab);

  return (
    <header className="h-16 px-6 bg-theme-header border-b border-theme flex items-center justify-between shrink-0 theme-transition">
      <div>
        <h2 className="text-base font-semibold text-theme-heading">{title}</h2>
        <p className="text-xs text-theme-muted">{desc}</p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Backend health status indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-theme-subtle border border-theme rounded-md text-xs theme-transition">
          {health?.email_model_loaded ? (
            <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="font-mono text-[11px]">Email: Ready</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-rose-500 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="font-mono text-[11px]">Email: Offline</span>
            </span>
          )}
          <span className="text-theme-dim opacity-40">|</span>
          {health?.vision_model_loaded ? (
            <span className="flex items-center space-x-1.5 text-theme-main">
              <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
              <span className="font-mono text-[11px]">Vision: Ready</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="font-mono text-[11px]">Vision: Standby</span>
            </span>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg bg-theme-subtle hover:bg-theme-inset text-theme-main hover:text-theme-heading transition-colors border border-theme focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer flex items-center justify-center"
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-amber-300" strokeWidth={1.5} />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
          )}
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh dashboard metrics"
          title="Refresh dashboard metrics"
          className="p-2 rounded-lg bg-theme-subtle hover:bg-theme-inset text-theme-main hover:text-theme-heading transition-colors border border-theme disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
};

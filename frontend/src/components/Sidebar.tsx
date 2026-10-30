import React from 'react';
import {
  LayoutDashboard,
  Mail,
  Image,
  History,
  FileText,
  Settings,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  systemHealthy: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, systemHealthy }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'email', label: 'Email Forensics', icon: Mail },
    { id: 'image', label: 'Image Forensics', icon: Image },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'reports', label: 'Forensic Reports', icon: FileText },
    { id: 'settings', label: 'Settings / About', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-theme-sidebar border-r border-theme flex flex-col shrink-0 min-h-screen theme-transition">
      {/* Brand Logo */}
      <div className="p-5 border-b border-theme flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-theme-heading">AEGIS FORENSICS</h1>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">AI Forensic Framework</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-theme-dim uppercase">
          Modules & Auditing
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400 border border-blue-500/30 shadow-sm font-semibold'
                  : 'text-theme-main hover:text-theme-heading hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-theme-muted'}`} />
              <span>{item.label}</span>
              {item.id === 'email' && (
                <span className="ml-auto text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                  ML
                </span>
              )}
              {item.id === 'image' && (
                <span className="ml-auto text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">
                  CV
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Panel */}
      <div className="p-4 border-t border-theme bg-theme-inset theme-transition">
        <div className="flex items-center justify-between text-xs text-theme-main mb-2">
          <span className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-theme-muted" />
            <span className="text-theme-muted">Engine Status</span>
          </span>
          <span className="flex items-center space-x-1">
            <span
              className={`w-2 h-2 rounded-full ${
                systemHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-[11px] text-theme-main font-semibold">
              {systemHealthy ? 'ONLINE' : 'OFFLINE'}
            </span>
          </span>
        </div>
        <p className="text-[11px] text-theme-muted leading-relaxed">
          Integrated Email & Vision Forensic Cores active independently.
        </p>
      </div>
    </aside>
  );
};

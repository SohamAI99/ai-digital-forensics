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
      <div className="p-4 border-b border-theme flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-theme-subtle border border-theme flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-semibold text-sm text-theme-heading">Aegis Forensics</h1>
          <p className="text-[11px] text-theme-muted font-mono">Digital Forensic Suite</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        <div className="px-3 pt-3 pb-2 text-[11px] font-medium text-theme-dim">
          Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full h-9 flex items-center space-x-2.5 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-theme-subtle text-theme-heading border border-theme'
                  : 'text-theme-main hover:text-theme-heading hover:bg-theme-subtle/50 border border-transparent'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-theme-muted'}`}
                strokeWidth={1.5}
              />
              <span className="truncate">{item.label}</span>
              {item.id === 'email' && (
                <span className="ml-auto text-[10px] font-mono text-theme-dim">ML</span>
              )}
              {item.id === 'image' && (
                <span className="ml-auto text-[10px] font-mono text-theme-dim">CV</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Panel */}
      <div className="p-4 border-t border-theme bg-theme-inset theme-transition">
        <div className="flex items-center justify-between text-xs text-theme-main mb-2">
          <span className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-theme-muted" strokeWidth={1.5} />
            <span className="text-theme-muted">Engine Status</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                systemHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-[11px] text-theme-main font-medium">
              {systemHealthy ? 'Online' : 'Offline'}
            </span>
          </span>
        </div>
        <p className="text-[11px] text-theme-muted leading-relaxed">
          Email &amp; Vision Forensic Cores active independently.
        </p>
      </div>
    </aside>
  );
};

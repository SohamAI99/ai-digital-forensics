import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: string;
  score?: number;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showIcon = true }) => {
  let colorStyles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  let Icon = HelpCircle;

  switch (level?.toLowerCase()) {
    case 'high risk':
    case 'high':
      colorStyles = 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
      Icon = AlertCircle;
      break;
    case 'medium risk':
    case 'medium':
      colorStyles = 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      Icon = AlertTriangle;
      break;
    case 'low risk':
    case 'low':
      colorStyles = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      Icon = CheckCircle;
      break;
    default:
      colorStyles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      Icon = HelpCircle;
      break;
  }

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${colorStyles}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{level || 'Unknown'}</span>
      {score !== undefined && (
        <span className="font-mono text-[11px] opacity-80">({score}/100)</span>
      )}
    </span>
  );
};

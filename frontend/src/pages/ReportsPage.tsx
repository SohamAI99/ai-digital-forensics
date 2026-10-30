import React, { useEffect, useState } from 'react';
import { FileText, Download, Mail, Image as ImageIcon } from 'lucide-react';
import { fetchHistory } from '../services/api';
import type { HistoryItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const ReportsPage: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await fetchHistory(undefined, 100);
        setItems(data.items.filter((i) => i.report_pdf_path));
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <div className="space-y-6 theme-transition">
      <div className="flex items-center space-x-2">
        <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
        <h3 className="text-base font-semibold text-theme-heading">Generated Forensic Examination Reports</h3>
        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
          {items.length} available
        </span>
      </div>

      <div className="rounded-xl bg-theme-card border border-theme overflow-hidden shadow-theme-card">
        {loading ? (
          <div className="p-10 text-center">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-theme-muted">Loading reports...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-theme-muted bg-theme-inset/70 border-b border-theme font-medium">
                <tr>
                  <th className="py-3 px-4">Report Case ID</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Subject / File</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4">Generated</th>
                  <th className="py-3 px-4">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme text-theme-main">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-850/40 transition">
                    <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400 font-semibold">{item.id}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] border font-medium ${
                          item.analysis_type === 'email'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                        }`}
                      >
                        {item.analysis_type === 'email' ? <Mail className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                        <span className="capitalize">{item.analysis_type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-theme-heading font-medium max-w-[200px] truncate">{item.identifier}</td>
                    <td className="py-3 px-4">{item.classification}</td>
                    <td className="py-3 px-4">
                      <RiskBadge level={item.risk_level} />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-theme-muted">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`/api/reports/${item.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-[11px] font-semibold transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-8 h-8 text-theme-dim mx-auto mb-3" />
            <p className="text-sm text-theme-heading font-medium">No forensic reports generated yet.</p>
            <p className="text-xs text-theme-muted mt-1">Reports are automatically created after each completed analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
};

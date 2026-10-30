import React, { useEffect, useState } from 'react';
import { History, Clock, Mail, Image as ImageIcon, Search, X, Download } from 'lucide-react';
import { fetchHistory } from '../services/api';
import type { HistoryItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const HistoryPage: React.FC = () => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'email' | 'image'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const data = await fetchHistory(filter === 'all' ? undefined : filter, 100);
        setItems(data.items);
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [filter]);

  const filtered = items.filter((item) =>
    item.identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.classification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 theme-transition">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-theme-heading">Complete Analysis Audit Log</h3>
          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
            {items.length} records
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="flex items-center bg-theme-card border border-theme rounded-lg px-3 py-1.5 text-xs shadow-sm">
            <Search className="w-3.5 h-3.5 text-theme-muted mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search case ID, subject, classification..."
              className="bg-transparent text-theme-heading outline-none w-60 placeholder:text-theme-muted"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center bg-theme-card p-1 rounded-lg border border-theme text-xs shadow-sm">
            {(['all', 'email', 'image'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md font-medium transition capitalize cursor-pointer ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-theme-muted hover:text-theme-heading'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-xl bg-theme-card border border-theme overflow-hidden shadow-theme-card">
        {loading ? (
          <div className="p-10 text-center">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-theme-muted">Loading forensic investigation records...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-theme-muted bg-theme-inset/70 border-b border-theme font-medium">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Target Subject / File</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme text-theme-main">
                {filtered.map((item) => (
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
                    <td className="py-3 px-4 font-medium text-theme-heading max-w-[220px] truncate">{item.identifier}</td>
                    <td className="py-3 px-4">{item.classification}</td>
                    <td className="py-3 px-4">
                      <RiskBadge level={item.risk_level} />
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{item.overall_score}</td>
                    <td className="py-3 px-4 text-theme-muted font-mono text-[11px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <a
                        href={`/api/reports/${item.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-theme-muted hover:text-theme-heading font-semibold"
                      >
                        PDF ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-theme-card">
            <Clock className="w-8 h-8 text-theme-dim mx-auto mb-3" />
            <p className="text-sm text-theme-heading font-medium">No forensic investigations on record.</p>
            <p className="text-xs text-theme-muted mt-1">Completed email and image analyses will appear here.</p>
          </div>
        )}
      </div>

      {/* Case Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-theme-card border border-theme rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-theme">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedItem.analysis_type === 'email'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  }`}
                >
                  {selectedItem.analysis_type === 'email' ? <Mail className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-theme-heading font-mono">{selectedItem.id}</h3>
                  <p className="text-[11px] text-theme-muted capitalize">{selectedItem.analysis_type} Forensic Examination</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-theme-muted hover:text-theme-heading hover:bg-theme-inset transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-theme-inset rounded-lg border border-theme">
                <div>
                  <span className="text-theme-muted text-[11px]">Classification: </span>
                  <span className="font-semibold text-theme-heading ml-1">{selectedItem.classification}</span>
                </div>
                <RiskBadge level={selectedItem.risk_level} score={selectedItem.overall_score} />
              </div>

              <div>
                <p className="text-theme-muted text-[11px] font-semibold uppercase tracking-wider mb-1">Target Subject / File</p>
                <p className="p-2.5 bg-theme-inset rounded border border-theme font-mono text-theme-heading break-all">
                  {selectedItem.identifier}
                </p>
              </div>

              <div>
                <p className="text-theme-muted text-[11px] font-semibold uppercase tracking-wider mb-1">Forensic Summary</p>
                <p className="p-2.5 bg-theme-inset rounded border border-theme text-theme-main leading-relaxed">
                  {selectedItem.summary || 'No summary available.'}
                </p>
              </div>

              {selectedItem.details && Object.keys(selectedItem.details).length > 0 && (
                <div>
                  <p className="text-theme-muted text-[11px] font-semibold uppercase tracking-wider mb-1">Telemetry &amp; Findings Breakdown</p>
                  <pre className="p-3 bg-theme-inset rounded border border-theme text-theme-main font-mono text-[11px] overflow-x-auto max-h-48 leading-tight">
                    {JSON.stringify(selectedItem.details, null, 2)}
                  </pre>
                </div>
              )}

              <div className="pt-3 border-t border-theme flex items-center justify-between">
                <span className="text-[11px] text-theme-muted font-mono">
                  Recorded: {new Date(selectedItem.timestamp).toLocaleString()}
                </span>
                <a
                  href={`/api/reports/${selectedItem.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-1.5 transition shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Court-Grade PDF</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

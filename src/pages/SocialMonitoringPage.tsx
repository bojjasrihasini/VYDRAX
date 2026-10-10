import React, { useState } from 'react';
import { Finding, Brand } from '../types/index.ts';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge.tsx';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Upload,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface SocialMonitoringPageProps {
  findings: Finding[];
  brands: Brand[];
  onSelectFinding: (id: string) => void;
  onTriggerScan: () => void;
  onOpenImportModal: () => void;
  isScanning: boolean;
}

export const SocialMonitoringPage: React.FC<SocialMonitoringPageProps> = ({
  findings,
  brands,
  onSelectFinding,
  onTriggerScan,
  onOpenImportModal,
  isScanning,
}) => {
  const [platformFilter, setPlatformFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Filter only social findings
  const socialFindings = findings.filter((f) => f.candidate_type === 'social');

  const filtered = socialFindings.filter((f) => {
    if (platformFilter !== 'all' && f.platform !== platformFilter) return false;
    if (brandFilter !== 'all' && f.brand_id !== brandFilter) return false;
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = f.target_name.toLowerCase().includes(q);
      const matchId = f.target_identifier.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Social Media Surveillance & Impersonation Detection
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
            Monitoring look-alike profiles across Instagram, X, Facebook, and LinkedIn with automated official asset exclusion.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={onOpenImportModal}
            className="btn-hover inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Candidate</span>
          </button>
          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className="btn-hover inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan Social Profiles'}</span>
          </button>
        </div>
      </div>

      {/* Connection Status Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="leading-relaxed">
            <strong>Data Source Mode:</strong> Standard Demonstration Feed with Real Algorithmic Analysis. External platform live API credentials can be configured in Settings.
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300 shrink-0 self-start sm:self-auto">
          OFFICIAL EXCLUSION ACTIVE
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search handle or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
          />
        </div>

        {/* Platform Filter */}
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all"
        >
          <option value="all">All Platforms</option>
          <option value="Instagram">Instagram</option>
          <option value="X">X (Twitter)</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Facebook">Facebook</option>
        </select>

        {/* Brand Filter */}
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all"
        >
          <option value="all">All Monitored Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical (85-100)</option>
          <option value="high">High (65-84)</option>
          <option value="medium">Medium (40-64)</option>
          <option value="low">Low (0-39)</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all"
        >
          <option value="all">All Case Statuses</option>
          <option value="new">New Alert</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved / Takedown</option>
          <option value="false_positive">False Positive</option>
        </select>
      </div>

      {/* Findings Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm card-hover overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/75">
                <th className="py-3.5 px-4 font-semibold">Candidate Profile / Handle</th>
                <th className="py-3.5 px-4 font-semibold">Platform</th>
                <th className="py-3.5 px-4 font-semibold">Protected Brand</th>
                <th className="py-3.5 px-4 font-semibold text-right">Name Sim.</th>
                <th className="py-3.5 px-4 font-semibold text-right">Risk Score</th>
                <th className="py-3.5 px-4 font-semibold">Severity</th>
                <th className="py-3.5 px-4 font-semibold">Detection Factors</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                    No social media candidates match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{f.target_name}</div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 mt-0.5">
                        <span>{f.target_identifier}</span>
                        <a
                          href={f.target_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {f.platform}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {f.brand_name || 'Vytrix Financial'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right tabular-nums text-emerald-700 font-semibold">
                      {f.name_similarity}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right tabular-nums font-bold text-rose-600">
                      {f.risk_score}
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={f.severity} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {f.evidence?.[0]?.title || 'Multiple risk indicators'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectFinding(f.id)}
                        className="btn-hover px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

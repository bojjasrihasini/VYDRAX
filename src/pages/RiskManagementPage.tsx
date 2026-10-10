import React, { useState } from 'react';
import { Finding, Brand, FindingStatus } from '../types/index.ts';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge.tsx';
import {
  FolderLock,
  Search,
  Filter,
  FileText,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface RiskManagementPageProps {
  findings: Finding[];
  brands: Brand[];
  onSelectFinding: (id: string) => void;
  onOpenTakedown: (finding: Finding) => void;
  onRefreshFindings: () => void;
}

export const RiskManagementPage: React.FC<RiskManagementPageProps> = ({
  findings,
  brands,
  onSelectFinding,
  onOpenTakedown,
  onRefreshFindings,
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = findings.filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (brandFilter !== 'all' && f.brand_id !== brandFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!f.target_name.toLowerCase().includes(q) && !f.target_identifier.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleQuickStatusChange = async (findingId: string, newStatus: FindingStatus) => {
    try {
      const res = await fetch(`/api/findings/${findingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          changed_by: 'SecOps Analyst',
          reason: 'Quick status change from triage table',
        }),
      });
      if (res.ok) {
        onRefreshFindings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const newCount = findings.filter((f) => f.status === 'new').length;
  const investigatingCount = findings.filter((f) => f.status === 'investigating').length;
  const resolvedCount = findings.filter((f) => f.status === 'resolved').length;
  const fpCount = findings.filter((f) => f.status === 'false_positive').length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FolderLock className="w-4 h-4" />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Risk Management & Threat Investigation Center
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
            Triage active candidate infractions, record analyst audit logs, track resolution workflows, and export legal notices.
          </p>
        </div>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm card-hover flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] block mb-1">New Alerts</span>
            <span className="font-mono text-2xl md:text-3xl font-extrabold text-blue-600 tabular-nums">
              {newCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            !
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm card-hover flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] block mb-1">In Investigation</span>
            <span className="font-mono text-2xl md:text-3xl font-extrabold text-amber-600 tabular-nums">
              {investigatingCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            ?
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm card-hover flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] block mb-1">Resolved / Takedowns</span>
            <span className="font-mono text-2xl md:text-3xl font-extrabold text-emerald-600 tabular-nums">
              {resolvedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm card-hover flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] block mb-1">False Positives</span>
            <span className="font-mono text-2xl md:text-3xl font-extrabold text-slate-600 tabular-nums">
              {fpCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            -
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter finding title or handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all"
        >
          <option value="all">All Case Statuses</option>
          <option value="new">New Alert</option>
          <option value="investigating">Under Investigation</option>
          <option value="resolved">Resolved / Takedown</option>
          <option value="false_positive">False Positive</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all"
        >
          <option value="all">All Severity Levels</option>
          <option value="critical">Critical (85-100)</option>
          <option value="high">High (65-84)</option>
          <option value="medium">Medium (40-64)</option>
          <option value="low">Low (0-39)</option>
        </select>

        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-all"
        >
          <option value="all">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Findings Triage Queue Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm card-hover overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/75">
                <th className="py-3.5 px-4 font-semibold">Finding Target / ID</th>
                <th className="py-3.5 px-4 font-semibold">Channel</th>
                <th className="py-3.5 px-4 font-semibold">Protected Brand</th>
                <th className="py-3.5 px-4 font-semibold text-right">Risk</th>
                <th className="py-3.5 px-4 font-semibold">Severity</th>
                <th className="py-3.5 px-4 font-semibold">Workflow Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    No threat findings matching current filter parameters.
                  </td>
                </tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{f.target_name}</div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 mt-0.5">
                        <span>{f.target_identifier}</span>
                        <a
                          href={f.target_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-600 ml-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <span className="capitalize">{f.candidate_type}</span> · {f.platform}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {f.brand_name || 'Vytrix Financial'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-right tabular-nums font-bold text-rose-600">
                      {f.risk_score}
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={f.severity} />
                    </td>
                    <td className="py-3.5 px-4">
                      {/* Fast inline status selector */}
                      <select
                        value={f.status}
                        onChange={(e) =>
                          handleQuickStatusChange(f.id, e.target.value as FindingStatus)
                        }
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="new">New Alert</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved / Takedown</option>
                        <option value="false_positive">False Positive</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => onOpenTakedown(f)}
                        className="btn-hover px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-sm transition-all"
                        title="Draft Legal Takedown Notice"
                      >
                        Takedown Notice
                      </button>
                      <button
                        onClick={() => onSelectFinding(f.id)}
                        className="btn-hover px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-700/20 transition-all"
                      >
                        Dossier
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

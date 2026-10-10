import React from 'react';
import { Finding, Brand } from '../types/index.ts';
import { FileBarChart2, Download, ShieldCheck, AlertTriangle, Layers } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ReportsPageProps {
  findings: Finding[];
  brands: Brand[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ findings, brands }) => {
  // Aggregate statistics
  const totalFindings = findings.length;
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;
  const medCount = findings.filter((f) => f.severity === 'medium').length;
  const lowCount = findings.filter((f) => f.severity === 'low').length;
  const resolvedCount = findings.filter((f) => f.status === 'resolved').length;

  // Platform breakdown data
  const platformCounts: Record<string, number> = {};
  for (const f of findings) {
    platformCounts[f.platform] = (platformCounts[f.platform] || 0) + 1;
  }
  const platformData = Object.entries(platformCounts).map(([platform, count]) => ({
    platform,
    count,
  }));

  // Status breakdown data
  const statusData = [
    { name: 'New', count: findings.filter((f) => f.status === 'new').length, color: '#3b82f6' },
    { name: 'Investigating', count: findings.filter((f) => f.status === 'investigating').length, color: '#f59e0b' },
    { name: 'Resolved', count: resolvedCount, color: '#10b981' },
    { name: 'False Positive', count: findings.filter((f) => f.status === 'false_positive').length, color: '#64748b' },
  ];

  const handleDownloadCsv = () => {
    window.location.href = '/api/findings/export/csv';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileBarChart2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Executive Threat Intelligence & Export Center
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
            Generate and export compliance reports, brand infringement summaries, and CSV audit logs.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="btn-hover inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/20 transition-all self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Findings to CSV</span>
        </button>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm card-hover">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] block mb-1">Total Infractions</span>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
            {totalFindings}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Cross-Channel Candidates</span>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm card-hover">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] block mb-1">Priority (Critical + High)</span>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-rose-600 tabular-nums">
            {criticalCount + highCount}
          </div>
          <span className="text-[11px] text-rose-600/80 mt-1 block">Immediate Legal Threat</span>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm card-hover">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] block mb-1">Takedowns Executed</span>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-600 tabular-nums">
            {resolvedCount}
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-1 block">Successfully Neutralized</span>
        </div>

        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm card-hover">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] block mb-1">Enforcement Rate</span>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
            {totalFindings > 0 ? Math.round((resolvedCount / totalFindings) * 100) : 0}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Resolution Velocity</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threats by Platform */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Threats by Source Platform</h3>
          <p className="text-xs text-slate-500 mb-5">Channel distribution across social networks and app stores</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="platform" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1722', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threats by Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Workflow Status Breakdown</h3>
          <p className="text-xs text-slate-500 mb-5">Current stage in the investigation and takedown lifecycle</p>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1722', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brand-Level Threat Summary Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Organization Threat Posture Summary
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">High-level threat matrix grouped by enterprise entity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/75">
                <th className="py-3 px-4 font-semibold">Organization</th>
                <th className="py-3 px-4 font-semibold">Domain</th>
                <th className="py-3 px-4 font-semibold text-right">Official Assets</th>
                <th className="py-3 px-4 font-semibold text-right">Flagged Threats</th>
                <th className="py-3 px-4 font-semibold text-right">Takedowns</th>
                <th className="py-3 px-4 font-semibold">Risk Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {brands.map((b) => {
                const brandFindings = findings.filter((f) => f.brand_id === b.id);
                const bThreats = brandFindings.filter((f) => f.status !== 'resolved' && f.status !== 'false_positive').length;
                const bResolved = brandFindings.filter((f) => f.status === 'resolved').length;
                return (
                  <tr key={b.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{b.name}</td>
                    <td className="py-3 px-4 text-emerald-700 font-mono text-[11px] font-semibold">{b.website}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium">
                      {(b.official_social_count || 0) + (b.official_app_count || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-rose-600">
                      {bThreats}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-600">
                      {bResolved}
                    </td>
                    <td className="py-3 px-4">
                      {bThreats > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 text-xs font-semibold">
                          Active Impersonation
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs font-semibold">
                          Nominal Surveillance
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

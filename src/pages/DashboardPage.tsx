import React from 'react';
import { DashboardStats, Finding, Brand } from '../types/index.ts';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge.tsx';
import {
  ShieldAlert,
  Globe2,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  SearchCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardPageProps {
  stats: DashboardStats | null;
  recentFindings: Finding[];
  brands: Brand[];
  onSelectFinding: (id: string) => void;
  onNavigateTab: (tab: any) => void;
  onTriggerScanSocial: () => void;
  onTriggerScanApps: () => void;
  onOpenBrandModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  recentFindings,
  brands,
  onSelectFinding,
  onNavigateTab,
  onTriggerScanSocial,
  onTriggerScanApps,
  onOpenBrandModal,
}) => {
  const defaultStats: DashboardStats = stats || {
    monitored_brands: brands.length || 2,
    social_scanned: 8,
    apps_scanned: 5,
    total_threats: 6,
    critical_threats: 2,
    high_threats: 3,
    medium_threats: 1,
    low_threats: 0,
    resolved_threats: 1,
    risk_distribution: [
      { name: 'Critical', count: 2, color: '#ef4444' },
      { name: 'High', count: 3, color: '#f97316' },
      { name: 'Medium', count: 1, color: '#eab308' },
      { name: 'Low', count: 0, color: '#06b6d4' },
    ],
    platform_distribution: [
      { platform: 'Instagram', count: 3 },
      { platform: 'Google Play', count: 2 },
      { platform: 'X', count: 2 },
      { platform: 'Third-Party APK', count: 1 },
    ],
    type_distribution: [
      { name: 'Social Profiles', count: 4 },
      { name: 'Mobile Apps', count: 3 },
    ],
    threat_trends: [
      { date: 'Apr 03', detections: 2, resolved: 0 },
      { date: 'Apr 04', detections: 4, resolved: 1 },
      { date: 'Apr 05', detections: 6, resolved: 1 },
      { date: 'Apr 06', detections: 7, resolved: 2 },
      { date: 'Apr 07', detections: 9, resolved: 3 },
      { date: 'Apr 08', detections: 10, resolved: 3 },
      { date: 'Apr 09', detections: 11, resolved: 4 },
    ],
  };

  const COLORS = ['#e11d48', '#ea580c', '#d97706', '#059669'];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-[#111822] via-[#1a2332] to-[#111822] border border-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6 card-hover">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-400 font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              OPERATIONAL DEFENSE CONSOLE
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-300 font-medium">Live Asset Surveillance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-sans">
            Digital Risk Protection & Impersonation Hub
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Surveilling social media channels and mobile app ecosystems for brand trademark infringement, rogue APKs, and typosquatting.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => onNavigateTab('url_analysis')}
            className="btn-hover px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/30 transition-all flex items-center gap-2"
          >
            <SearchCheck className="w-4 h-4" />
            <span>Analyze Suspicious URL</span>
          </button>
          <button
            onClick={onTriggerScanSocial}
            className="btn-hover px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
          >
            Scan Social Media
          </button>
          <button
            onClick={onTriggerScanApps}
            className="btn-hover px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
          >
            Scan App Stores
          </button>
          <button
            onClick={onOpenBrandModal}
            className="btn-hover px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 shadow-sm transition-all"
          >
            + Register Brand
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monitored</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
            {defaultStats.monitored_brands}
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">Active Entities</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Profiles</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
            {defaultStats.social_scanned}
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">Social Accounts</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">App Listings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
            {defaultStats.apps_scanned}
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">Store Catalog</span>
        </div>

        <div className="bg-white border border-rose-200/90 rounded-2xl p-5 shadow-sm card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Threats</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-rose-600 tabular-nums">
            {defaultStats.total_threats}
          </div>
          <span className="text-[11px] text-rose-600/80 font-medium mt-1 block">Requiring Triage</span>
        </div>

        <div className="bg-white border border-amber-200/90 rounded-2xl p-5 shadow-sm card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical/High</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-amber-600 tabular-nums">
            {defaultStats.critical_threats + defaultStats.high_threats}
          </div>
          <span className="text-[11px] text-amber-600/80 font-medium mt-1 block">High Priority</span>
        </div>

        <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-sm card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-600 tabular-nums">
            {defaultStats.resolved_threats}
          </div>
          <span className="text-[11px] text-emerald-600/80 font-medium mt-1 block">Takedowns Sent</span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Trend Over Time */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Detection & Resolution Trajectory</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Surveillance velocity across social feeds and app repositories
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Detections
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Resolved
              </span>
            </div>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={defaultStats.threat_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="detections" stroke="#059669" fillOpacity={1} fill="url(#colorDetections)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Severity Breakdown Donut */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Risk Severity Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Findings grouped by algorithm risk bracket</p>
          </div>
          <div className="h-48 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defaultStats.risk_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {defaultStats.risk_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs pt-2 border-t border-slate-100">
            {defaultStats.risk_distribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent High-Risk Detections Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Active Impersonation Findings (Priority Queue)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recent high-confidence look-alike accounts and fraudulent applications
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('risk')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors"
          >
            <span>Open Triage Desk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/75">
                <th className="py-3 px-4 font-semibold">Target / Handle</th>
                <th className="py-3 px-4 font-semibold">Type & Platform</th>
                <th className="py-3 px-4 font-semibold">Protected Brand</th>
                <th className="py-3 px-4 font-semibold text-right">Name Sim.</th>
                <th className="py-3 px-4 font-semibold text-right">Risk Score</th>
                <th className="py-3 px-4 font-semibold">Severity</th>
                <th className="py-3 px-4 font-semibold">Case Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentFindings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No active threat findings detected. Trigger a scan above to evaluate candidate listings.
                  </td>
                </tr>
              ) : (
                recentFindings.slice(0, 5).map((f) => (
                  <tr key={f.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="font-semibold text-slate-900">{f.target_name}</div>
                      <span className="font-mono text-[11px] text-slate-500">{f.target_identifier}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-medium">{f.candidate_type}</span> · {f.platform}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {f.brand_name || 'Vytrix Financial'}
                    </td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums text-emerald-700 font-semibold">
                      {f.name_similarity}%
                    </td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums font-bold text-rose-600">
                      {f.risk_score}/100
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={f.severity} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
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

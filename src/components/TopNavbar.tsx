import React, { useState } from 'react';
import {
  Bell,
  Search,
  Shield,
  RefreshCw,
  User,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface TopNavbarProps {
  breadcrumbs: string[];
  onOpenBrandModal: () => void;
  onQuickScan: () => void;
  isScanning?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  breadcrumbs,
  onOpenBrandModal,
  onQuickScan,
  isScanning = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/85 px-6 flex items-center justify-between gap-6 shrink-0 z-30 sticky top-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Zone 1: Breadcrumbs Trail */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
        <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-slate-800 font-semibold">VYTRIX Platform</span>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <span className="text-slate-300">/</span>
            <span className={idx === breadcrumbs.length - 1 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Zone 2: Search and Telemetry */}
      <div className="flex-1 max-w-md hidden md:flex items-center relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Quick search across brands, usernames, package IDs..."
          className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
        />
      </div>

      {/* Zone 3: Primary Actions and Profile */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onQuickScan}
          disabled={isScanning}
          className="btn-hover inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
          <span>{isScanning ? 'Scanning Assets...' : 'Run Sweep'}</span>
        </button>

        <button
          onClick={onOpenBrandModal}
          className="btn-hover inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/20 hover:shadow-md hover:shadow-emerald-600/25 transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Brand</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all relative btn-hover"
            title="Active Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-3.5 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs font-bold text-slate-800">
                <span>Security Alerts (Live Stream)</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 font-mono px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  3 UNRESOLVED
                </span>
              </div>
              <div className="py-2.5 space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/70 text-rose-800">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>Critical Impersonation on Instagram</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    @vytrix_support_official detected targeting Vytrix Financial clients.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-800">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Rogue Mobile APK Found</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    com.vytrix.fastloans.apk published by unverified developer on Google Play.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-800">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>Official Asset Exclusion Verified</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Exact handle @vytrix_official excluded from threat database.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold">
              <User className="w-4 h-4" />
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-2 ring-white" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">SecOps Lead</span>
            <span className="text-[10px] text-slate-500 font-mono">Triage Station</span>
          </div>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Globe2,
  Smartphone,
  Binary,
  FolderLock,
  FileBarChart2,
  GitFork,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  SearchCheck,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'brands'
  | 'url_analysis'
  | 'social'
  | 'apps'
  | 'lookalike'
  | 'risk'
  | 'reports'
  | 'architecture'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  threatCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  threatCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'url_analysis' as NavTab, label: 'URL Risk Analysis', icon: SearchCheck },
    { id: 'brands' as NavTab, label: 'Monitored Brands', icon: Globe2 },
    { id: 'social' as NavTab, label: 'Social Media Protection', icon: ShieldAlert, badge: threatCount > 0 ? threatCount : undefined },
    { id: 'apps' as NavTab, label: 'App Store Defense', icon: Smartphone },
    { id: 'lookalike' as NavTab, label: 'Look-alike Sandbox', icon: Binary },
    { id: 'risk' as NavTab, label: 'Investigation & Takedown', icon: FolderLock },
    { id: 'reports' as NavTab, label: 'Intelligence Reports', icon: FileBarChart2 },
    { id: 'architecture' as NavTab, label: 'Pipeline Architecture', icon: GitFork },
    { id: 'settings' as NavTab, label: 'Data Sources & Tests', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0f1722] border-r border-slate-800/80 transition-all duration-200 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-[#0d141e]/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-950/40">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-base font-extrabold tracking-tight text-white font-sans">
                VYTRIX
              </span>
              <span className="text-[10px] text-emerald-400/90 font-mono font-semibold tracking-wider">
                DRP SHIELD
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-all duration-150 btn-hover"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group relative ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-950/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 hover:translate-x-0.5'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'
                }`}
              />
              {!collapsed && (
                <span className="truncate whitespace-nowrap text-left flex-1">
                  {item.label}
                </span>
              )}
              {!collapsed && item.badge !== undefined && (
                <span className="font-mono text-[10px] tabular-nums px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demonstration Dataset Indicator */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0d141e]/70">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span>Environment</span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Sample records seeded for hackathon evaluation. Live exclusion engine active.
            </p>
          </div>
        ) : (
          <div className="flex justify-center text-[10px] text-emerald-400 font-mono font-bold">
            DEMO
          </div>
        )}
      </div>
    </aside>
  );
};

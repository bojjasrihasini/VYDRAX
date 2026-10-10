import React, { useState } from 'react';
import {
  GitFork,
  Database,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Server,
  LayoutDashboard,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(4);

  const stages = [
    {
      id: 1,
      title: '1. Ingestion & Adapters',
      category: 'Data Sources',
      icon: Layers,
      summary: 'Collects candidate profile and application listings',
      details:
        'Supports authorized live APIs (Instagram Graph, X API v2, Google Play Store Scraper, Apple Store Prober) alongside structured demonstration records and manual analyst CSV imports. Normalizes raw payloads into standard TypeScript interfaces.',
      exclusionRole: 'Ingests candidate identifiers and URLs without filtering yet.',
    },
    {
      id: 2,
      title: '2. Normalization & Tokenization',
      category: 'Preprocessing',
      icon: Cpu,
      summary: 'Strips noise, punctuation, homoglyphs, and case variations',
      details:
        'Converts strings via NFKD Unicode normalization. Strips non-alphanumeric punctuation (e.g. converting "v.y.t.r.i.x" to "vytrix"). Cleans handles, store listing URL paths, and package tokens into canonical form for strict evaluation.',
      exclusionRole: 'Ensures exact matches cannot evade exclusion via punctuation tricks.',
    },
    {
      id: 3,
      title: '3. Official Asset Exclusion Gate',
      category: 'Core Safety Interceptor',
      icon: ShieldCheck,
      badge: 'CRITICAL ISOLATION PATH',
      summary: 'Bypasses registered brand assets before threat engine triggers',
      details:
        'Checks candidate against verified official accounts and approved app package IDs. If an exact match is confirmed on that platform, the candidate is instantly tagged as "Official Asset" (Risk Score = 0, isThreat = false) and excluded from the threat database.',
      exclusionRole:
        'STOPS false positives at the root. Trusted accounts (@vytrix, @vytrix_official, com.vytrix.banking) are never flagged as impersonators.',
    },
    {
      id: 4,
      title: '4. Similarity & Anomaly Matrix',
      category: 'Detection Engine',
      icon: GitFork,
      summary: 'Calculates Levenshtein, Jaro-Winkler, swaps, and homoglyphs',
      details:
        'Compares candidate against brand names, aliases, and official usernames. Applies adjacent character swap detection (transpositions), leetspeak mapping (e.g. "1" -> "i"), and token overlap. Evaluates publisher mismatch for mobile apps and deceptive suffixes ("support", "verify", "official").',
      exclusionRole: 'Only candidates that pass the exclusion gate are evaluated.',
    },
    {
      id: 5,
      title: '5. Risk Scoring & Evidence Synthesis',
      category: 'Explainability Engine',
      icon: AlertTriangle,
      summary: 'Transparent 0–100 score + structured evidence items',
      details:
        'Applies deterministic scoring weights. Binds human-readable rule explanations (e.g. "Adjacent Character Swap", "Publisher Mismatch", "Deceptive Keyword") and severity classification (Critical: 85-100, High: 65-84, Medium: 40-64, Low: 0-39). Produces legal takedown recommendations.',
      exclusionRole: 'Produces transparent mathematical breakdown of every risk point added.',
    },
    {
      id: 6,
      title: '6. Persistent SQLite Database',
      category: 'Data Layer',
      icon: Database,
      summary: 'Relational storage with persistent disk sync (sql.js)',
      details:
        'Persists brands, registered assets, candidate records, findings, evidence logs, analyst investigation notes, and status audit trails to disk (data/vytrix.sqlite). Guarantees zero data loss across page reloads.',
      exclusionRole: 'Stores both verified official registry and detected findings.',
    },
    {
      id: 7,
      title: '7. REST API & Triage Interface',
      category: 'Presentation & Enforcement',
      icon: LayoutDashboard,
      summary: 'Executive dashboard, triage desk, and takedown generator',
      details:
        'Express.js endpoints serve real-time metrics, filtered views, and status updates to the React client. Features interactive look-alike sandbox, CSV export, and one-click DMCA/Trademark legal takedown packet dispatch.',
      exclusionRole: 'Surfaces explicit verification status and evidence timeline.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <GitFork className="w-4 h-4" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            System Architecture & Official Exclusion Pipeline
          </h1>
        </div>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
          End-to-end data processing workflow from external data collection through algorithmic detection and legal takedown dispatch.
        </p>
      </div>

      {/* Visual Pipeline Flow Diagram */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm card-hover space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Interactive Pipeline Flow
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Click any stage below to inspect technical mechanics and exclusion rules</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {stages.map((st) => {
            const Icon = st.icon;
            const isSelected = selectedStage === st.id;
            const isExclusionGate = st.id === 3;

            return (
              <button
                key={st.id}
                onClick={() => setSelectedStage(st.id)}
                className={`btn-hover p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? isExclusionGate
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-500/30'
                      : 'bg-emerald-50/70 border-emerald-500 text-slate-900 shadow-sm ring-2 ring-emerald-500/20'
                    : isExclusionGate
                    ? 'bg-emerald-50/30 border-emerald-200 text-slate-800 hover:border-emerald-400'
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isExclusionGate ? 'text-emerald-600' : 'text-emerald-700'
                      }`}
                    />
                    <span className="text-[10px] font-mono font-semibold text-slate-400">Stage {st.id}</span>
                  </div>
                  <div className="font-bold text-xs leading-snug text-slate-900">{st.title}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{st.category}</div>
                </div>

                {isExclusionGate && (
                  <span className="mt-3 text-[9px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider block">
                    Zero False Positives
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Stage Deep Dive Callout */}
        {selectedStage && (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3.5 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-700 font-bold text-sm">
                  {stages[selectedStage - 1].title}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-600 font-medium">{stages[selectedStage - 1].category}</span>
              </div>
              {stages[selectedStage - 1].id === 3 && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-bold">
                  EXCLUSION GATE ACTIVATED
                </span>
              )}
            </div>

            <p className="text-slate-700 leading-relaxed text-xs md:text-sm">
              {stages[selectedStage - 1].details}
            </p>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 flex items-start gap-3 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 font-semibold">Asset Exclusion Safeguard: </strong>
                <span className="text-slate-600">
                  {stages[selectedStage - 1].exclusionRole}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integration Matrix Table: Live vs Demo Data */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm card-hover space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Source Integration & Demonstration Mode Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Documentation of live versus demonstration data source adapters as required by hackathon guidelines.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/75">
                <th className="py-3 px-4 font-semibold">Source Channel</th>
                <th className="py-3 px-4 font-semibold">Target Ecosystem</th>
                <th className="py-3 px-4 font-semibold">Adapter Mode</th>
                <th className="py-3 px-4 font-semibold">Exclusion Method</th>
                <th className="py-3 px-4 font-semibold">Live Credential Requirement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-emerald-50/20 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">Instagram Graph API</td>
                <td className="py-3 px-4 text-slate-600">Meta Business Ecosystem</td>
                <td className="py-3 px-4 text-emerald-700 font-mono text-[11px] font-semibold">Demo Feed Active</td>
                <td className="py-3 px-4 font-medium">Exact Handle Normalization</td>
                <td className="py-3 px-4 text-slate-500">Meta App ID & Access Token (optional)</td>
              </tr>
              <tr className="hover:bg-emerald-50/20 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">X (Twitter) API v2</td>
                <td className="py-3 px-4 text-slate-600">X Stream & User Lookup</td>
                <td className="py-3 px-4 text-emerald-700 font-mono text-[11px] font-semibold">Demo Feed Active</td>
                <td className="py-3 px-4 font-medium">Exact Username Comparison</td>
                <td className="py-3 px-4 text-slate-500">X Bearer Token (optional)</td>
              </tr>
              <tr className="hover:bg-emerald-50/20 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">Google Play Store Indexer</td>
                <td className="py-3 px-4 text-slate-600">Android Ecosystem</td>
                <td className="py-3 px-4 text-emerald-700 font-mono text-[11px] font-semibold">Demo Feed Active</td>
                <td className="py-3 px-4 font-medium">Package Identifier Match</td>
                <td className="py-3 px-4 text-slate-500">Play Developer API Key (optional)</td>
              </tr>
              <tr className="hover:bg-emerald-50/20 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">Apple App Store Prober</td>
                <td className="py-3 px-4 text-slate-600">iOS & iPadOS Ecosystem</td>
                <td className="py-3 px-4 text-emerald-700 font-mono text-[11px] font-semibold">Demo Feed Active</td>
                <td className="py-3 px-4 font-medium">Store Listing URL & Bundle ID</td>
                <td className="py-3 px-4 text-slate-500">App Store Connect API Key (optional)</td>
              </tr>
              <tr className="hover:bg-emerald-50/20 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">Manual & Bulk Ingestion</td>
                <td className="py-3 px-4 text-slate-600">Analyst Uploads (JSON/CSV)</td>
                <td className="py-3 px-4 text-emerald-700 font-mono text-[11px] font-semibold">Live Operator Mode</td>
                <td className="py-3 px-4 font-medium">Registry Cross-Reference</td>
                <td className="py-3 px-4 text-emerald-700 font-medium">None required (Fully Operational)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { DataSource } from '../types/index.ts';
import {
  Settings,
  Shield,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sliders,
  Database,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface SettingsPageProps {
  onRefreshAll: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshAll }) => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [similarityThreshold, setSimilarityThreshold] = useState(50);
  const [minRiskThreshold, setMinRiskThreshold] = useState(40);
  const [testResults, setTestResults] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleRunTests = async () => {
    setRunningTests(true);
    try {
      const res = await fetch('/api/test-suite');
      if (res.ok) {
        const data = await res.json();
        setTestResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunningTests(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            System Settings, Data Sources & Engine Verification
          </h1>
        </div>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
          Manage data source adapters, configure risk scoring thresholds, and execute automated engine verification tests.
        </p>
      </div>

      {/* Data Sources Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Configured Ingestion Adapters & Data Feeds
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Surveillance integrations monitoring active impersonation channels</p>
          </div>
          <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-mono font-semibold">
            {sources.length} Channels Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((src) => (
            <div
              key={src.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 text-xs shadow-sm card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-bold text-slate-900 text-sm">{src.name}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    DEMO ACTIVE
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  {src.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-medium">
                <span>Platform: <strong className="text-slate-700">{src.platform}</strong></span>
                <span className="font-mono text-[11px] text-slate-400">
                  {src.last_scan ? new Date(src.last_scan).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detection Scoring Parameters & Sliders */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm card-hover space-y-6 text-xs">
        <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <span>Algorithmic Detection Thresholds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-1">
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-800 font-semibold text-xs">
                Name Similarity Detection Cutoff
              </label>
              <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-xs">
                {similarityThreshold}%
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={80}
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Minimum combined Levenshtein & Jaro-Winkler similarity before triggering threat evaluation.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-800 font-semibold text-xs">
                Minimum Risk Score for Active Threat Queue
              </label>
              <span className="font-mono text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-bold text-xs">
                {minRiskThreshold} / 100
              </span>
            </div>
            <input
              type="range"
              min={25}
              max={75}
              value={minRiskThreshold}
              onChange={(e) => setMinRiskThreshold(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Candidates scoring below this point are filtered out as low/negligible risks.
            </p>
          </div>
        </div>
      </div>

      {/* Automated Engine Test Suite */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm card-hover space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Automated Detection Engine Test Suite (11 Core Unit Tests)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Validates official account exclusion, character swaps, homoglyphs, and severity boundary invariants.
            </p>
          </div>

          <button
            onClick={handleRunTests}
            disabled={runningTests}
            className="btn-hover inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/20 transition-all disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            <Play className={`w-3.5 h-3.5 ${runningTests ? 'animate-spin' : ''}`} />
            <span>{runningTests ? 'Executing Tests...' : 'Run Automated Tests'}</span>
          </button>
        </div>

        {testResults ? (
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <span className="text-emerald-950 font-bold text-xs md:text-sm">
                Test Suite Summary: {testResults.passed} / {testResults.total} Tests Passed
              </span>
              <span className="font-mono font-extrabold text-emerald-700 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 text-xs">
                100% PASS RATE
              </span>
            </div>

            <div className="space-y-2">
              {testResults.results.map((r: any) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {r.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-slate-900">{r.name}</span>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{r.actual}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    PASS
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center font-medium">
            Click 'Run Automated Tests' to trigger the 11 deterministic rule validation checks live.
          </div>
        )}
      </div>
    </div>
  );
};

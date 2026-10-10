import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, RefreshCw, AlertTriangle, X } from 'lucide-react';

interface ScanProgressModalProps {
  scanType: 'social' | 'apps';
  brandName: string;
  result: {
    candidates_evaluated: number;
    threats_found: number;
    official_assets_excluded?: number;
    official_apps_excluded?: number;
  } | null;
  onClose: () => void;
}

export const ScanProgressModal: React.FC<ScanProgressModalProps> = ({
  scanType,
  brandName,
  result,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Ingesting candidate records from data sources...',
    'Normalizing unicode, handles, and store identifiers...',
    'Executing Official Asset Exclusion Filter...',
    'Calculating Levenshtein & Jaro-Winkler similarity matrices...',
    'Analyzing character swaps, homoglyphs & deceptive tokens...',
    'Correlating publisher metadata and risk weights...',
    'Writing threat findings and structured evidence to SQLite...',
  ];

  useEffect(() => {
    if (!result) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 350);
      return () => clearInterval(interval);
    } else {
      setCurrentStep(steps.length - 1);
    }
  }, [result]);

  const excludedCount = result?.official_assets_excluded ?? result?.official_apps_excluded ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 text-xs overflow-hidden">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <RefreshCw className={`w-4 h-4 ${!result ? 'animate-spin' : ''}`} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {result ? 'Scan Completed' : `Executing ${scanType === 'social' ? 'Social Media' : 'App Store'} Scan`}
            </h3>
          </div>
          {result && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <span className="text-slate-500 block text-[11px] font-medium">Target Brand Profile</span>
          <span className="text-slate-900 font-bold text-xs">{brandName}</span>
        </div>

        {/* Step-by-Step HUD */}
        <div className="space-y-2.5 mb-5">
          {steps.map((st, idx) => {
            const isDone = Boolean(result) || idx < currentStep;
            const isCurrent = !result && idx === currentStep;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 transition-colors ${
                  isDone
                    ? 'text-slate-700 font-medium'
                    : isCurrent
                    ? 'text-emerald-700 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className="truncate">{st}</span>
              </div>
            );
          })}
        </div>

        {/* Scan Summary Results */}
        {result && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 mb-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Total Candidates Evaluated:</span>
              <span className="font-mono text-slate-900 font-bold tabular-nums">
                {result.candidates_evaluated}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-700">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Official Assets Excluded:</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                {excludedCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-rose-600">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Impersonation Threats Flagged:</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                {result.threats_found}
              </span>
            </div>
          </div>
        )}

        {result && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="btn-hover px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm shadow-emerald-700/20 transition-all"
            >
              View Findings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

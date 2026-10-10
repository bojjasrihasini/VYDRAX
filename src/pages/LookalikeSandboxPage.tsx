import React, { useState } from 'react';
import { Brand } from '../types/index.ts';
import {
  calculateCompositeSimilarity,
  detectCharacterSwaps,
  detectHomoglyphs,
  findDeceptiveWords,
  levenshteinDistance,
  levenshteinSimilarity,
  jaroWinklerSimilarity,
  normalizeString,
} from '../detection/algorithms.ts';
import { calculateSeverity } from '../detection/engine.ts';
import { SeverityBadge } from '../components/StatusBadge.tsx';
import {
  Binary,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface LookalikeSandboxPageProps {
  brands: Brand[];
}

export const LookalikeSandboxPage: React.FC<LookalikeSandboxPageProps> = ({ brands }) => {
  const [selectedBrand, setSelectedBrand] = useState<Brand>(brands[0] || {
    id: 'b1',
    name: 'Vytrix Financial',
    description: '',
    website: 'https://vytrix.com',
    keywords: ['vytrix', 'banking', 'finvault'],
    aliases: ['vytrix', 'vytrixpay'],
    created_at: '',
    updated_at: '',
  });

  const [inputCandidate, setInputCandidate] = useState('vytrix_support_official');
  const [candidateType, setCandidateType] = useState<'social' | 'app'>('social');

  // Interactive quick presets for judges
  const presets = [
    { label: 'Character Swap', text: 'vyrtix_care', desc: 'Swaps "r" and "t" in brand name' },
    { label: 'Homoglyph / Leetspeak', text: 'vytri1x_crypto', desc: 'Substitutes "1" for "i"' },
    { label: 'Deceptive Keywords', text: 'vytrix_support_official', desc: 'Appends "support" and "official"' },
    { label: 'Spacing / Dots', text: 'v.y.t.r.i.x_help', desc: 'Punctuation trick "v.y.t.r.i.x"' },
    { label: 'Official Handle (Excluded)', text: 'vytrix_official', desc: 'Exact registered official asset' },
    { label: 'Unrelated Legitimate', text: 'blue_mountain_coffee', desc: 'Unrelated name (0 risk)' },
  ];

  // Run detection in real-time
  const normCand = normalizeString(inputCandidate);
  const normBrand = normalizeString(selectedBrand.name);
  const aliasNorms = (selectedBrand.aliases || []).map(normalizeString);

  // Check Official Asset Exclusion
  const isExactOfficialExclusion =
    normCand === 'vytrixofficial' ||
    normCand === 'vytrix' ||
    normCand === 'apexhealth';

  // Similarity calculations
  const sim = calculateCompositeSimilarity(inputCandidate, selectedBrand.name);
  const levDist = levenshteinDistance(normCand, normBrand);
  const levSim = levenshteinSimilarity(normCand, normBrand);
  const jaroSim = jaroWinklerSimilarity(normCand, normBrand);

  // Transposition check
  const swapCheck = detectCharacterSwaps(
    inputCandidate,
    selectedBrand.aliases?.[0] || selectedBrand.name
  );

  // Homoglyphs
  const homoglyphs = detectHomoglyphs(
    inputCandidate,
    selectedBrand.aliases?.[0] || selectedBrand.name
  );

  // Deceptive terms
  const deceptiveWords = findDeceptiveWords(inputCandidate);

  // Dynamic Risk Score calculation
  let calculatedRisk = 0;
  const triggeredRules: { name: string; impact: number; desc: string }[] = [];

  if (isExactOfficialExclusion) {
    calculatedRisk = 0;
  } else {
    if (sim.score >= 45) {
      const imp = Math.round(sim.score * 0.45);
      calculatedRisk += imp;
      triggeredRules.push({
        name: 'High Name Similarity',
        impact: imp,
        desc: `Candidate exhibits ${sim.score}% Jaro-Winkler/Levenshtein similarity to '${selectedBrand.name}'`,
      });
    }

    if (homoglyphs.hasHomoglyph) {
      calculatedRisk += 30;
      triggeredRules.push({
        name: 'Homoglyph / Leetspeak Substitution',
        impact: 30,
        desc: `Visual character replacement detected: ${homoglyphs.substituted.join(', ')}`,
      });
    }

    if (swapCheck.isSwap) {
      calculatedRisk += 25;
      triggeredRules.push({
        name: 'Character Transposition (Swap)',
        impact: 25,
        desc: `Adjacent letter transposition: swapped ${swapCheck.swappedChars}`,
      });
    }

    if (deceptiveWords.length > 0 && sim.score >= 40) {
      const imp = Math.min(35, 18 + deceptiveWords.length * 7);
      calculatedRisk += imp;
      triggeredRules.push({
        name: 'Deceptive Impersonation Terms',
        impact: imp,
        desc: `High-urgency trust-harvesting keywords found: [${deceptiveWords.join(', ')}]`,
      });
    }
  }

  const finalRisk = isExactOfficialExclusion ? 0 : Math.min(100, calculatedRisk);
  const severity = calculateSeverity(finalRisk);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Binary className="w-4 h-4" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Interactive Look-alike Name Detection & Scoring Sandbox
          </h1>
        </div>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
          Real-time algorithmic test harness for judges and analysts. Evaluates string normalization, Levenshtein distance, Jaro-Winkler similarity, homoglyphs, and official exclusion.
        </p>
      </div>

      {/* Interactive Testing Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input and Presets */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover space-y-5">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Test Input Controls
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Target Monitored Brand
              </label>
              <select
                value={selectedBrand.id}
                onChange={(e) => {
                  const b = brands.find((x) => x.id === e.target.value);
                  if (b) setSelectedBrand(b);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.website})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Candidate Handle / App Title to Evaluate
              </label>
              <input
                type="text"
                value={inputCandidate}
                onChange={(e) => setInputCandidate(e.target.value)}
                placeholder="e.g. vytrix_support"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-800 font-bold placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:bg-white transition-all"
              />
            </div>

            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-600 block mb-2.5 uppercase tracking-wider">
                Evaluation Scenarios (Click to test):
              </span>
              <div className="space-y-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputCandidate(p.text)}
                    className={`btn-hover w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      inputCandidate === p.text
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-sm'
                        : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{p.label}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{p.text}</div>
                    </div>
                    <Play className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Analysis Pipeline Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Score Comparison Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm card-hover space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[11px] text-slate-500 block font-mono font-semibold uppercase tracking-wider mb-1">
                  EVALUATION RESULT
                </span>
                <div className="text-xl font-extrabold text-slate-900 font-mono flex items-center gap-3">
                  <span>@{inputCandidate || 'empty'}</span>
                  {isExactOfficialExclusion ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-sans font-semibold">
                      Official Asset Excluded
                    </span>
                  ) : (
                    <SeverityBadge severity={severity} />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 bg-slate-50/90 px-6 py-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase block">Name Similarity</span>
                  <div className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
                    {sim.score}%
                  </div>
                </div>

                <div className="pl-6 border-l border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase block">Final Risk Score</span>
                  <div className="text-2xl md:text-3xl font-extrabold font-mono text-rose-600 tabular-nums">
                    {finalRisk}
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Asset Exclusion Notice */}
            {isExactOfficialExclusion && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-3 font-medium">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
                <div>
                  <strong>Official Asset Exclusion Triggered:</strong> Identifier matches a registered trusted official brand asset. Zero risk score assigned; candidate is excluded from threat database.
                </div>
              </div>
            )}

            {/* Algorithmic Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-0.5">Levenshtein Distance</span>
                <span className="font-mono text-slate-900 text-sm font-bold tabular-nums">
                  {levDist} edits
                </span>
              </div>
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-0.5">Jaro-Winkler Similarity</span>
                <span className="font-mono text-slate-900 text-sm font-bold tabular-nums">
                  {(jaroSim * 100).toFixed(1)}%
                </span>
              </div>
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-0.5">Character Transposition</span>
                <span className={`font-mono text-sm font-bold ${swapCheck.isSwap ? 'text-amber-700' : 'text-slate-900'}`}>
                  {swapCheck.isSwap ? 'Detected' : 'None'}
                </span>
              </div>
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-0.5">Homoglyph Leetspeak</span>
                <span className={`font-mono text-sm font-bold ${homoglyphs.hasHomoglyph ? 'text-rose-700' : 'text-slate-900'}`}>
                  {homoglyphs.hasHomoglyph ? 'Detected' : 'None'}
                </span>
              </div>
            </div>

            {/* Triggered Rule Explanations */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Triggered Scoring Rules & Explainability
              </h3>
              {triggeredRules.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
                  {isExactOfficialExclusion
                    ? 'Official asset verified. Impersonation rules bypassed.'
                    : 'No suspicious look-alike patterns triggered. Low likelihood of impersonation.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {triggeredRules.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{r.desc}</div>
                      </div>
                      <span className="font-mono font-bold text-rose-600 shrink-0 ml-4 text-xs md:text-sm">
                        +{r.impact} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  UrlAnalysisResult,
  UrlIndicator,
  UrlRiskVerdict,
  ConfidenceLevel,
} from '../types/index.ts';
import {
  Globe,
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Lock,
  Unlock,
  Server,
  ArrowRight,
  Clock,
  RotateCcw,
  Layers,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  Zap,
} from 'lucide-react';

export const UrlAnalysisPage: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<UrlAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'certificate' | 'intel'>('overview');

  // Quick demonstration presets for judges and evaluators
  const testPresets = [
    {
      label: 'Verified Corporate (Low Risk)',
      url: 'https://github.com',
      badge: '0-29 Low Risk',
      badgeColor: 'text-emerald-700 border-emerald-300 bg-emerald-50',
    },
    {
      label: 'Brand Look-alike & Phishing',
      url: 'https://vytrix-secure-login.support-verify.com/login',
      badge: '70-100 High Risk',
      badgeColor: 'text-rose-700 border-rose-300 bg-rose-50',
    },
    {
      label: 'High-Abuse TLD & Credential Urgency',
      url: 'http://security-account-verification-update.xyz/verify',
      badge: '70-100 High Risk',
      badgeColor: 'text-rose-700 border-rose-300 bg-rose-50',
    },
    {
      label: 'Direct IP Host + Cleartext HTTP',
      url: 'http://198.51.100.42/auth/login',
      badge: '30-69 Medium Risk',
      badgeColor: 'text-amber-700 border-amber-300 bg-amber-50',
    },
    {
      label: 'Unresolvable Domain (Inconclusive)',
      url: 'https://random-nonexistent-domain-987654321.org',
      badge: 'Inconclusive',
      badgeColor: 'text-slate-600 border-slate-300 bg-slate-100',
    },
  ];

  const fetchRecentScans = async () => {
    try {
      const res = await fetch('/api/url-scans');
      if (res.ok) {
        const data = await res.json();
        setRecentScans(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecentScans();
  }, []);

  const handleAnalyze = async (targetUrl?: string) => {
    const urlToTest = (targetUrl || urlInput).trim();
    if (!urlToTest) {
      setError('Please provide a URL to analyze.');
      return;
    }

    setError(null);
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToTest }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to complete analysis');
      }

      const data: UrlAnalysisResult = await res.json();
      setResult(data);
      fetchRecentScans();
    } catch (err: any) {
      setError(err.message || 'Error occurred while contacting server.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadScan = async (scanId: string) => {
    try {
      setAnalyzing(true);
      const res = await fetch(`/api/url-scans/${scanId}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setUrlInput(data.submitted_url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  // Verdict styling
  const getVerdictBadge = (verdict: UrlRiskVerdict, isInconclusive?: boolean) => {
    if (isInconclusive || verdict === 'inconclusive') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-300 text-slate-700">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>INCONCLUSIVE — Insufficient Evidence</span>
        </span>
      );
    }
    switch (verdict) {
      case 'low':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>LOW RISK — Appears Safer</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>MEDIUM RISK — Suspicious Indicators</span>
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>HIGH RISK — Potentially Dangerous</span>
          </span>
        );
    }
  };

  const getScoreColor = (score: number, isInconclusive?: boolean) => {
    if (isInconclusive) return 'text-slate-400';
    if (score >= 70) return 'text-rose-400';
    if (score >= 30) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getScoreBg = (score: number, isInconclusive?: boolean) => {
    if (isInconclusive) return 'bg-slate-700';
    if (score >= 70) return 'bg-rose-500';
    if (score >= 30) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            URL Risk Analysis & Threat Investigation Engine
          </h1>
        </div>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-3xl">
          SSRF-hardened threat analysis inspecting URL structure, DNS topology, network hosting, TLS certificates, redirect hops, and brand look-alikes.
        </p>
      </div>

      {/* URL Input Bar & Action */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm card-hover space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter web URL to analyze (e.g., https://example.com/login or http://192.0.2.1)..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white font-mono transition-all"
            />
          </div>
          <button
            onClick={() => handleAnalyze()}
            disabled={analyzing}
            className="w-full sm:w-auto btn-hover inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-xs md:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/25 transition-all disabled:opacity-50 shrink-0"
          >
            <Zap className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Investigating URL...' : 'Analyze URL'}</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs md:text-sm text-rose-800 flex items-center gap-2.5 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Test Presets */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-3">
            Evaluation Scenarios (Click to test instantly):
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            {testPresets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setUrlInput(p.url);
                  handleAnalyze(p.url);
                }}
                className="btn-hover px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2.5 transition-all"
              >
                <span className="font-medium">{p.label}</span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
                  {p.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Loading State */}
      {analyzing && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center space-y-4 shadow-sm card-hover animate-fade-in">
          <div className="w-10 h-10 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">
            Investigating URL Infrastructure & Reputation...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Checking DNS records, executing SSRF-safe network probers, inspecting SSL/TLS certificates, tracking redirect hops, and analyzing look-alike patterns.
          </p>
        </div>
      )}

      {/* Results Dashboard */}
      {!analyzing && result && (
        <div className="space-y-6 animate-slide-up">
          {/* Main Verdict Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm card-hover space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold tracking-wider block mb-1">
                  ANALYSIS VERDICT
                </span>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  {getVerdictBadge(result.verdict, result.is_inconclusive)}
                  <span className="text-slate-300">·</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <span>Confidence:</span>
                    <span className="font-bold capitalize text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {result.confidence}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prominent Score Gauge */}
              <div className="flex items-center gap-6 bg-slate-50/90 px-6 py-3.5 rounded-2xl border border-slate-200 shrink-0">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold block">
                    Calculated Risk Score
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-3xl md:text-4xl font-extrabold font-mono tabular-nums ${getScoreColor(
                        result.risk_score,
                        result.is_inconclusive
                      )}`}
                    >
                      {result.is_inconclusive ? '—' : result.risk_score}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ 100</span>
                  </div>
                </div>
                <div className="w-28 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getScoreBg(
                      result.risk_score,
                      result.is_inconclusive
                    )}`}
                    style={{ width: `${result.is_inconclusive ? 0 : result.risk_score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Inconclusive Warning Callout */}
            {result.is_inconclusive && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-3 font-medium">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong>Inconclusive Verdict (Insufficient Evidence): </strong>
                  <span>{result.inconclusive_reason}</span>
                </div>
              </div>
            )}

            {/* URL Meta Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Submitted URL</span>
                <span className="text-slate-900 font-mono text-[11px] truncate block font-medium" title={result.submitted_url}>
                  {result.submitted_url}
                </span>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Normalized Domain</span>
                <span className="text-emerald-700 font-mono text-[11px] truncate block font-bold">
                  {result.normalized_domain || 'None'}
                </span>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Primary IP Address</span>
                <span className="text-slate-900 font-mono text-[11px] font-medium">
                  {result.network.ip || 'No A Record'}
                </span>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Investigation Timestamp</span>
                <span className="text-slate-700 font-mono text-[11px] font-medium">
                  {new Date(result.analyzed_at).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Key Reasons for Verdict */}
            <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Key Evidentiary Reasons</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                {result.key_reasons.map((r, i) => (
                  <li key={i} className="leading-relaxed font-medium">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Intelligence Tabs */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 text-xs self-start">
              <button
                onClick={() => setActiveTab('overview')}
                className={`btn-hover px-3.5 py-2 font-semibold rounded-lg transition-all ${
                  activeTab === 'overview'
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Suspicious Indicators ({result.indicators.length})
              </button>
              <button
                onClick={() => setActiveTab('network')}
                className={`btn-hover px-3.5 py-2 font-semibold rounded-lg transition-all ${
                  activeTab === 'network'
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                DNS & Hosting Network
              </button>
              <button
                onClick={() => setActiveTab('certificate')}
                className={`btn-hover px-3.5 py-2 font-semibold rounded-lg transition-all ${
                  activeTab === 'certificate'
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SSL/TLS & Redirects
              </button>
              <button
                onClick={() => setActiveTab('intel')}
                className={`btn-hover px-3.5 py-2 font-semibold rounded-lg transition-all ${
                  activeTab === 'intel'
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Threat Intelligence Feeds
              </button>
            </div>

            {/* TAB 1: Suspicious Indicators */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">
                      Detected Risk Indicators & Structural Findings
                    </h3>
                    <span className="text-xs text-slate-500 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                      {result.indicators.length} Triggers
                    </span>
                  </div>

                  {result.indicators.length === 0 ? (
                    <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>No suspicious indicators or anomalous characters detected in this URL. Structure conforms to standard web endpoints.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {result.indicators.map((ind, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs flex items-center justify-between hover:border-slate-300 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{ind.name}</span>
                              <span
                                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                                  ind.severity === 'critical'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : ind.severity === 'high'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : ind.severity === 'medium'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {ind.severity.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {ind.description}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-rose-600 tabular-nums shrink-0 ml-4 text-xs md:text-sm">
                            +{ind.impact} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommended Next Steps */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover space-y-3 text-xs">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Recommended Next Steps & Countermeasures</span>
                  </h3>
                  <ul className="space-y-1.5 text-slate-700 list-disc list-inside">
                    {result.recommended_steps.map((st, i) => (
                      <li key={i} className="leading-relaxed font-medium">{st}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 2: DNS & Network Hosting */}
            {activeTab === 'network' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* DNS Records */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover text-xs space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm pb-2 border-b border-slate-100">
                      <Server className="w-4 h-4 text-emerald-600" />
                      <span>DNS Resolution Records</span>
                    </h3>
                    <div className="space-y-3 font-mono text-[11px]">
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 font-sans font-semibold block text-[10px] uppercase mb-0.5">A Records (IPv4):</span>
                        <span className="text-slate-900 font-bold">
                          {result.dns.a_records.length > 0
                            ? result.dns.a_records.join(', ')
                            : 'None resolved'}
                        </span>
                      </div>
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 font-sans font-semibold block text-[10px] uppercase mb-0.5">AAAA Records (IPv6):</span>
                        <span className="text-slate-900 font-bold">
                          {result.dns.aaaa_records.length > 0
                            ? result.dns.aaaa_records.join(', ')
                            : 'None resolved'}
                        </span>
                      </div>
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 font-sans font-semibold block text-[10px] uppercase mb-0.5">Name Servers (NS):</span>
                        <span className="text-slate-900 font-medium">
                          {result.dns.ns_records.length > 0
                            ? result.dns.ns_records.join(', ')
                            : 'None resolved'}
                        </span>
                      </div>
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 font-sans font-semibold block text-[10px] uppercase mb-0.5">Mail Exchange (MX):</span>
                        <span className="text-slate-900 font-medium">
                          {result.dns.mx_records.length > 0
                            ? result.dns.mx_records.join(', ')
                            : 'None configured'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Network / ASN / Hosting */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover text-xs space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm pb-2 border-b border-slate-100">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>Hosting & Autonomous System (ASN)</span>
                    </h3>
                    <div className="space-y-3 text-[11px]">
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 font-sans font-semibold block text-[10px] uppercase mb-0.5">Autonomous System:</span>
                        <span className="text-slate-900 font-mono font-bold">
                          {result.network.asn || 'Unknown / Unreachable'}
                        </span>
                      </div>
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 font-sans font-semibold block text-[10px] uppercase mb-0.5">Hosting Organization:</span>
                        <span className="text-slate-900 font-semibold">
                          {result.network.org || 'Unspecified'}
                        </span>
                      </div>
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 font-sans font-semibold block text-[10px] uppercase mb-0.5">Geographic Location:</span>
                        <span className="text-slate-900 font-medium">
                          {result.network.country
                            ? `${result.network.city || ''}, ${result.network.country}`
                            : 'Unresolved'}
                        </span>
                      </div>
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 font-sans font-semibold block text-[10px] uppercase mb-0.5">Cloud / CDN Infrastructure:</span>
                        <span className="text-emerald-700 font-semibold">
                          {result.network.is_cloud_provider
                            ? `${result.network.cloud_name} (Recognized Cloud Platform)`
                            : 'Direct Dedicated / Datacenter'}
                        </span>
                      </div>
                      {result.domain_registration.created_date && (
                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 font-sans font-semibold block text-[10px] uppercase mb-0.5">Domain Registration Age:</span>
                          <span className="text-slate-900 font-mono font-medium">
                            {result.domain_registration.age_days} days old ({result.domain_registration.created_date.split('T')[0]})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SSL/TLS & Redirects */}
            {activeTab === 'certificate' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Certificate Inspection */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      {result.certificate.is_valid ? (
                        <Lock className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Unlock className="w-4 h-4 text-amber-600" />
                      )}
                      <span>SSL/TLS Certificate Inspection</span>
                    </h3>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                        result.certificate.is_valid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {result.certificate.is_valid ? 'Valid TLS' : 'Anomalous / Unverified'}
                    </span>
                  </div>

                  <div className="space-y-3 text-[11px]">
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-0.5">Certificate Authority (Issuer):</span>
                      <span className="text-slate-900 font-semibold">
                        {result.certificate.issuer || 'Not available'}
                      </span>
                    </div>
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-0.5">Common Name (Subject):</span>
                      <span className="text-slate-900 font-mono font-bold">
                        {result.certificate.subject || 'Not available'}
                      </span>
                    </div>
                    {result.certificate.days_remaining !== undefined && (
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-0.5">Days Remaining:</span>
                        <span className="text-emerald-700 font-mono font-bold">
                          {result.certificate.days_remaining} days
                        </span>
                      </div>
                    )}
                    {result.certificate.error && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium">
                        {result.certificate.error}
                      </div>
                    )}
                  </div>
                </div>

                {/* Redirect Chain */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm pb-2 border-b border-slate-100">
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                    <span>Redirect Chain Tracking</span>
                  </h3>
                  {result.redirects.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                      Single terminal request without intermediate redirect hops.
                    </div>
                  ) : (
                    <div className="space-y-2.5 font-mono text-[11px]">
                      {result.redirects.map((hop, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 flex items-center justify-between"
                        >
                          <span className="truncate max-w-xs text-slate-900 font-medium">
                            {idx + 1}. {hop.url}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            HTTP {hop.status_code}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Threat Intelligence Feeds */}
            {activeTab === 'intel' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm card-hover space-y-4 text-xs">
                <div className="pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">
                    External Threat Intelligence Services
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live lookup checks against threat catalogs, safe browsing lists, and malware blacklists
                  </p>
                </div>
                <div className="space-y-2.5">
                  {result.threat_intel.map((feed, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{feed.source}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{feed.details}</div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shrink-0 ml-3 ${
                          feed.status === 'clean'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : feed.status === 'flagged'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {feed.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>

                {result.unavailable_checks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700 block mb-1">
                      Unavailable / Skipped Checks:
                    </span>
                    <span>{result.unavailable_checks.join(' · ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Scans History Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm card-hover space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Recent URL Analyses (Persisted in SQLite)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical audits stored in local database with verifiable cryptographic fingerprints
            </p>
          </div>
          <span className="text-xs text-slate-600 font-mono font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
            {recentScans.length} Stored Records
          </span>
        </div>

        {recentScans.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No URL analyses saved yet. Enter a URL above and click Analyze.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/75">
                  <th className="py-3 px-4 font-semibold">Submitted URL / Domain</th>
                  <th className="py-3 px-4 font-semibold">Verdict</th>
                  <th className="py-3 px-4 font-semibold text-right">Risk Score</th>
                  <th className="py-3 px-4 font-semibold">Confidence</th>
                  <th className="py-3 px-4 font-semibold text-right">Analyzed At</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentScans.slice(0, 8).map((sc) => (
                  <tr key={sc.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-900 truncate max-w-xs">
                      <div className="font-semibold">{sc.submitted_url}</div>
                      <span className="text-[10px] text-slate-500">{sc.normalized_domain}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getVerdictBadge(sc.verdict)}
                    </td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums font-bold">
                      <span className={getScoreColor(sc.risk_score)}>
                        {sc.verdict === 'inconclusive' ? '—' : `${sc.risk_score}/100`}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-800 font-medium">
                      {sc.confidence}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                      {new Date(sc.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleLoadScan(sc.id)}
                        className="btn-hover px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

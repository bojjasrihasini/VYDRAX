import React, { useState, useEffect } from 'react';
import { Finding, FindingStatus, InvestigationNote, StatusHistoryItem } from '../types/index.ts';
import { SeverityBadge, StatusBadge } from './StatusBadge.tsx';
import {
  X,
  ExternalLink,
  ShieldAlert,
  Send,
  FileText,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface EvidenceDrawerProps {
  findingId: string | null;
  onClose: () => void;
  onOpenTakedown: (finding: Finding) => void;
  onFindingUpdated: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  findingId,
  onClose,
  onOpenTakedown,
  onFindingUpdated,
}) => {
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<FindingStatus>('new');
  const [statusReason, setStatusReason] = useState('');

  const fetchDetails = async () => {
    if (!findingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/findings/${findingId}`);
      if (res.ok) {
        const data = await res.json();
        setFinding(data);
        setSelectedStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to load finding details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [findingId]);

  if (!findingId) return null;

  const handleUpdateStatus = async () => {
    if (!finding) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/findings/${finding.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          changed_by: 'SecOps Analyst',
          reason: statusReason || 'Status updated during case triage',
        }),
      });
      if (res.ok) {
        setStatusReason('');
        await fetchDetails();
        onFindingUpdated();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finding || !newNote.trim()) return;

    try {
      const res = await fetch(`/api/findings/${finding.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'SecOps Analyst',
          note: newNote.trim(),
        }),
      });
      if (res.ok) {
        setNewNote('');
        fetchDetails();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-400">{finding?.id}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-semibold text-emerald-700">{finding?.platform}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Threat Dossier: {finding?.target_name || 'Loading...'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !finding ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-medium">
            Loading investigation records...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Score & Status Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">Risk Score</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold font-mono text-rose-600 tabular-nums">
                    {finding.risk_score}
                  </span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">Severity</span>
                <SeverityBadge severity={finding.severity} />
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">Name Similarity</span>
                <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                  {finding.name_similarity}%
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1 uppercase tracking-wider">Case Status</span>
                <StatusBadge status={finding.status} />
              </div>
            </div>

            {/* Target Information & Link */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Candidate Target Information
                </span>
                <a
                  href={finding.target_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Open Listing</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Identifier / Handle</span>
                  <span className="text-slate-900 font-mono font-bold">{finding.target_identifier}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Associated Protected Brand</span>
                  <span className="text-slate-800 font-semibold">{finding.brand_name || 'Vytrix Financial'}</span>
                </div>
                {finding.developer_name && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[11px] font-medium">Reported Publisher / Developer</span>
                    <span className="text-amber-800 font-mono font-semibold flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {finding.developer_name} (Mismatch with Official Developer)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Side-by-Side Official Asset Exclusion Verification */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Official Asset Exclusion Verification</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider mb-1">
                    Registered Official Asset
                  </span>
                  <p className="text-slate-800 font-mono font-semibold text-xs">
                    Brand: {finding.brand_name}
                  </p>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Protected handles & package IDs verified by SecOps Lead.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200">
                  <span className="text-[10px] text-rose-800 font-bold block uppercase tracking-wider mb-1">
                    Candidate Impersonator
                  </span>
                  <p className="text-rose-900 font-mono font-bold text-xs">
                    {finding.target_identifier}
                  </p>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Not registered in trusted repository; similarity triggers threat threshold.
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence Factor Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Algorithmic Detection Evidence</span>
                <span className="text-xs text-slate-500 font-normal">
                  {finding.evidence?.length || 0} Triggers Identified
                </span>
              </h3>
              <div className="space-y-2">
                {finding.evidence?.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ev.title}</span>
                      <span className="font-mono text-rose-600 font-bold">
                        +{ev.score_impact} pts
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {ev.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Next Action & Takedown CTA */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Recommended Response Directive</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {finding.recommended_action}
              </p>
              <button
                onClick={() => onOpenTakedown(finding)}
                className="btn-hover inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/20 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Takedown Notice</span>
              </button>
            </div>

            {/* Status Transition Control */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900">
                Update Case Status
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {(['new', 'investigating', 'resolved', 'false_positive'] as FindingStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStatus(st)}
                      className={`btn-hover px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                        selectedStatus === st
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
              <input
                type="text"
                placeholder="Status change justification or reason..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
              />
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus || selectedStatus === finding.status}
                className="btn-hover px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Commit Status Transition'}
              </button>
            </div>

            {/* Investigation Notes & Audit Log */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Analyst Notes & Audit Log</span>
                <span className="text-xs text-slate-500 font-normal font-mono">
                  {finding.notes?.length || 0} Notes · {finding.history?.length || 0} Events
                </span>
              </h3>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Record investigation findings or ticket ID..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="btn-hover px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-2 pt-1">
                {finding.notes?.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-slate-800 font-semibold">
                        <User className="w-3 h-3 text-emerald-600" />
                        {n.author}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">{n.note}</p>
                  </div>
                ))}

                {/* Status History Audit */}
                {finding.history?.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Status altered from <strong className="text-slate-800 font-semibold">{h.old_status}</strong> to{' '}
                      <strong className="text-emerald-700 font-bold">{h.new_status}</strong> by {h.changed_by}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(h.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

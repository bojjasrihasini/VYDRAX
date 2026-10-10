import React, { useState } from 'react';
import { Finding } from '../types/index.ts';
import { X, Copy, Check, ShieldAlert } from 'lucide-react';

interface TakedownModalProps {
  finding: Finding | null;
  onClose: () => void;
}

export const TakedownModal: React.FC<TakedownModalProps> = ({ finding, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!finding) return null;

  const getRecipientEmail = () => {
    switch (finding.platform) {
      case 'Instagram':
        return 'ip@instagram.com / Meta Intellectual Property Operations';
      case 'X':
        return 'copyright@x.com / X Trust & Safety Impersonation Desk';
      case 'Google Play Store':
        return 'googleplay-developer-support@google.com / Google Trademark Enforcement';
      case 'Apple App Store':
        return 'appdeveloper@apple.com / App Store Legal Disputes';
      default:
        return 'abuse@domain-registrar.net / Platform Legal Department';
    }
  };

  const takedownText = `FORMAL NOTICE OF TRADEMARK INFRINGEMENT & DECEPTIVE IMPERSONATION

DATE: ${new Date().toUTCString()}
TARGET PLATFORM: ${finding.platform}
REPORTED INFRACTION: Unauthorized Brand Impersonation & Digital Asset Mimicry
SEVERITY LEVEL: ${finding.severity.toUpperCase()} (Risk Score: ${finding.risk_score}/100)

1. TRADEMARK HOLDER IDENTIFICATION:
- Protected Brand: ${finding.brand_name || 'Vytrix Financial'}
- Entity Representative: Vytrix Digital Risk Protection Operations (SecOps)

2. INFRINGING ASSET DETAILS:
- Asset Type: ${finding.candidate_type === 'social' ? 'Social Media Profile' : 'Mobile Application Listing'}
- Displayed Title / Handle: ${finding.target_name} (${finding.target_identifier})
- Direct Listing URL: ${finding.target_url}
${finding.developer_name ? `- Reported Developer / Publisher: ${finding.developer_name} (UNAUTHORIZED MISMATCH)` : ''}

3. TECHNICAL EVIDENCE & CONFUSION ANALYSIS:
${finding.evidence.map((e, idx) => `  [Evidence ${idx + 1}] ${e.title}: ${e.description} (Score Impact: +${e.score_impact})`).join('\n')}
- String Similarity to Protected Mark: ${finding.name_similarity}%
${finding.publisher_mismatch ? '- Status: Confirmed Developer Publisher Mismatch without authorized license.\n' : ''}

4. REQUESTED ACTION:
Under applicable trademark protection, unfair competition statutes, and platform Terms of Service prohibiting brand mimicry and credential deception, we formally demand:
- Immediate suspension or de-indexing of ${finding.target_identifier} (${finding.target_url})
- Revocation of publishing privileges for associated unverified publisher credentials
- Preservation of access logs and subscriber metadata for legal record

Submitted via VYTRIX Digital Risk Protection Takedown Dispatcher.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(takedownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">
              Expedited Takedown Package Generator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Target Recipient: </span>
            <span className="text-emerald-800 font-mono font-semibold">{getRecipientEmail()}</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Legal Abuse Notice & Evidentiary Brief
            </label>
            <textarea
              readOnly
              value={takedownText}
              rows={14}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none select-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/40">
          <span className="text-xs text-slate-500">
            Pre-formatted legal packet ready for dispatch.
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="btn-hover inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/20 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Takedown Packet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

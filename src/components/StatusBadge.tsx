import React from 'react';
import { SeverityLevel, FindingStatus } from '../types/index.ts';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  score?: number;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, score }) => {
  const getStyles = () => {
    switch (severity) {
      case 'critical':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'high':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStyles()} whitespace-nowrap shrink-0`}
    >
      <span className="capitalize">{severity}</span>
      {score !== undefined && (
        <span className="font-mono tabular-nums text-slate-500 font-normal">
          ({score}/100)
        </span>
      )}
    </span>
  );
};

interface StatusBadgeProps {
  status: FindingStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'new':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 border border-blue-200 text-blue-700 whitespace-nowrap shrink-0">
          New Alert
        </span>
      );
    case 'investigating':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 border border-amber-200 text-amber-700 whitespace-nowrap shrink-0">
          Investigating
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 whitespace-nowrap shrink-0">
          Resolved / Takedown
        </span>
      );
    case 'false_positive':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 border border-slate-200 text-slate-600 whitespace-nowrap shrink-0">
          False Positive
        </span>
      );
    default:
      return null;
  }
};

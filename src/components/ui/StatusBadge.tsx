import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'REVIEW' | 'HIGH' | 'FAIL';

interface StatusBadgeProps {
  status: RiskLevel | string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const norm = String(status).toUpperCase();

  if (norm === 'SAFE' || norm === 'LOW' || norm === 'GREEN' || norm === 'PASS') {
    return (
      <span
        title="Potentially safe based on detected signals. Manual review recommended before submission."
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        {showLabel && <span>LOW RISK</span>}
      </span>
    );
  }

  if (norm === 'MEDIUM' || norm === 'REVIEW' || norm === 'YELLOW' || norm === 'WARNING') {
    return (
      <span
        title="Potential issue detected. Manual review recommended before submission."
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        {showLabel && <span>REVIEW</span>}
      </span>
    );
  }

  return (
    <span
      title="Potential IP/compliance issue detected. Review and sanitize before submission."
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
      {showLabel && <span>HIGH RISK</span>}
    </span>
  );
};

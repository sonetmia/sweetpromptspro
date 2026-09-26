import React from 'react';
import { 
  Check, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { findIPRisks } from '../../lib/adobe-stock/ipRules';

interface CompliancePanelProps {
  promptText: string;
  titleText?: string;
  keywordsText?: string;
  similarityScore?: number;
  className?: string;
  compact?: boolean;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({
  promptText,
  titleText = '',
  keywordsText = '',
  similarityScore = 100,
  className = '',
  compact = false,
}) => {
  const combined = `${promptText} ${titleText} ${keywordsText}`.toLowerCase();
  const risks = findIPRisks(combined);

  // Individual signal evaluations
  const hasTrademark = risks.some(r => r.category === 'Brand');
  const hasArtist = risks.some(r => r.category === 'Artist Style');
  const hasCharacter = risks.some(r => r.category === 'Fictional Character' || r.category === 'Celebrity');
  const hasCopyright = risks.some(r => r.category === 'Franchise' || r.category === 'Protected Property');
  const hasBuzzwords = /\b(?:photorealistic|hyperrealistic|8k|4k|masterpiece|trending on artstation)\b/i.test(combined);
  const isOriginal = risks.length === 0;
  const isSimilarityOk = similarityScore >= 70;

  // Overall level
  let overallStatus: 'LOW' | 'REVIEW' | 'HIGH' = 'LOW';
  if (hasTrademark || hasCharacter || hasCopyright) {
    overallStatus = 'HIGH';
  } else if (hasArtist || hasBuzzwords || !isSimilarityOk || risks.length > 0) {
    overallStatus = 'REVIEW';
  }

  const items = [
    { label: 'Originality', ok: isOriginal, warning: false, detail: isOriginal ? 'No direct franchise or brand terms detected' : 'Creative concept needs originality review' },
    { label: 'Trademark', ok: !hasTrademark, warning: false, detail: !hasTrademark ? 'No brand or trademarked product names detected' : 'Potential trademarked commercial name flagged' },
    { label: 'Copyright', ok: !hasCopyright, warning: false, detail: !hasCopyright ? 'No protected franchises or commercial packaging' : 'Protected property reference flagged' },
    { label: 'Artist Reference', ok: !hasArtist, warning: false, detail: !hasArtist ? 'Zero living artist names or "style of" references' : 'Artist name or style imitation detected' },
    { label: 'Character Reference', ok: !hasCharacter, warning: false, detail: !hasCharacter ? 'No fictional or public celebrity characters' : 'Recognizable character or celebrity signal' },
    { label: 'Metadata Quality', ok: !hasBuzzwords, warning: false, detail: !hasBuzzwords ? 'Stock-safe photography and rendering cues' : 'Spam buzzwords detected (e.g. 8k, photorealistic)' },
    { label: 'Similarity', ok: isSimilarityOk, warning: similarityScore < 70 && similarityScore >= 50, detail: isSimilarityOk ? 'Sufficiently distinct from repetitive variations' : 'Potential duplication or batch similarity risk' },
  ];

  if (compact) {
    return (
      <div className={`p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Compliance Check</span>
          </span>
          <StatusBadge status={overallStatus} size="sm" />
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-zinc-400">
              {item.ok ? (
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : item.warning ? (
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              ) : (
                <X className="w-3 h-3 text-rose-400 shrink-0" />
              )}
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-zinc-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Compliance Check
          </h4>
        </div>
        <StatusBadge status={overallStatus} />
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed">
        {overallStatus === 'LOW' && 'Potentially safe based on detected signals. Manual review recommended.'}
        {overallStatus === 'REVIEW' && 'Potential issue detected. Manual review recommended before submission.'}
        {overallStatus === 'HIGH' && 'Potential IP/compliance issue detected. Sanitize flagged terms.'}
      </p>

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              {item.ok ? (
                <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </span>
              ) : item.warning ? (
                <span className="w-4 h-4 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5" />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                  <X className="w-2.5 h-2.5" />
                </span>
              )}
              <span className={`font-medium truncate ${item.ok ? 'text-zinc-300' : item.warning ? 'text-amber-300' : 'text-rose-300'}`}>
                {item.label}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 hidden sm:inline ml-2 truncate max-w-[220px]">
              {item.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Bookmark, 
  Wand2, 
  Layers, 
  Tag, 
  ShieldAlert, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface ResultCardData {
  id?: string;
  number?: number | string;
  title: string;
  prompt: string;
  commercialUse?: string;
  ipStatus?: 'SAFE' | 'LOW' | 'MEDIUM' | 'REVIEW' | 'HIGH';
  similarityStatus?: 'SAFE' | 'LOW' | 'MEDIUM' | 'REVIEW' | 'HIGH' | string;
  category?: string;
  cameraSetup?: string;
  lightingSetup?: string;
  copySpace?: string;
  demographics?: string;
}

interface ResultCardProps {
  data: ResultCardData;
  onCopy?: (text: string) => void;
  onSave?: (data: ResultCardData) => void;
  onImprove?: (prompt: string) => void;
  onVariations?: (prompt: string) => void;
  onMetadata?: (prompt: string, title?: string, category?: string) => void;
  onIPCheck?: (prompt: string) => void;
  className?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  data,
  onCopy,
  onSave,
  onImprove,
  onVariations,
  onMetadata,
  onIPCheck,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.prompt);
    setCopied(true);
    if (onCopy) onCopy(data.prompt);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    if (onSave) onSave(data);
    setTimeout(() => setSaved(false), 2000);
  };

  const numberDisplay = typeof data.number === 'number'
    ? String(data.number).padStart(2, '0')
    : data.number || '01';

  return (
    <div className={`p-4 sm:p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 transition-all shadow-sm space-y-3.5 ${className}`}>
      {/* Header with Number, Title, Status Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 shrink-0 mt-0.5">
            #{numberDisplay}
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-zinc-100 text-sm sm:text-base leading-snug truncate">
              {data.title || 'Commercial Stock Asset'}
            </h3>
            {data.commercialUse && (
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                <strong className="text-zinc-300">Commercial Use:</strong> {data.commercialUse}
              </p>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={data.ipStatus || 'LOW'} size="sm" />
          {data.similarityStatus && (
            <span className="hidden sm:inline-flex items-center text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              SIMILARITY: {data.similarityStatus}
            </span>
          )}
        </div>
      </div>

      {/* Prompt Block */}
      <div className="relative group">
        <div
          className={`p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80 font-mono text-xs text-zinc-200 leading-relaxed select-all ${
            !expanded ? 'line-clamp-3' : ''
          }`}
        >
          {data.prompt}
        </div>
        {data.prompt.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" /> Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> Expand Full Prompt
              </>
            )}
          </button>
        )}
      </div>

      {/* Composition / Optics details if available */}
      {(data.cameraSetup || data.lightingSetup || data.copySpace) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 pt-0.5">
          {data.cameraSetup && (
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 truncate">
              <span className="text-zinc-500 font-bold block">Optics:</span>
              <span className="text-zinc-800 dark:text-zinc-200 truncate">{data.cameraSetup}</span>
            </div>
          )}
          {data.lightingSetup && (
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 truncate">
              <span className="text-zinc-500 font-bold block">Lighting:</span>
              <span className="text-zinc-800 dark:text-zinc-200 truncate">{data.lightingSetup}</span>
            </div>
          )}
          {data.copySpace && (
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 truncate">
              <span className="text-zinc-500 font-bold block">Copy Space:</span>
              <span className="text-zinc-800 dark:text-zinc-200 truncate">{data.copySpace}</span>
            </div>
          )}
        </div>
      )}

      {/* Compact Action Buttons */}
      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/60'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                saved
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>
          )}

          {onImprove && (
            <button
              type="button"
              onClick={() => onImprove(data.prompt)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Improve</span>
            </button>
          )}

          {onVariations && (
            <button
              type="button"
              onClick={() => onVariations(data.prompt)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 border border-zinc-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Variations</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onMetadata && (
            <button
              type="button"
              onClick={() => onMetadata(data.prompt, data.title, data.category)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-emerald-950/40 hover:text-emerald-300 text-zinc-200 border border-zinc-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Metadata</span>
            </button>
          )}

          {onIPCheck && (
            <button
              type="button"
              onClick={() => onIPCheck(data.prompt)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-300 text-zinc-200 border border-zinc-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>IP Check</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

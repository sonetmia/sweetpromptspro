import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Bookmark, 
  Tag, 
  ShieldAlert, 
  RefreshCw, 
  CheckSquare, 
  Square,
  Wand2
} from 'lucide-react';
import { GeneratedStockPrompt } from '../../lib/prompt-engine/promptSchema';
import { saveLibraryItem } from '../../lib/storage/localStorage';

interface UniversalPromptResultCardProps {
  promptItem: GeneratedStockPrompt;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRegenerateSingle?: (id: string) => void;
  onSendToMetadata?: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk?: (prompt: string) => void;
  onSendToImprover?: (prompt: string) => void;
  showToast: (msg: string) => void;
}

export const UniversalPromptResultCard: React.FC<UniversalPromptResultCardProps> = ({
  promptItem,
  isSelected,
  onToggleSelect,
  onRegenerateSingle,
  onSendToMetadata,
  onSendToRisk,
  onSendToImprover,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptItem.prompt);
    setCopied(true);
    showToast('Prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveLibraryItem({
      title: `${promptItem.subject} (Prompt ${promptItem.number})`,
      prompt: promptItem.prompt,
      category: promptItem.category || 'General',
      contentType: (promptItem.contentType as any) || 'Photo',
      aspectRatio: promptItem.aspectRatio || 'Default',
      copySpace: promptItem.copySpace || promptItem.negativeSpace,
      tags: [promptItem.commercialUse, promptItem.contentType, promptItem.category].filter(Boolean),
      status: 'ready'
    });
    setSaved(true);
    showToast('Saved prompt to Stock Library');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleRegenerate = async () => {
    if (!onRegenerateSingle) return;
    setRegenerating(true);
    try {
      await onRegenerateSingle(promptItem.id);
      showToast(`Regenerated concept #${promptItem.number}`);
    } finally {
      setRegenerating(false);
    }
  };

  const numStr = String(promptItem.number).padStart(2, '0');

  // Compliance styling (muted teal for low risk, warm amber/coral for review, muted red for high risk)
  const getRiskStyle = (risk: string) => {
    if (risk === 'LOW RISK' || risk === 'SAFE' || risk === 'LOW') {
      return 'text-[#4E8793] border-[#21434B] bg-[#21434B]/20';
    }
    if (risk === 'HIGH RISK' || risk === 'REJECT' || risk === 'CRITICAL') {
      return 'text-[#C74A43] border-[#C74A43]/40 bg-[#C74A43]/15';
    }
    return 'text-[#D9672E] border-[#D9672E]/40 bg-[#D9672E]/15';
  };

  return (
    <div className={`p-4 rounded-[6px] border transition-colors ${
      isSelected
        ? 'bg-[#171E24] border-[#C74A43]'
        : 'bg-[#11161A] border-[#272D30] hover:border-[#383E41]'
    }`}>
      {/* Top row: Number, Title, Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#1F272B]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onToggleSelect(promptItem.id)}
            className="text-[#606669] hover:text-[#C74A43] cursor-pointer"
            aria-label={`Select prompt ${numStr}`}
          >
            {isSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-[#C74A43]" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>

          <span className="font-mono text-xs font-semibold text-[#8C8A86]">
            {numStr}
          </span>

          <span className="text-xs font-semibold text-[#F3EDE2] tracking-wide truncate max-w-xs">
            {promptItem.subject}
          </span>
        </div>

        {/* Status Metadata (Clean Unboxed & Muted Badges) */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[#8C8A86]">{promptItem.contentType}</span>
          <span className="text-[#383E41]">·</span>
          <span className={`px-2 py-0.5 rounded-[4px] font-mono text-[10px] font-semibold border ${getRiskStyle(promptItem.ipRisk || 'LOW RISK')}`}>
            {promptItem.ipRisk || 'LOW RISK'}
          </span>
          <span className="text-[#383E41]">·</span>
          <span className="text-[#8C8A86] font-mono text-[10px]">
            {promptItem.similarityStatus || 'DISTINCT'}
          </span>
        </div>
      </div>

      {/* Prompt Text Body */}
      <div className="bg-[#090B0D] p-3 rounded-[4px] border border-[#1C2428] mb-3">
        <p className="text-xs text-[#E8E4DC] leading-relaxed select-all font-mono">
          {promptItem.prompt}
        </p>
      </div>

      {/* Footer Controls: Clean text action links / outlined buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-2">
          {promptItem.aspectRatio && (
            <span className="text-[11px] text-[#606669] font-mono">
              AR: {promptItem.aspectRatio}
            </span>
          )}
          {promptItem.commercialUse && (
            <span className="text-[11px] text-[#606669]">
              · {promptItem.commercialUse}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-[4px] border border-[#272D30] hover:border-[#383E41] bg-[#11161A] text-[#E8E4DC] hover:text-[#F3EDE2] text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-[#4E8793]" /> : <Copy className="w-3 h-3 text-[#8C8A86]" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-2.5 py-1 rounded-[4px] border border-[#272D30] hover:border-[#383E41] bg-[#11161A] text-[#E8E4DC] hover:text-[#F3EDE2] text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Bookmark className={`w-3 h-3 ${saved ? 'text-[#C74A43]' : 'text-[#8C8A86]'}`} />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>

          {onSendToMetadata && (
            <button
              type="button"
              onClick={() => onSendToMetadata(promptItem.prompt, promptItem.subject, promptItem.category)}
              className="px-2.5 py-1 rounded-[4px] border border-[#272D30] hover:border-[#383E41] bg-[#11161A] text-[#E8E4DC] hover:text-[#F3EDE2] text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Tag className="w-3 h-3 text-[#8C8A86]" />
              <span>Metadata</span>
            </button>
          )}

          {onSendToRisk && (
            <button
              type="button"
              onClick={() => onSendToRisk(promptItem.prompt)}
              className="px-2.5 py-1 rounded-[4px] border border-[#272D30] hover:border-[#383E41] bg-[#11161A] text-[#E8E4DC] hover:text-[#F3EDE2] text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3 h-3 text-[#8C8A86]" />
              <span>IP Check</span>
            </button>
          )}

          {onRegenerateSingle && (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="p-1 rounded-[4px] border border-[#272D30] hover:border-[#383E41] text-[#8C8A86] hover:text-[#F3EDE2] transition-colors cursor-pointer disabled:opacity-50"
              title="Regenerate single prompt"
            >
              <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin text-[#C74A43]' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

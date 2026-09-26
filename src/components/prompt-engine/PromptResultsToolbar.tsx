import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  FileText, 
  FileSpreadsheet, 
  CheckSquare, 
  Square, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { GeneratedStockPrompt } from '../../lib/prompt-engine/promptSchema';
import { UniversalPromptExporter } from '../../lib/prompt-engine/promptExporter';

interface PromptResultsToolbarProps {
  prompts: GeneratedStockPrompt[];
  selectedIds: Set<string>;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  subject?: string;
  instructions?: string;
  sectionTitle?: string;
  diversityScore?: number;
  showToast: (msg: string) => void;
}

export const PromptResultsToolbar: React.FC<PromptResultsToolbarProps> = ({
  prompts,
  selectedIds,
  onToggleSelectAll,
  subject,
  instructions,
  sectionTitle = 'Prompt Studio',
  diversityScore,
  showToast,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);

  const totalCount = prompts.length;
  const selectedCount = selectedIds.size;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isSomeSelected = selectedCount > 0 && selectedCount < totalCount;

  const activeExportPrompts = selectedCount > 0
    ? prompts.filter(p => selectedIds.has(p.id))
    : prompts;

  const handleCopyAll = async () => {
    const success = await UniversalPromptExporter.copyAllToClipboard(activeExportPrompts);
    if (success) {
      setCopiedAll(true);
      showToast(`Copied ${activeExportPrompts.length} prompts to clipboard`);
      setTimeout(() => setCopiedAll(false), 2000);
    } else {
      showToast('Failed to copy to clipboard');
    }
  };

  const handleDownloadTxt = () => {
    UniversalPromptExporter.downloadTXT(activeExportPrompts, {
      subject,
      instructions,
      section: sectionTitle
    });
    showToast(`Downloaded ${activeExportPrompts.length} prompts as TXT`);
  };

  const handleDownloadCsv = () => {
    UniversalPromptExporter.downloadCSV(activeExportPrompts, {
      subject,
      instructions,
      section: sectionTitle
    });
    showToast(`Downloaded ${activeExportPrompts.length} prompts as CSV`);
  };

  return (
    <div className="space-y-2.5">
      {/* Curation Advisory Warning for Batches of 20 or 30 */}
      {totalCount >= 20 && (
        <div className="px-3.5 py-2 rounded-[6px] bg-[#10232D]/40 border border-[#21434B] flex items-start gap-2.5 text-xs text-[#E8E4DC]">
          <AlertCircle className="w-4 h-4 text-[#D9672E] shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px] text-[#8C8A86]">
            <strong className="text-[#F3EDE2]">Adobe Stock Curation Advisory:</strong> Curate and review variations before submission. Submitting large numbers of near-identical images may impact portfolio quality.
          </p>
        </div>
      )}

      {/* Main Results Bar */}
      <div className="p-3 rounded-[6px] bg-[#11161A] border border-[#272D30] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Count & Select All */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold text-[#8C8A86] hover:text-[#F3EDE2] transition-colors cursor-pointer"
            title={isAllSelected ? 'Deselect all' : 'Select all'}
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-[#C74A43]" />
            ) : isSomeSelected ? (
              <div className="w-4 h-4 rounded border border-[#C74A43] bg-[#C74A43] flex items-center justify-center text-[#F3EDE2]">
                <span className="w-2 h-0.5 bg-[#F3EDE2]"></span>
              </div>
            ) : (
              <Square className="w-4 h-4 text-[#606669]" />
            )}
            <span>Select All</span>
          </button>

          <div className="h-3.5 w-px bg-[#272D30]" />

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#F3EDE2]">
              {totalCount} {totalCount === 1 ? 'Prompt' : 'Prompts'}
            </span>

            {selectedCount > 0 && (
              <span className="font-mono text-[11px] text-[#C74A43]">
                ({selectedCount} selected)
              </span>
            )}

            {diversityScore !== undefined && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-[#4E8793]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Diversity: {diversityScore}%</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Export CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy All Button */}
          <button
            type="button"
            onClick={handleCopyAll}
            className="px-3 py-1 rounded-[4px] border border-[#272D30] hover:border-[#383E41] bg-[#090B0D] hover:bg-[#171E24] text-[#E8E4DC] hover:text-[#F3EDE2] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-[#4E8793]" /> : <Copy className="w-3.5 h-3.5 text-[#8C8A86]" />}
            <span>{copiedAll ? 'Copied' : selectedCount > 0 ? `Copy (${selectedCount})` : 'Copy All'}</span>
          </button>

          {/* Download TXT Button */}
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="px-3 py-1 rounded-[4px] border border-[#272D30] hover:border-[#383E41] bg-[#090B0D] hover:bg-[#171E24] text-[#E8E4DC] hover:text-[#F3EDE2] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#8C8A86]" />
            <span>TXT</span>
          </button>

          {/* Download CSV Button */}
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-3 py-1 rounded-[4px] bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

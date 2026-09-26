import React, { useState } from 'react';
import { 
  GeneratedStockPrompt, 
  GenerationProgress 
} from '../../lib/prompt-engine/promptSchema';
import { PromptResultsToolbar } from './PromptResultsToolbar';
import { UniversalPromptResultCard } from './UniversalPromptResultCard';
import { RefreshCw, Layers } from 'lucide-react';

interface UniversalPromptBatchViewProps {
  prompts: GeneratedStockPrompt[];
  isGenerating: boolean;
  progress?: GenerationProgress | null;
  subject?: string;
  instructions?: string;
  sectionTitle?: string;
  diversityScore?: number;
  onRegenerateBatch?: () => void;
  onRegenerateSingle?: (id: string) => void;
  onSendToMetadata?: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk?: (prompt: string) => void;
  onSendToImprover?: (prompt: string) => void;
  showToast: (msg: string) => void;
}

export const UniversalPromptBatchView: React.FC<UniversalPromptBatchViewProps> = ({
  prompts,
  isGenerating,
  progress,
  subject,
  instructions,
  sectionTitle = 'Prompt Studio',
  diversityScore,
  onRegenerateBatch,
  onRegenerateSingle,
  onSendToMetadata,
  onSendToRisk,
  onSendToImprover,
  showToast,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === prompts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prompts.map(p => p.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // 1. Loading State
  if (isGenerating) {
    const percent = progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 35;

    return (
      <div className="p-8 rounded-[6px] bg-[#11161A] border border-[#272D30] text-center space-y-4 animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-[#171E24] text-[#C74A43] flex items-center justify-center mx-auto border border-[#272D30]">
          <RefreshCw className="w-4 h-4 animate-spin" />
        </div>

        <div className="space-y-1">
          <h3 className="font-editorial text-lg text-[#F3EDE2]">
            Generating Prompts
          </h3>
          <p className="text-xs font-mono text-[#C74A43] font-semibold">
            {progress?.current ? String(progress.current).padStart(2, '0') : '00'} / {progress?.total ? String(progress.total).padStart(2, '0') : '30'}
          </p>
          <p className="text-xs text-[#8C8A86]">
            {progress?.message || 'Diversifying commercial stock prompts and checking risk guidelines...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-full h-1.5 rounded-full bg-[#171E24] overflow-hidden">
            <div 
              className="h-full bg-[#C74A43] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${Math.min(100, Math.max(10, percent))}%` }}
            />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-4 gap-1 text-[10px] pt-1 font-mono">
            {(['Analyze', 'Generate', 'Check', 'Refine'] as const).map(step => {
              const isCurrent = progress?.step === step;
              return (
                <div 
                  key={step}
                  className={`py-1 rounded-[4px] text-center transition-colors ${
                    isCurrent
                      ? 'bg-[#C74A43]/15 text-[#F3EDE2] border border-[#C74A43]/40'
                      : 'text-[#606669]'
                  }`}
                >
                  {step}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty State (Section 22: Empty states should be beautiful and minimal)
  if (!prompts || prompts.length === 0) {
    return (
      <div className="p-10 text-center rounded-[6px] bg-[#11161A] border border-[#272D30] space-y-3">
        <div className="w-10 h-10 rounded-full bg-[#171E24] text-[#606669] flex items-center justify-center mx-auto border border-[#272D30]">
          <Layers className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h3 className="font-editorial text-base text-[#F3EDE2]">
            No Prompts Generated Yet
          </h3>
          <p className="text-xs text-[#8C8A86] max-w-sm mx-auto">
            Enter your subject and instructions above, select count, and click Generate Prompts to begin.
          </p>
        </div>
      </div>
    );
  }

  // 3. Results Workspace
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Results Toolbar */}
      <PromptResultsToolbar
        prompts={prompts}
        selectedIds={selectedIds}
        onToggleSelectAll={handleToggleSelectAll}
        onClearSelection={handleClearSelection}
        subject={subject}
        instructions={instructions}
        sectionTitle={sectionTitle}
        diversityScore={diversityScore}
        showToast={showToast}
      />

      {/* Prompts Cards List */}
      <div className="space-y-3">
        {prompts.map((item) => (
          <UniversalPromptResultCard
            key={item.id}
            promptItem={item}
            isSelected={selectedIds.has(item.id)}
            onToggleSelect={handleToggleSelect}
            onRegenerateSingle={onRegenerateSingle}
            onSendToMetadata={onSendToMetadata}
            onSendToRisk={onSendToRisk}
            onSendToImprover={onSendToImprover}
            showToast={showToast}
          />
        ))}
      </div>

      {/* Bottom Re-run Toolbar */}
      {onRegenerateBatch && (
        <div className="p-3.5 rounded-[6px] bg-[#11161A] border border-[#272D30] flex items-center justify-between">
          <span className="text-xs text-[#8C8A86]">
            Need another fresh creative perspective?
          </span>

          <button
            type="button"
            onClick={onRegenerateBatch}
            className="px-3.5 py-1.5 rounded-[6px] border border-[#383E41] hover:border-[#4B5357] bg-transparent hover:bg-[#171E24] text-[#E8E4DC] hover:text-[#F3EDE2] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Regenerate Entire Batch</span>
          </button>
        </div>
      )}
    </div>
  );
};

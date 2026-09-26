import React from 'react';
import { PromptCount } from '../../lib/prompt-engine/promptSchema';
import { PromptCountSelector } from './PromptCountSelector';
import { RefreshCw, SlidersHorizontal, Layers } from 'lucide-react';

interface UniversalPromptHeaderProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  subject: string;
  onSubjectChange: (val: string) => void;
  subjectPlaceholder?: string;
  instructions: string;
  onInstructionsChange: (val: string) => void;
  instructionsPlaceholder?: string;
  count: PromptCount;
  onCountChange: (count: PromptCount) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generateButtonText?: string;
  children?: React.ReactNode; // For section-specific settings slot
}

export const UniversalPromptHeader: React.FC<UniversalPromptHeaderProps> = ({
  title,
  description,
  icon: Icon,
  subject,
  onSubjectChange,
  subjectPlaceholder = 'Enter your subject, object, concept or topic (e.g. coffee cup, senior bioengineer, sustainable solar farm)...',
  instructions,
  onInstructionsChange,
  instructionsPlaceholder = 'Add your specific instructions, visual direction, commercial purpose, composition, style or restrictions (e.g. clean isolated vector concepts with generous left copy space, no human faces)...',
  count,
  onCountChange,
  onGenerate,
  isGenerating,
  generateButtonText = 'Generate Prompts',
  children,
}) => {
  return (
    <div className="space-y-6">
      {/* Title & Description Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2.5">
          {Icon ? <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          <span>{title}</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 mt-1.5 max-w-3xl leading-relaxed">
          {description}
        </p>
      </div>

      {/* Main Unified Input Panel */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Subject & Instructions */}
          <div className="lg:col-span-7 space-y-4">
            {/* Subject Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Subject / Topic *</span>
                <span className="text-[10px] text-zinc-500 font-normal">Core commercial concept</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                placeholder={subjectPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Instructions Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Additional Instructions</span>
                <span className="text-[10px] text-zinc-500 font-normal">Visual direction, style & constraints</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => onInstructionsChange(e.target.value)}
                placeholder={instructionsPlaceholder}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* Right Column: Prompt Count & Section Settings */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            {/* Prompt Count Selector (1, 5, 10, 15, 20, 30) */}
            <PromptCountSelector
              value={count}
              onChange={onCountChange}
              disabled={isGenerating}
            />

            {/* Section-Specific Settings Slot */}
            {children && (
              <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                {children}
              </div>
            )}

            {/* Primary Generate CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating || !subject.trim()}
                className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating {count} Unique Prompts...</span>
                  </>
                ) : (
                  <span>{generateButtonText} ({count})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

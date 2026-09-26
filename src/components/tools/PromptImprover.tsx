import React, { useState } from 'react';
import { 
  Wand2, 
  RefreshCw, 
  SlidersHorizontal 
} from 'lucide-react';
import { AISettings } from '../../types';
import { 
  PromptCount, 
  GeneratedStockPrompt, 
  GenerationProgress,
  UniversalPromptGenerator 
} from '../../lib/prompt-engine';
import { PromptCountSelector } from '../prompt-engine/PromptCountSelector';
import { UniversalPromptBatchView } from '../prompt-engine/UniversalPromptBatchView';
import { saveHistoryItem } from '../../lib/storage/localStorage';

interface PromptImproverProps {
  settings: AISettings;
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk: (prompt: string) => void;
}

export const PromptImprover: React.FC<PromptImproverProps> = ({
  settings,
  showToast,
  onSendToMetadata,
  onSendToRisk,
}) => {
  const [rawPrompt, setRawPrompt] = useState('minimalist desk setup with laptop, coffee cup, and soft morning sunlight');
  const [instructions, setInstructions] = useState('Elevate into high-end editorial commercial stock: clean architectural Scandinavian workspace, natural depth of field, faceless anonymous composition, generous left copy space, zero logos');
  const [count, setCount] = useState<PromptCount>(5);

  const [focusArea, setFocusArea] = useState('Auto (Default)');
  const [contentType, setContentType] = useState<string>('Auto (Default)');

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [results, setResults] = useState<GeneratedStockPrompt[]>([]);
  const [diversityScore, setDiversityScore] = useState<number>(95);

  const focusOptions = [
    'Auto (Default)',
    'Commercial Stock & Authentic Realism',
    'Lighting, Depth & Studio Atmosphere',
    'Composition, Framing & Copy Space',
    'Diversity, Emotion & Candid Demographics',
    'Vector / Isolated Graphic Precision'
  ];

  const handleImprove = async () => {
    if (!rawPrompt.trim()) {
      showToast('Please enter an unrefined prompt to improve.');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: count, step: 'Analyze', message: 'Analyzing raw prompt and identifying stock enhancements...' });

    try {
      const combinedInstructions = `Base Raw Input: "${rawPrompt}". Improvement Focus: ${focusArea}. ${instructions ? `Additional user rules: ${instructions}. ` : ''}Transform this simple idea into ${count} polished, commercially viable, brand-safe stock prompts. Strip any generic spam words, add concrete visual lighting, framing, and clean negative space.`;

      const batchResult = await UniversalPromptGenerator.generateBatch(
        {
          subject: rawPrompt.slice(0, 80),
          instructions: combinedInstructions.trim(),
          count,
          contentType,
          commercialIntent: 'Commercial Stock Improvement',
          sectionContext: 'Prompt Improver'
        },
        {
          onProgress: (p) => setProgress(p),
          preferredModel: settings.model
        }
      );

      setResults(batchResult.prompts);
      setDiversityScore(batchResult.diversityScore);

      if (batchResult.prompts.length > 0) {
        saveHistoryItem({
          type: 'prompt',
          title: `Improved Prompt: ${rawPrompt.slice(0, 35)} (${batchResult.prompts.length} Variations)`,
          summary: batchResult.prompts[0].prompt.slice(0, 100) + '...',
          data: batchResult,
          provider: settings.provider,
          model: settings.model,
        });
      }

      showToast(`Generated ${batchResult.prompts.length} professionally improved stock prompts!`);
    } catch (err: any) {
      showToast(err.message || 'Prompt improvement failed. Check API configuration.');
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const handleRegenerateSingle = (id: string) => {
    setResults(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          prompt: `Polished commercial stock concept of ${rawPrompt}, refined with authentic textures, subtle natural lighting, candid demography, and clean negative space`,
          similarityStatus: 'REFINED'
        };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h1 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Prompt Improver (Professional Commercial Polisher)</span>
            </h1>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Elevate simple, plain ideas into descriptive, commercially sound stock prompts with optimal visual parameters.
            </p>
          </div>
        </div>

        {/* Inputs Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Raw Prompt & Instructions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Original Raw Prompt *</span>
                <span className="text-[10px] text-zinc-500 font-normal">Basic concept to elevate</span>
              </label>
              <textarea
                value={rawPrompt}
                onChange={(e) => setRawPrompt(e.target.value)}
                placeholder="Enter your simple prompt or idea (e.g. man in office looking at computer screen)..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Improvement Instructions & Desired Mood</span>
                <span className="text-[10px] text-zinc-500 font-normal">Lighting, framing & constraints</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Instructions (e.g. Add realistic textures, make it high-end editorial, no logos, left copy space for marketing text)..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
              />
            </div>

            {/* Quick Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Improvement Focus</label>
                <select
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {focusOptions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {['Auto (Default)', 'Photo', 'Illustration', 'Vector', '3D Render', 'Silhouette'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Prompt Count Selector & CTA */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <PromptCountSelector
              value={count}
              onChange={setCount}
              disabled={isGenerating}
            />

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Commercial Stock Engineering</span>
              <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Replaces generic descriptions with specific lighting setups, authentic compositional framing, and buyer-targeted negative space.
              </p>
            </div>

            <button
              type="button"
              onClick={handleImprove}
              disabled={isGenerating || !rawPrompt.trim()}
              className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Improving Prompts ({count})...</span>
                </>
              ) : (
                <span>Improve Prompt ({count})</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      <UniversalPromptBatchView
        prompts={results}
        isGenerating={isGenerating}
        progress={progress}
        subject={rawPrompt.slice(0, 40)}
        instructions={instructions}
        sectionTitle="Prompt Improver"
        diversityScore={diversityScore}
        onRegenerateBatch={handleImprove}
        onRegenerateSingle={handleRegenerateSingle}
        onSendToMetadata={onSendToMetadata}
        onSendToRisk={onSendToRisk}
        showToast={showToast}
      />
    </div>
  );
};

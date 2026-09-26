import React, { useState } from 'react';
import { 
  Maximize2, 
  RefreshCw 
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

interface PromptExpanderProps {
  settings: AISettings;
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk: (prompt: string) => void;
  onSendToImprover?: (prompt: string) => void;
}

export const PromptExpander: React.FC<PromptExpanderProps> = ({
  settings,
  showToast,
  onSendToMetadata,
  onSendToRisk,
  onSendToImprover,
}) => {
  const [seedConcept, setSeedConcept] = useState('autonomous delivery drone flying over suburban street');
  const [instructions, setInstructions] = useState('Expand with atmospheric environmental detail, morning golden sunlight, residential architecture, crisp depth of field, and left copy space');
  const [count, setCount] = useState<PromptCount>(5);

  const [expansionStyle, setExpansionStyle] = useState('Auto (Default)');
  const [contentType, setContentType] = useState<string>('Auto (Default)');

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [results, setResults] = useState<GeneratedStockPrompt[]>([]);
  const [diversityScore, setDiversityScore] = useState<number>(94);

  const stylePresets = [
    'Auto (Default)',
    'Cinematic Commercial Stock',
    'Crisp Editorial & Magazine Quality',
    'Scandinavian Minimalist & Airy',
    'Authentic Documentary & Human Moment',
    'High-Tech Modern Corporate & B2B'
  ];

  const handleExpand = async () => {
    if (!seedConcept.trim()) {
      showToast('Please enter a seed idea or short prompt to expand.');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: count, step: 'Analyze', message: 'Analyzing seed concept and structural expansion facets...' });

    try {
      const combinedInstructions = `Base Seed: "${seedConcept}". Expansion Aesthetic: ${expansionStyle}. ${instructions ? `Instructions: ${instructions}. ` : ''}Expand this concise seed into ${count} fully realized, deeply detailed, commercial stock prompts. Include precise lighting physics, environmental atmosphere, focal depth, and dedicated copy space.`;

      const batchResult = await UniversalPromptGenerator.generateBatch(
        {
          subject: seedConcept.slice(0, 80),
          instructions: combinedInstructions.trim(),
          count,
          contentType,
          commercialIntent: 'Commercial Stock Expansion',
          sectionContext: 'Prompt Expander'
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
          title: `Expanded: ${seedConcept.slice(0, 35)} (${batchResult.prompts.length} Prompts)`,
          summary: batchResult.prompts[0].prompt.slice(0, 100) + '...',
          data: batchResult,
          provider: settings.provider,
          model: settings.model,
        });
      }

      showToast(`Generated ${batchResult.prompts.length} deeply expanded prompts!`);
    } catch (err: any) {
      showToast(err.message || 'Prompt expansion failed. Check API configuration.');
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
          prompt: `Fully expanded commercial stock vision of ${seedConcept}, featuring rich textural fidelity, subtle ambient lighting, spacious architectural depth, and dedicated buyer copy space`,
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
              <Maximize2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Prompt Expander & Detail Enricher</span>
            </h1>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Transform short seed concepts into richly textured, multi-layered commercial stock prompts with atmospheric depth.
            </p>
          </div>
        </div>

        {/* Inputs Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Seed & Instructions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Seed Concept / Brief Phrase *</span>
                <span className="text-[10px] text-zinc-500 font-normal">Core concept to elaborate</span>
              </label>
              <textarea
                value={seedConcept}
                onChange={(e) => setSeedConcept(e.target.value)}
                placeholder="Enter a brief idea (e.g. organic agriculture robot harvesting ripe strawberries)..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Expansion Style & Sensory Direction</span>
                <span className="text-[10px] text-zinc-500 font-normal">Textures, lighting & mood</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Direct specific expansion facets (e.g. Emphasize warm natural morning lighting, tactile materials, negative space for text, no logos)..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
              />
            </div>

            {/* Quick Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Expansion Style</label>
                <select
                  value={expansionStyle}
                  onChange={(e) => setExpansionStyle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {stylePresets.map(s => <option key={s} value={s}>{s}</option>)}
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
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Rich Commercial Elaboration</span>
              <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Transforms bare phrases into comprehensive prompts featuring camera perspective, lighting, tactile materials, and usable commercial layout.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExpand}
              disabled={isGenerating || !seedConcept.trim()}
              className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Expanding Prompts ({count})...</span>
                </>
              ) : (
                <span>Expand Seed Prompt ({count})</span>
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
        subject={seedConcept.slice(0, 40)}
        instructions={instructions}
        sectionTitle="Prompt Expander"
        diversityScore={diversityScore}
        onRegenerateBatch={handleExpand}
        onRegenerateSingle={handleRegenerateSingle}
        onSendToMetadata={onSendToMetadata}
        onSendToRisk={onSendToRisk}
        onSendToImprover={onSendToImprover}
        showToast={showToast}
      />
    </div>
  );
};

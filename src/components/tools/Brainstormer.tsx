import React, { useState } from 'react';
import { 
  Compass, 
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

interface BrainstormerProps {
  settings: AISettings;
  showToast: (msg: string) => void;
  onSendToPromptStudio: (prompt: string, title?: string, category?: string) => void;
  onSendToMetadata?: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk?: (prompt: string) => void;
}

export const Brainstormer: React.FC<BrainstormerProps> = ({
  settings,
  showToast,
  onSendToPromptStudio,
  onSendToMetadata,
  onSendToRisk,
}) => {
  const [subject, setSubject] = useState('High-demand commercial niches in modern renewable energy');
  const [instructions, setInstructions] = useState('Identify underserved buyer visual demands, focusing on commercial utility, clean technology, and realistic working situations');
  const [count, setCount] = useState<PromptCount>(5);

  const [industry, setIndustry] = useState('Auto (Default)');
  const [buyerType, setBuyerType] = useState('Auto (Default)');
  const [contentType, setContentType] = useState<'Photo' | 'Illustration' | 'Vector' | '3D Render' | 'Silhouette'>('Photo');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [results, setResults] = useState<GeneratedStockPrompt[]>([]);
  const [diversityScore, setDiversityScore] = useState<number>(95);

  const industries = [
    'Auto (Default)',
    'Green Tech & Renewable Energy',
    'Healthcare & Modern Medicine',
    'Remote Work, Freelancing & Digital Nomad',
    'Modern Agriculture & Food Tech',
    'Senior Wellness & Active Retirement',
    'Cybersecurity & Cloud Infrastructure',
    'Small Business Entrepreneurship & Craft'
  ];

  const buyerOptions = [
    'Auto (Default)',
    'Corporate Marketing & PR Teams',
    'Tech Startups & SaaS Landing Pages',
    'Editorial Publishers & Journalists',
    'Healthcare & Educational Institutions',
    'Small Business Owners & Brand Agencies'
  ];

  const handleBrainstorm = async () => {
    if (!subject.trim()) {
      showToast('Please enter a topic or industry focus.');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: count, step: 'Analyze', message: 'Analyzing market gaps and buyer demand signals...' });

    try {
      const combinedInstructions = `Topic: "${subject}". Industry: ${industry}. Target Buyer: ${buyerType}. ${instructions ? `Instructions: ${instructions}. ` : ''}Brainstorm ${count} distinct, commercially valuable stock prompt concepts that address real-world buyer needs and high search volume topics without brand names or trademarks.`;

      const batchResult = await UniversalPromptGenerator.generateBatch(
        {
          subject: subject.slice(0, 80),
          instructions: combinedInstructions.trim(),
          count,
          contentType,
          category: industry,
          commercialIntent: 'Stock Niche Market Gap',
          sectionContext: 'Brainstormer'
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
          title: `Brainstorm: ${subject.slice(0, 35)} (${batchResult.prompts.length} Ideas)`,
          summary: batchResult.prompts[0].prompt.slice(0, 100) + '...',
          data: batchResult,
          provider: settings.provider,
          model: settings.model,
        });
      }

      showToast(`Brainstormed ${batchResult.prompts.length} high-demand commercial concepts!`);
    } catch (err: any) {
      showToast(err.message || 'Brainstorming failed. Check API configuration.');
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
          prompt: `High-value commercial stock concept exploring ${p.subject} for ${buyerType.toLowerCase()}, featuring authentic lighting, candid perspective, and generous copy space`,
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
              <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Brainstormer (Stock Intelligence & Niche Discovery)</span>
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
              Identify underserved stock niches, uncrowded subject categories, and high-demand commercial themes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Market Filters' : 'Industry & Buyer Filters'}</span>
          </button>
        </div>

        {/* Inputs Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Topic & Instructions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Topic / Commercial Focus *</span>
                <span className="text-[10px] text-zinc-500 font-semibold">Exploration angle</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter topic or market sector (e.g. Modern renewable energy, active senior lifestyles)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Market Gap Context & Instructions</span>
                <span className="text-[10px] text-zinc-500 font-semibold">Buyer needs & direction</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Identify specific buyer requirements (e.g. Focus on practical B2B applications, natural authentic moments, negative space for layout)..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
              />
            </div>

            {/* Quick Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Target Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-zinc-100"
                >
                  {industries.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Target Buyer Persona</label>
                <select
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-zinc-100"
                >
                  {buyerOptions.map(b => <option key={b} value={b}>{b}</option>)}
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

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Niche Market Intelligence</span>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                Filters out saturated generic concepts and surfaces authentic, high-converting visual setups in high buyer demand.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBrainstorm}
              disabled={isGenerating || !subject.trim()}
              className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Brainstorming Concepts ({count})...</span>
                </>
              ) : (
                <span>Brainstorm Stock Niches ({count})</span>
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
        subject={subject}
        instructions={instructions}
        sectionTitle="Brainstormer"
        diversityScore={diversityScore}
        onRegenerateBatch={handleBrainstorm}
        onRegenerateSingle={handleRegenerateSingle}
        onSendToMetadata={onSendToMetadata}
        onSendToRisk={onSendToRisk}
        showToast={showToast}
      />
    </div>
  );
};

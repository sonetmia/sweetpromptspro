import React, { useState } from 'react';
import { 
  Users, 
  RefreshCw, 
  SlidersHorizontal,
  Sparkles
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

interface SilhouetteFinderProps {
  settings: AISettings;
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk: (prompt: string) => void;
  onSendToImprover?: (prompt: string) => void;
}

export const SilhouetteFinder: React.FC<SilhouetteFinderProps> = ({
  settings,
  showToast,
  onSendToMetadata,
  onSendToRisk,
  onSendToImprover,
}) => {
  const [subject, setSubject] = useState('Athletic female runner sprinting across the frame with dynamic muscular posture');
  const [instructions, setInstructions] = useState('Clean sharp black silhouette, pure white background, distinct recognizable anatomy, generous left copy space for advertising');
  const [count, setCount] = useState<PromptCount>(5);

  const [category, setCategory] = useState('Auto (Default)');
  const [style, setStyle] = useState('Pure Solid Black Vector Silhouette');
  const [background, setBackground] = useState('Solid Pure White Background (#ffffff)');
  const [composition, setComposition] = useState('Dynamic Action Pose on Rule of Thirds');
  const [copySpace, setCopySpace] = useState('Left');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [results, setResults] = useState<GeneratedStockPrompt[]>([]);
  const [diversityScore, setDiversityScore] = useState<number>(95);

  const styleOptions = [
    'Pure Solid Black Vector Silhouette',
    'Backlit Golden Rim Sunset Silhouette (Photo)',
    'Default (Classic High-Contrast Silhouette)',
    'Minimalist Flat Vector Silhouette Icon Collection',
    'Dual-Tone Gradient Graphic Silhouette',
    'High-Contrast Architectural Cityscape Silhouette'
  ];

  const categories = [
    'Auto (Default)',
    'Sports & Active Lifestyle',
    'Business People & Executive Meetings',
    'Crowds, Audiences & Celebrations',
    'Animals & Wildlife Figures',
    'City Skylines & Architecture',
    'Industrial Workers & Construction',
    'Family & Parenting Moments'
  ];

  const handleGenerate = async () => {
    if (!subject.trim()) {
      showToast('Please enter a subject or theme for the Silhouette Finder.');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: count, step: 'Analyze', message: 'Analyzing silhouette contour and contrast rules...' });

    try {
      const isAutoMode = category.startsWith('Auto');
      const combinedInstructions = `${instructions ? `${instructions}. ` : ''}Silhouette Style: ${style}. Background: ${background}. Composition: ${composition}.${
        isAutoMode 
          ? ' Category Mode: Auto (Design strictly honors and follows previous user instructions, subject context, and aesthetic guidance for visual composition and silhouette styling without predefined category restrictions).' 
          : ` Category Context: ${category}.`
      } Sharp high-contrast clean silhouette contour, zero interior facial features, distinct limb separation for immediate commercial clarity.`;

      const batchResult = await UniversalPromptGenerator.generateBatch(
        {
          subject: subject.trim(),
          instructions: combinedInstructions.trim(),
          count,
          contentType: 'Silhouette',
          category: isAutoMode ? 'Auto (Follow User Instructions)' : category,
          commercialIntent: 'Commercial Vector & Graphic Design',
          negativeSpace: copySpace,
          sectionContext: 'Silhouette Finder'
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
          title: `Silhouettes: ${subject.slice(0, 35)} (${batchResult.prompts.length} Prompts)`,
          summary: batchResult.prompts[0].prompt.slice(0, 100) + '...',
          data: batchResult,
          provider: settings.provider,
          model: settings.model,
        });
      }

      showToast(`Generated exactly ${batchResult.prompts.length} unique silhouette prompts!`);
    } catch (err: any) {
      showToast(err.message || 'Generation failed. Check API configuration.');
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
          prompt: `Sharp clean black silhouette of ${p.subject} on pure white background, unmistakable anatomical posture, high-contrast vector aesthetic with generous ${copySpace !== 'None' ? `${copySpace.toLowerCase()} negative space` : 'negative space'}`,
          similarityStatus: 'REFINED'
        };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Minimal Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Silhouette Finder</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Generate clean high-contrast silhouette & vector figure prompts with clear anatomical outlines and copy space.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{showAdvanced ? 'Hide Extra Options' : 'More Options'}</span>
        </button>
      </div>

      {/* Minimal Form Workspace */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Input Fields */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Subject or Figure Concept *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="E.g. Athletic female runner sprinting, silhouette of horse galloping, business executives meeting..."
                className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Contour & Negative Space Instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="E.g. Clear limb separation, no confusing overlaps, solid pure white background, left copy space..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>

            {/* Main Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Silhouette Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Copy Space Layout
                </label>
                <select
                  value={copySpace}
                  onChange={(e) => setCopySpace(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  {['Left', 'Right', 'Top', 'Bottom', 'Center', 'None'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Extra Options Drawer */}
            {showAdvanced && (
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Background
                  </label>
                  <select
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    {['Solid Pure White Background (#ffffff)', 'Warm Sunset Gradient (Photo Silhouette)', 'Soft Minimal Studio Gray (#f4f4f5)', 'Auto (Default)'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Composition Style
                  </label>
                  <select
                    value={composition}
                    onChange={(e) => setComposition(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    {['Dynamic Action Pose on Rule of Thirds', 'Centered Monumental Figure', 'Panoramic Group Progression', 'Auto (Default)'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Count Selector & Action Button */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <PromptCountSelector
              value={count}
              onChange={setCount}
              disabled={isGenerating}
            />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !subject.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating {count} Silhouette Prompts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Silhouette Prompts ({count})</span>
                </>
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
        sectionTitle="Silhouette Finder"
        diversityScore={diversityScore}
        onRegenerateBatch={handleGenerate}
        onRegenerateSingle={handleRegenerateSingle}
        onSendToMetadata={onSendToMetadata}
        onSendToRisk={onSendToRisk}
        onSendToImprover={onSendToImprover}
        showToast={showToast}
      />
    </div>
  );
};


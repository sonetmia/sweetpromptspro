import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Layers, 
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

interface PromptStudioProps {
  settings: AISettings;
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk: (prompt: string) => void;
}

export const PromptStudio: React.FC<PromptStudioProps> = ({
  settings,
  showToast,
  onSendToMetadata,
  onSendToRisk,
}) => {
  const [subject, setSubject] = useState('');
  const [instructions, setInstructions] = useState('');
  const [count, setCount] = useState<PromptCount>(5);

  const [category, setCategory] = useState('Auto (Default)');
  const [visualType, setVisualType] = useState<string>('Auto (Default)');
  const [aspectRatio, setAspectRatio] = useState('Auto (Default)');
  const [commercialIntent, setCommercialIntent] = useState('Auto (Default)');
  const [negativeSpace, setNegativeSpace] = useState('Auto (Default)');
  const [lighting, setLighting] = useState('Auto (Default)');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [results, setResults] = useState<GeneratedStockPrompt[]>([]);
  const [diversityScore, setDiversityScore] = useState<number>(95);

  const categories = [
    'Auto (Default)', 'Business & Work', 'Technology & AI', 'Education & Learning', 
    'Travel & Lifestyle', 'Food & Culinary', 'Healthcare & Medicine', 'Finance & Banking', 
    'Nature & Ecology', 'Backgrounds & Textures', 'Architecture & Real Estate', 'E-commerce & Shopping'
  ];

  const visualTypes: string[] = [
    'Auto (Default)', 'Photo', 'Illustration', 'Vector', '3D Render', 'Silhouette'
  ];

  const aspectRatios = ['Auto (Default)', '16:9', '1:1', '4:5', '3:4', '9:16', '3:2'];
  const commercialIntents = ['Auto (Default)', 'Advertising', 'Website Hero', 'Social Media', 'E-commerce', 'Packaging', 'Editorial', 'Presentation'];
  const negativeSpaceOptions = ['Auto (Default)', 'None', 'Left', 'Right', 'Top', 'Bottom', 'Center'];

  const handleGenerate = async () => {
    if (!subject.trim()) {
      showToast('Please enter a subject or concept first.');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: count, step: 'Analyze', message: 'Analyzing concept...' });

    try {
      const batchResult = await UniversalPromptGenerator.generateBatch(
        {
          subject: subject.trim(),
          instructions: instructions.trim(),
          count,
          contentType: visualType,
          category,
          commercialIntent,
          aspectRatio,
          negativeSpace,
          lighting,
          sectionContext: 'Prompt Studio'
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
          title: `Prompt Studio: ${subject.slice(0, 40)} (${batchResult.prompts.length} Prompts)`,
          summary: batchResult.prompts[0].prompt.slice(0, 100) + '...',
          data: batchResult,
          provider: settings.provider,
          model: settings.model,
        });
      }

      showToast(`Generated exactly ${batchResult.prompts.length} unique prompts!`);
    } catch (err: any) {
      showToast(err.message || 'Prompt generation failed. Check API configuration.');
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
          prompt: `${p.subject}, alternative perspective with ${negativeSpace !== 'None' ? `${negativeSpace.toLowerCase()} negative space` : 'clean composition'}, premium commercial stock photography with authentic lighting`,
          similarityStatus: 'REFINED'
        };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Form */}
      <div className="p-6 rounded-[8px] bg-[#11161A] border border-[#272D30] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F272B]">
          <div>
            <div className="text-[10px] font-semibold tracking-widest text-[#8C8A86] uppercase mb-1">
              PROMPT WORKSPACE
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl text-[#F3EDE2] font-normal tracking-tight">
              Prompt Studio
            </h1>
            <p className="text-xs text-[#8C8A86] mt-1 max-w-xl">
              Create commercially viable, brand-safe stock prompts with full Adobe Stock compliance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-medium text-[#8C8A86] hover:text-[#F3EDE2] flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Parameters' : 'Parameters'}</span>
          </button>
        </div>

        {/* Inputs Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Subject & Instructions */}
          <div className="lg:col-span-7 space-y-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#E8E4DC] flex items-center justify-between">
                <span>Subject / Concept *</span>
                <span className="text-[10px] text-[#606669] font-normal">Core commercial concept</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Minimalist ceramic coffee mug on textured stone surface with morning sunlight..."
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#272D30] bg-[#090B0D] text-xs text-[#F3EDE2] placeholder-[#606669] focus:outline-none focus:border-[#C74A43] focus:ring-1 focus:ring-[#C74A43] font-medium"
              />
            </div>

            {/* Additional Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#E8E4DC] flex items-center justify-between">
                <span>Additional Direction</span>
                <span className="text-[10px] text-[#606669] font-normal">Mood, composition & negative constraints</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Editorial lighting, copy space on left, no human faces, no recognizable brand logos..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#272D30] bg-[#090B0D] text-xs text-[#F3EDE2] placeholder-[#606669] focus:outline-none focus:border-[#C74A43] focus:ring-1 focus:ring-[#C74A43] resize-none leading-relaxed"
              />
            </div>

            {/* Content Settings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {/* Visual Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8C8A86]">Content Type</label>
                <select
                  value={visualType}
                  onChange={(e) => setVisualType(e.target.value as any)}
                  className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
                >
                  {visualTypes.map(t => <option key={t} value={t} className="bg-[#11161A] text-[#F3EDE2]">{t}</option>)}
                </select>
              </div>

              {/* Commercial Intent */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8C8A86]">Commercial Use</label>
                <select
                  value={commercialIntent}
                  onChange={(e) => setCommercialIntent(e.target.value)}
                  className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
                >
                  {commercialIntents.map(i => <option key={i} value={i} className="bg-[#11161A] text-[#F3EDE2]">{i}</option>)}
                </select>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8C8A86]">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
                >
                  {aspectRatios.map(r => <option key={r} value={r} className="bg-[#11161A] text-[#F3EDE2]">{r}</option>)}
                </select>
              </div>

              {/* Negative Space */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8C8A86]">Copy Space</label>
                <select
                  value={negativeSpace}
                  onChange={(e) => setNegativeSpace(e.target.value)}
                  className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
                >
                  {negativeSpaceOptions.map(n => <option key={n} value={n} className="bg-[#11161A] text-[#F3EDE2]">{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Count Selector & Action */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <PromptCountSelector
              value={count}
              onChange={setCount}
              disabled={isGenerating}
            />

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#E8E4DC]">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
              >
                {categories.map(c => <option key={c} value={c} className="bg-[#11161A] text-[#F3EDE2]">{c}</option>)}
              </select>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !subject.trim()}
              className="w-full h-[44px] rounded-[7px] bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isGenerating ? 'Crafting Prompts...' : `Generate ${count} Prompts →`}</span>
            </button>
          </div>
        </div>

        {/* Optional Advanced Drawer */}
        {showAdvanced && (
          <div className="p-4 rounded-[6px] bg-[#090B0D] border border-[#272D30] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#8C8A86]">Lighting Style</label>
              <input
                type="text"
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
                placeholder="e.g. Diffused morning window light, high key studio..."
                className="w-full px-3 py-1.5 rounded-[4px] border border-[#272D30] bg-[#11161A] text-xs text-[#E8E4DC]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#8C8A86]">Model Engine</label>
              <div className="px-3 py-1.5 rounded-[4px] border border-[#272D30] bg-[#11161A] text-xs text-[#8C8A86] font-mono">
                {settings.model || 'gemini-2.5-flash'} (Universal Stock Engine)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results View */}
      <UniversalPromptBatchView
        prompts={results}
        isGenerating={isGenerating}
        progress={progress}
        subject={subject}
        instructions={instructions}
        sectionTitle="Prompt Studio"
        diversityScore={diversityScore}
        onRegenerateBatch={handleGenerate}
        onRegenerateSingle={handleRegenerateSingle}
        onSendToMetadata={onSendToMetadata}
        onSendToRisk={onSendToRisk}
        showToast={showToast}
      />
    </div>
  );
};

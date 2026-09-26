import React, { useState } from 'react';
import { 
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { AISettings } from '../../types';
import { 
  PromptCount, 
  GeneratedStockPrompt, 
  GenerationProgress,
  UniversalPromptGenerator 
} from '../../lib/prompt-engine';
import { UniversalPromptBatchView } from '../prompt-engine/UniversalPromptBatchView';
import { saveHistoryItem } from '../../lib/storage/localStorage';

interface PNGCreatorProps {
  settings: AISettings;
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk: (prompt: string) => void;
  onSendToImprover?: (prompt: string) => void;
}

export const PNGCreator: React.FC<PNGCreatorProps> = ({
  settings,
  showToast,
  onSendToMetadata,
  onSendToRisk,
}) => {
  const [subject, setSubject] = useState('');
  const [instructions, setInstructions] = useState('');
  const [count, setCount] = useState<PromptCount>(10);
  const [style, setStyle] = useState('flat vector');
  const [usage, setUsage] = useState('design asset');
  const [background, setBackground] = useState('transparent');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [results, setResults] = useState<GeneratedStockPrompt[]>([]);
  const [diversityScore, setDiversityScore] = useState<number>(95);

  const countOptions: PromptCount[] = [5, 10, 15, 20, 25, 30];

  const styleOptions = [
    'flat vector',
    'Auto (Default)',
    '3D glossy render',
    'clean photo cutout',
    'minimalist icon',
    'watercolor sticker',
    'isometric graphic',
    'clay 3D render',
    'vintage engraving sketch'
  ];

  const usageOptions = [
    'design asset',
    'Auto (Default)',
    'ui / web icon',
    'e-commerce mockup',
    'marketing & ads',
    'sticker & print',
    'packaging element'
  ];

  const backgroundOptions = [
    'transparent',
    'Auto (Default)',
    'solid pure white (#ffffff)',
    'isolated alpha cutout',
    'clean studio backdrop',
    'pristine high-key floor'
  ];

  const handleGenerate = async () => {
    const activeSubject = subject.trim() || 'coffee cup, leaf, abstract shape, business icon';

    setIsGenerating(true);
    setProgress({ current: 0, total: count, step: 'Analyze', message: 'Analyzing transparent PNG asset and microstock rules...' });

    try {
      const isAutoStyle = style.toLowerCase().includes('auto');
      const isAutoUsage = usage.toLowerCase().includes('auto');
      const isAutoBg = background.toLowerCase().includes('auto');

      const styleClause = isAutoStyle ? 'Clean modern stock visual cutout style' : `Style: ${style}`;
      const usageClause = isAutoUsage ? 'Versatile microstock design asset' : `Commercial Usage: ${usage}`;
      const bgClause = 'isolated on pure solid white background (#ffffff), pure white backdrop, zero drop shadows, zero background elements, clean sharp alpha cutout boundaries, background removal ready';

      const combinedInstructions = `${instructions ? `${instructions}. ` : ''}${styleClause}. ${usageClause}. ${bgClause}. Strict Adobe Stock compliance: completely isolated asset, highly detailed 40-70 word prompt description, faceless anonymous subject if human form present, zero brand logos, zero trademarks, zero text, zero watermarks, crisp unblemished cutout edges.`;

      const batchResult = await UniversalPromptGenerator.generateBatch(
        {
          subject: activeSubject,
          instructions: combinedInstructions,
          count,
          contentType: 'PNG',
          category: 'Isolated Stock Elements',
          commercialIntent: usage,
          aspectRatio: '1:1',
          negativeSpace: 'None',
          lighting: 'Clean flat even studio lighting with zero harsh background shadows',
          sectionContext: 'PNG Creator'
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
          title: `PNG Cutouts: ${activeSubject.slice(0, 40)} (${batchResult.prompts.length} Prompts)`,
          summary: batchResult.prompts[0].prompt.slice(0, 100) + '...',
          data: batchResult,
          provider: settings.provider,
          model: settings.model,
        });
      }

      showToast(`Generated ${batchResult.prompts.length} isolated PNG prompts!`);
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
          prompt: `${p.subject}, isolated on pure transparent background, crisp sharp edges, ${style} aesthetic, commercial graphic asset, no logos, no text`,
          similarityStatus: 'REFINED'
        };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="p-6 rounded-[8px] bg-[#11161A] border border-[#272D30] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F272B]">
          <div>
            <div className="text-[10px] font-semibold tracking-widest text-[#8C8A86] uppercase mb-1">
              ISOLATED ASSETS
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl text-[#F3EDE2] font-normal tracking-tight">
              PNG Creator (Isolated Cutouts)
            </h1>
            <p className="text-xs text-[#8C8A86] mt-1 max-w-xl">
              Specialized for transparent background graphics, icons, 3D elements, and clean alpha-channel cutouts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-medium text-[#8C8A86] hover:text-[#F3EDE2] flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Setup' : 'Custom Options'}</span>
          </button>
        </div>

        {/* Inputs Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Subject & Instructions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#E8E4DC] flex items-center justify-between">
                <span>Asset Subject *</span>
                <span className="text-[10px] text-[#606669] font-normal">Objects or icon themes</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Vintage botanical branch, ceramic cup, geometric cube..."
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#272D30] bg-[#090B0D] text-xs text-[#F3EDE2] placeholder-[#606669] focus:outline-none focus:border-[#C74A43] focus:ring-1 focus:ring-[#C74A43] font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#E8E4DC] flex items-center justify-between">
                <span>Custom Instructions</span>
                <span className="text-[10px] text-[#606669] font-normal">Edge quality & rendering</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Additional direction (e.g. Crisp alpha edges, soft drop shadow, minimal vector palette)..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#272D30] bg-[#090B0D] text-xs text-[#F3EDE2] placeholder-[#606669] focus:outline-none focus:border-[#C74A43] focus:ring-1 focus:ring-[#C74A43] resize-none leading-relaxed"
              />
            </div>

            {/* Quick Settings */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8C8A86]">Visual Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
                >
                  {styleOptions.map(s => (
                    <option key={s} value={s} className="bg-[#11161A] text-[#F3EDE2]">{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8C8A86]">Usage</label>
                <select
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
                >
                  {usageOptions.map(u => (
                    <option key={u} value={u} className="bg-[#11161A] text-[#F3EDE2]">{u}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8C8A86]">Cutout Type</label>
                <select
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
                >
                  {backgroundOptions.map(bg => (
                    <option key={bg} value={bg} className="bg-[#11161A] text-[#F3EDE2]">{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Quantity & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#E8E4DC] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#8C8A86]" />
                  <span>Batch Quantity</span>
                </label>
                <span className="text-[11px] font-mono text-[#8C8A86]">
                  Target: <strong className="text-[#C74A43] font-semibold">{count}</strong> Prompts
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1 p-1 rounded-[6px] bg-[#090B0D] border border-[#272D30]">
                {countOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setCount(c)}
                    className={`py-1.5 px-1 text-center rounded-[4px] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                      count === c
                        ? 'bg-[#C74A43] text-[#F3EDE2] font-semibold'
                        : 'text-[#8C8A86] hover:text-[#F3EDE2] hover:bg-[#171E24]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-[6px] bg-[#090B0D] border border-[#272D30] space-y-1 text-xs">
              <span className="text-[11px] font-medium text-[#8C8A86]">Stock Cutout Protocol</span>
              <p className="text-[11px] text-[#606669] leading-relaxed">
                Appends isolation triggers and transparency tags for maximum buyer search visibility.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-[44px] rounded-[7px] bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isGenerating ? 'Generating PNG Prompts...' : `Generate ${count} Isolated Prompts →`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Workspace */}
      <UniversalPromptBatchView
        prompts={results}
        isGenerating={isGenerating}
        progress={progress}
        subject={subject || 'Isolated Stock Element'}
        instructions={instructions}
        sectionTitle="PNG Cutout Creator"
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

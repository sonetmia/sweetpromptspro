import React, { useState } from 'react';
import { 
  Camera, 
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

interface JPGCreatorProps {
  settings: AISettings;
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk: (prompt: string) => void;
  onSendToImprover?: (prompt: string) => void;
  onSendToVariations?: (prompt: string) => void;
}

export const JPGCreator: React.FC<JPGCreatorProps> = ({
  settings,
  showToast,
  onSendToMetadata,
  onSendToRisk,
}) => {
  const [subject, setSubject] = useState('Modern Scandinavian office workspace with digital tablet, notebook, and warm natural sunlight on wooden desk');
  const [instructions, setInstructions] = useState('Faceless anonymous lifestyle composition, realistic depth of field, clean corporate atmosphere, generous left copy space, zero brand logos');
  const [count, setCount] = useState<PromptCount>(5);

  const [category, setCategory] = useState('Auto (Default)');
  const [commercialUse, setCommercialUse] = useState('Auto (Default)');
  const [lighting, setLighting] = useState('Auto (Default)');
  const [cameraLens, setCameraLens] = useState('Auto (Default)');
  const [negativeSpace, setNegativeSpace] = useState('Auto (Default)');
  const [aspectRatio, setAspectRatio] = useState('Auto (Default)');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [results, setResults] = useState<GeneratedStockPrompt[]>([]);
  const [diversityScore, setDiversityScore] = useState<number>(94);

  const categories = [
    'Auto (Default)',
    'Business & Modern Work',
    'Healthcare & Medical Science',
    'Technology & AI Integration',
    'Lifestyle & Wellness',
    'Sustainability & Clean Energy',
    'Food, Dining & Culinary Art',
    'Industry, Manufacturing & Logistics',
    'Education & Creative Learning',
    'Finance & Real Estate'
  ];

  const lensOptions = [
    'Auto (Default)',
    '50mm f/1.4 (Natural eye perspective, soft creamy bokeh)',
    '35mm f/1.8 (Candid documentary look, environmental depth)',
    '85mm f/1.4 (Commercial corporate aesthetic, razor-sharp subject)',
    '24-70mm f/2.8 (Professional commercial advertising standard)',
    '100mm f/2.8 Macro (Ultra-detailed texture, food & scientific scrutiny)'
  ];

  const lightingOptions = [
    'Auto (Default)',
    'Clean diffuse daylight from large studio windows',
    'Soft directional key light with gentle white reflector fill',
    'Golden hour warm low-angle natural sunlight',
    'High-key crisp commercial studio lighting',
    'Moody architectural ambient lighting with subtle accent highlights'
  ];

  const commercialUseOptions = [
    'Auto (Default)',
    'Healthcare Editorial & Marketing',
    'Corporate Advertising',
    'Social Media Campaign',
    'E-commerce Lifestyle',
    'Website Hero Banner'
  ];

  const copySpaceOptions = [
    'Auto (Default)',
    'Left',
    'Right',
    'Top',
    'Bottom',
    'Center',
    'None'
  ];

  const aspectRatioOptions = [
    'Auto (Default)',
    '16:9',
    '3:2',
    '4:5',
    '1:1',
    '9:16'
  ];

  const handleGenerate = async () => {
    if (!subject.trim()) {
      showToast('Please enter a subject or concept for the JPG photo creator.');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: count, step: 'Analyze', message: 'Analyzing photo composition and lighting...' });

    try {
      const combinedInstructions = `${instructions ? `${instructions}. ` : ''}Camera lens: ${cameraLens}. Lighting: ${lighting}. Safety Mode: Strict Adobe Stock compliance. Faceless anonymous composition (no recognizable human faces, close-up portraits, or headshots; if people are in the scene, frame from behind, silhouette, cropped headless, or hands-only), zero brand logos, zero trademarks, zero IP, zero watermarks, zero readable text.`;

      const batchResult = await UniversalPromptGenerator.generateBatch(
        {
          subject: subject.trim(),
          instructions: combinedInstructions,
          count,
          contentType: 'Photo',
          category,
          commercialIntent: commercialUse,
          aspectRatio,
          negativeSpace,
          lighting,
          sectionContext: 'JPG Creator'
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
          title: `JPG Photo: ${subject.slice(0, 40)} (${batchResult.prompts.length} Prompts)`,
          summary: batchResult.prompts[0].prompt.slice(0, 100) + '...',
          data: batchResult,
          provider: settings.provider,
          model: settings.model,
        });
      }

      showToast(`Generated ${batchResult.prompts.length} commercial photo prompts!`);
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
          prompt: `${p.subject}, commercial photographic perspective with ${cameraLens}, authentic directional lighting, faceless anonymous composition, no logos, no trademarks, with dedicated ${negativeSpace !== 'None' ? `${negativeSpace.toLowerCase()} copy space` : 'copy space'}`,
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
              PHOTO STUDIO
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl text-[#F3EDE2] font-normal tracking-tight">
              JPG Creator (Stock Photography)
            </h1>
            <p className="text-xs text-[#8C8A86] mt-1 max-w-xl">
              Engineered for commercial stock photography: realistic depth of field, authentic lighting, and buyer copy space.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-medium text-[#8C8A86] hover:text-[#F3EDE2] flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Camera Setup' : 'Camera & Lighting Setup'}</span>
          </button>
        </div>

        {/* Inputs Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Subject & Instructions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#E8E4DC] flex items-center justify-between">
                <span>Subject / Scene *</span>
                <span className="text-[10px] text-[#606669] font-normal">Primary photographic subject</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Describe photographic subject (e.g. Minimal ceramic tea set on rustic wooden table with morning light)..."
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#272D30] bg-[#090B0D] text-xs text-[#F3EDE2] placeholder-[#606669] focus:outline-none focus:border-[#C74A43] focus:ring-1 focus:ring-[#C74A43] font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#E8E4DC] flex items-center justify-between">
                <span>Photographic Direction & Constraints</span>
                <span className="text-[10px] text-[#606669] font-normal">Atmosphere & composition</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Visual direction, perspective, human presence or constraints (e.g. Diffused window daylight, generous left copy space, no logos)..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-[6px] border border-[#272D30] bg-[#090B0D] text-xs text-[#F3EDE2] placeholder-[#606669] focus:outline-none focus:border-[#C74A43] focus:ring-1 focus:ring-[#C74A43] resize-none leading-relaxed"
              />
            </div>

            {/* Quick Settings */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8C8A86]">Commercial Use</label>
                <select
                  value={commercialUse}
                  onChange={(e) => setCommercialUse(e.target.value)}
                  className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
                >
                  {commercialUseOptions.map(u => (
                    <option key={u} value={u} className="bg-[#11161A] text-[#F3EDE2]">{u}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8C8A86]">Copy Space</label>
                <select
                  value={negativeSpace}
                  onChange={(e) => setNegativeSpace(e.target.value)}
                  className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
                >
                  {copySpaceOptions.map(n => (
                    <option key={n} value={n} className="bg-[#11161A] text-[#F3EDE2]">{n}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#8C8A86]">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
                >
                  {aspectRatioOptions.map(r => (
                    <option key={r} value={r} className="bg-[#11161A] text-[#F3EDE2]">{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Count & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <PromptCountSelector
              value={count}
              onChange={setCount}
              disabled={isGenerating}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#E8E4DC]">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2 text-xs text-[#E8E4DC] focus:outline-none focus:border-[#C74A43]"
              >
                {categories.map(c => (
                  <option key={c} value={c} className="bg-[#11161A] text-[#F3EDE2]">{c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !subject.trim()}
              className="w-full h-[44px] rounded-[7px] bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isGenerating ? 'Generating Photo Prompts...' : `Generate ${count} Photo Prompts →`}</span>
            </button>
          </div>
        </div>

        {/* Optional Advanced Camera & Optics Drawer */}
        {showAdvanced && (
          <div className="p-4 rounded-[6px] bg-[#090B0D] border border-[#272D30] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#8C8A86]">Camera Lens & Optics</label>
              <select
                value={cameraLens}
                onChange={(e) => setCameraLens(e.target.value)}
                className="w-full rounded-[6px] border border-[#272D30] bg-[#11161A] p-2 text-xs text-[#E8E4DC]"
              >
                {lensOptions.map(l => (
                  <option key={l} value={l} className="bg-[#11161A] text-[#F3EDE2]">{l}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#8C8A86]">Lighting Atmosphere</label>
              <select
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
                className="w-full rounded-[6px] border border-[#272D30] bg-[#11161A] p-2 text-xs text-[#E8E4DC]"
              >
                {lightingOptions.map(lit => (
                  <option key={lit} value={lit} className="bg-[#11161A] text-[#F3EDE2]">{lit}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Workspace */}
      <UniversalPromptBatchView
        prompts={results}
        isGenerating={isGenerating}
        progress={progress}
        subject={subject}
        instructions={instructions}
        sectionTitle="JPG Photo Creator"
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

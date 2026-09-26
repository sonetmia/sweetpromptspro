import React, { useState } from 'react';
import { 
  Package, 
  Layers, 
  Tag, 
  ShieldAlert, 
  Workflow,
  SlidersHorizontal,
  RefreshCw,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { AISettings } from '../../types';
import { 
  PromptCount, 
  GeneratedStockPrompt, 
  GenerationProgress,
  UniversalPromptGenerator,
  UniversalPromptExporter 
} from '../../lib/prompt-engine';
import { PromptCountSelector } from '../prompt-engine/PromptCountSelector';
import { UniversalPromptBatchView } from '../prompt-engine/UniversalPromptBatchView';
import { generateStockMetadata } from '../../lib/metadata/generator';
import { validateStockRisk } from '../../lib/risk/validator';
import { exportToCSV, exportToJSON, exportToTXT } from '../../lib/utils/exportUtils';
import { saveHistoryItem } from '../../lib/storage/localStorage';

interface BulkHubProps {
  settings: AISettings;
  onAddToast: (msg: string) => void;
  onSendToMetadata?: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk?: (prompt: string) => void;
}

type BulkTab = 'prompts' | 'metadata' | 'risk' | 'pipeline';

export const BulkHub: React.FC<BulkHubProps> = ({ 
  settings, 
  onAddToast,
  onSendToMetadata,
  onSendToRisk,
}) => {
  const [activeTab, setActiveTab] = useState<BulkTab>('prompts');

  // Universal Prompt Mode state
  const [subject, setSubject] = useState('Modern AI data center server room with glowing blue fiber optics');
  const [instructions, setInstructions] = useState('Clean commercial lighting, subtle human presence of technicians, vast copy space on right side for tech marketing text');
  const [count, setCount] = useState<PromptCount>(10);
  const [category, setCategory] = useState('Auto (Default)');
  const [style, setStyle] = useState<string>('Auto (Default)');
  const [commercialIntent, setCommercialIntent] = useState('Auto (Default)');
  const [variationStrength, setVariationStrength] = useState<'Low' | 'Medium' | 'High'>('High');
  const [negativeSpace, setNegativeSpace] = useState('Auto (Default)');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Results for Universal Prompts tab
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [batchPrompts, setBatchPrompts] = useState<GeneratedStockPrompt[]>([]);
  const [diversityScore, setDiversityScore] = useState<number>(95);

  // Multi-line inputs for metadata / risk / pipeline tabs
  const [bulkInput, setBulkInput] = useState<string>(
    'Modern AI data center server room\nMinimalist sustainable eco architecture\nFreelance digital nomad working in sunny cafe\nFuturistic electric autonomous delivery drone\nAbstract glowing neural network background'
  );
  const [batchMetadata, setBatchMetadata] = useState<any[]>([]);
  const [batchRisk, setBatchRisk] = useState<any[]>([]);
  const [batchPipeline, setBatchPipeline] = useState<any[]>([]);
  const [multiLineProgress, setMultiLineProgress] = useState({ current: 0, total: 0 });

  const categories = [
    'Auto (Default)',
    'Technology & AI Integration',
    'Business & Modern Work',
    'Healthcare & Medicine',
    'Sustainability & Clean Energy',
    'Education & Learning',
    'Finance & Real Estate',
    'Food & Culinary',
    'Lifestyle & Wellness'
  ];

  const handleGenerateUniversalBatch = async () => {
    if (!subject.trim()) {
      onAddToast('Please enter a subject or topic for the bulk generator.');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: count, step: 'Analyze', message: 'Analyzing bulk subject parameters...' });

    try {
      const combinedInstructions = `${instructions ? `${instructions}. ` : ''}Category: ${category}. Commercial Intent: ${commercialIntent}. Variation Strength: ${variationStrength}. Dedicated negative space on the ${negativeSpace.toLowerCase()}.`;

      const batchResult = await UniversalPromptGenerator.generateBatch(
        {
          subject: subject.trim(),
          instructions: combinedInstructions.trim(),
          count,
          contentType: style,
          category,
          commercialIntent,
          negativeSpace,
          variationStrength,
          sectionContext: 'Bulk Generator'
        },
        {
          onProgress: (p) => setProgress(p),
          preferredModel: settings.model
        }
      );

      setBatchPrompts(batchResult.prompts);
      setDiversityScore(batchResult.diversityScore);

      if (batchResult.prompts.length > 0) {
        saveHistoryItem({
          type: 'prompt',
          title: `Bulk Hub: ${subject.slice(0, 35)} (${batchResult.prompts.length} Prompts)`,
          summary: batchResult.prompts[0].prompt.slice(0, 100) + '...',
          data: batchResult,
          provider: settings.provider,
          model: settings.model,
        });
      }

      onAddToast(`Generated exactly ${batchResult.prompts.length} unique commercial prompts!`);
    } catch (err: any) {
      onAddToast(err.message || 'Bulk generation failed. Check API configuration.');
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const handleRunMultiLineMetadataOrRisk = async () => {
    const lines = bulkInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      onAddToast('Please enter at least one item to process.');
      return;
    }

    setIsGenerating(true);
    setMultiLineProgress({ current: 0, total: lines.length });

    try {
      if (activeTab === 'metadata') {
        const metaResults: any[] = [];
        for (let i = 0; i < lines.length; i++) {
          setMultiLineProgress({ current: i + 1, total: lines.length });
          const meta = await generateStockMetadata(lines[i], category);
          metaResults.push({ id: 'm_' + i, query: lines[i], ...meta });
        }
        setBatchMetadata(metaResults);
        onAddToast(`Generated metadata for ${metaResults.length} concepts.`);
      } else if (activeTab === 'risk') {
        const riskResults: any[] = [];
        for (let i = 0; i < lines.length; i++) {
          setMultiLineProgress({ current: i + 1, total: lines.length });
          const risk = validateStockRisk(lines[i]);
          riskResults.push({ id: 'r_' + i, text: lines[i], ...risk });
        }
        setBatchRisk(riskResults);
        onAddToast(`Audited IP risk for ${riskResults.length} items.`);
      } else if (activeTab === 'pipeline') {
        const pipeResults: any[] = [];
        for (let i = 0; i < lines.length; i++) {
          setMultiLineProgress({ current: i + 1, total: lines.length });
          const prmRes = await UniversalPromptGenerator.generateBatch({
            subject: lines[i],
            count: 1,
            contentType: 'Photo',
            category
          });
          const generatedPrompt = prmRes.prompts[0]?.prompt || lines[i];
          const meta = await generateStockMetadata(generatedPrompt, category);
          const risk = validateStockRisk(`${meta.title} ${generatedPrompt}`);

          pipeResults.push({
            id: 'pipe_' + i,
            topic: lines[i],
            title: meta.title,
            prompt: generatedPrompt,
            category: meta.category,
            keywords: meta.keywords,
            contentType: meta.contentType,
            riskOverall: risk.overall,
            riskFindings: risk.findings.map(f => f.term).join(', ') || 'Clean'
          });
        }
        setBatchPipeline(pipeResults);
        onAddToast(`Processed full stock pipeline for ${pipeResults.length} concepts.`);
      }
    } catch (e: any) {
      onAddToast(e.message || 'Multi-line processing failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSinglePrompt = (id: string) => {
    setBatchPrompts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          prompt: `${p.subject}, highly diversified commercial stock concept with authentic lighting, distinctive framing, and clean negative space`,
          similarityStatus: 'REFINED'
        };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Bulk Generator & Production Hub</span>
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
            Generate multi-count batches of unique prompts, metadata sets, or compliance scans with instant TXT and CSV exports.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('prompts')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'prompts'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Prompt Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'metadata'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Bulk Metadata</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('risk')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'risk'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Bulk IP Scan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Full Pipeline</span>
          </button>
        </div>
      </div>

      {/* TAB 1: UNIVERSAL MULTI-PROMPT GENERATOR */}
      {activeTab === 'prompts' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-extrabold text-zinc-950 dark:text-zinc-50 text-sm">
                  Bulk Prompt Batch Configuration
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">
                  Produce up to 30 completely distinct commercial stock prompts around your target subject.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showAdvanced ? 'Hide Advanced Options' : 'Category & Style Options'}</span>
              </button>
            </div>

            {/* Inputs Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Subject & Instructions */}
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Subject / Core Concept *</span>
                    <span className="text-[10px] text-zinc-500 font-semibold">Primary stock idea</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject or theme (e.g. Modern AI data center server room with glowing fiber optics)..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Batch Instructions & Constraints</span>
                    <span className="text-[10px] text-zinc-500 font-semibold">Commercial rules & mood</span>
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Directions for the batch (e.g. Clean high-tech aesthetics, generous copy space for text, no logos, diverse perspectives)..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* Quick Settings */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-500">Content Type</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      {['Auto (Default)', 'Photo', 'Illustration', 'Vector', '3D Render', 'Silhouette'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-500">Commercial Use</label>
                    <select
                      value={commercialIntent}
                      onChange={(e) => setCommercialIntent(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      {['Auto (Default)', 'Advertising & B2B Hero', 'Website Hero & Marketing', 'Social Media Campaign', 'E-commerce Lifestyle', 'Editorial Spread'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-500">Variation Strength</label>
                    <select
                      value={variationStrength}
                      onChange={(e) => setVariationStrength(e.target.value as any)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      {['Low', 'Medium', 'High'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {showAdvanced && (
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500">Industry / Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs text-zinc-900 dark:text-zinc-100"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500">Negative Space</label>
                      <select
                        value={negativeSpace}
                        onChange={(e) => setNegativeSpace(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs text-zinc-900 dark:text-zinc-100"
                      >
                        {['Auto (Default)', 'Left', 'Right', 'Top', 'Bottom', 'Center', 'None'].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Prompt Count Selector & CTA */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <PromptCountSelector
                  value={count}
                  onChange={setCount}
                  disabled={isGenerating}
                />

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">Strict Exact Count Enforcement</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    Generates exactly {count} distinct prompts with pairwise similarity auditing to protect your Adobe Stock account from duplicate flags.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateUniversalBatch}
                  disabled={isGenerating || !subject.trim()}
                  className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating {count} Unique Prompts...</span>
                    </>
                  ) : (
                    <span>Generate Bulk Prompts ({count})</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results View */}
          <UniversalPromptBatchView
            prompts={batchPrompts}
            isGenerating={isGenerating}
            progress={progress}
            subject={subject}
            instructions={instructions}
            sectionTitle="Bulk Generator"
            diversityScore={diversityScore}
            onRegenerateBatch={handleGenerateUniversalBatch}
            onRegenerateSingle={handleRegenerateSinglePrompt}
            onSendToMetadata={onSendToMetadata}
            onSendToRisk={onSendToRisk}
            showToast={onAddToast}
          />
        </div>
      )}

      {/* TABS 2, 3, 4: Multi-Line Metadata / Risk / Pipeline */}
      {activeTab !== 'prompts' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-extrabold text-zinc-950 dark:text-zinc-50 text-sm">
                  {activeTab === 'metadata' ? 'Bulk Metadata Generation' : activeTab === 'risk' ? 'Bulk IP & Brand Risk Scan' : 'Full Contributor Production Pipeline'}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">
                  Enter multiple concepts (one per line) to process in batch.
                </p>
              </div>

              {isGenerating && (
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  Processing {multiLineProgress.current} / {multiLineProgress.total}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Batch Concepts List (One per line)
              </label>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-medium"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-500 font-medium">
                {bulkInput.split('\n').filter(Boolean).length} lines ready to process
              </span>

              <button
                type="button"
                onClick={handleRunMultiLineMetadataOrRisk}
                disabled={isGenerating || !bulkInput.trim()}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-indigo-600/20"
              >
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Process Batch Now</span>
              </button>
            </div>
          </div>

          {/* Metadata Results Display */}
          {activeTab === 'metadata' && batchMetadata.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {batchMetadata.length} Metadata Sets Generated
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const csvData = batchMetadata.map((m, i) => ({
                        Item: i + 1,
                        Topic: m.query,
                        Title: m.title,
                        Keywords: m.keywords.join(', '),
                        Category: m.category,
                        ContentType: m.contentType
                      }));
                      exportToCSV(csvData, 'sweetprompts-bulk-metadata.csv');
                      onAddToast('Exported metadata CSV');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {batchMetadata.map((meta, idx) => (
                  <div key={meta.id || idx} className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{meta.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
                        {meta.keywords.length} tags
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {meta.keywords.slice(0, 15).map((k: string, kidx: number) => (
                        <span key={kidx} className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Results Display */}
          {activeTab === 'risk' && batchRisk.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {batchRisk.length} Scans Completed
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const csvData = batchRisk.map((r, i) => ({
                      Item: i + 1,
                      Text: r.text,
                      Status: r.overall,
                      Findings: r.findings?.map((f: any) => f.term).join(', ') || 'Clean'
                    }));
                    exportToCSV(csvData, 'sweetprompts-bulk-risk.csv');
                    onAddToast('Exported risk audit CSV');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="space-y-3">
                {batchRisk.map((risk, idx) => (
                  <div key={risk.id || idx} className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 block">{risk.text}</span>
                      <span className="text-[11px] text-zinc-400">
                        {risk.findings?.length > 0 ? `${risk.findings.length} signals detected: ${risk.findings.map((f: any) => f.term).join(', ')}` : 'Clean. No protected signals detected.'}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      risk.overall === 'SAFE' || risk.overall === 'LOW'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                        : 'bg-amber-50 text-amber-600 border-amber-300'
                    }`}>
                      {risk.overall}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline Results Display */}
          {activeTab === 'pipeline' && batchPipeline.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {batchPipeline.length} Complete Stock Pipelines Ready
                </span>
                <button
                  type="button"
                  onClick={() => {
                    exportToCSV(batchPipeline, 'sweetprompts-master-workflow.csv');
                    onAddToast('Exported master pipeline CSV');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Download Master CSV</span>
                </button>
              </div>

              <div className="space-y-3">
                {batchPipeline.map((pipe, idx) => (
                  <div key={pipe.id || idx} className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{pipe.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {pipe.category} • {pipe.contentType}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                      {pipe.prompt}
                    </p>
                    <div className="flex flex-wrap gap-1 text-[10px] pt-1">
                      {pipe.keywords?.slice(0, 10).map((k: string, kidx: number) => (
                        <span key={kidx} className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

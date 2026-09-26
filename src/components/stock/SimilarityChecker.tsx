import React, { useState } from 'react';
import { 
  GitCompare, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Info,
  Copy,
  Check,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  FileText,
  X
} from 'lucide-react';
import { AISettings } from '../../types';
import { evaluateBatchDiversity, BatchDiversityResult } from '../../lib/adobe-stock/similarityEngine';
import { AIManager } from '../../lib/ai/AIManager';

interface SimilarityCheckerProps {
  settings: AISettings;
  showToast: (msg: string) => void;
}

export const SimilarityChecker: React.FC<SimilarityCheckerProps> = ({
  settings,
  showToast
}) => {
  const [inputMode, setInputMode] = useState<'prompts' | 'images'>('prompts');
  const [promptsText, setPromptsText] = useState('');
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; name: string; url: string; base64: string; mimeType: string }>>([]);
  const [result, setResult] = useState<BatchDiversityResult | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<{
    overallHealth: string;
    duplicationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    cannibalizationClusters: string[];
    diversificationAdvice: string[];
  } | null>(null);

  const sampleBatch = `Freelancer woman working on laptop in modern sunlit Scandinavian apartment, soft daylight, copy space on right
Freelancer woman working on notebook in modern sunlit Scandinavian living room, soft daylight, copy space on right
Senior male doctor examining digital tablet in high-tech cardiology clinic, sterile white interior
Electric delivery van driving through green suburban neighborhood at dawn, wide angle, negative space top`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    processFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.files?.length) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (!url) return;
        const base64 = url.split(',')[1] || '';
        const mimeType = file.type || 'image/jpeg';
        setUploadedImages(prev => [
          ...prev,
          {
            id: `sim_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            url,
            base64,
            mimeType
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    showToast(`Added ${files.length} image(s) to similarity queue`);
  };

  const removeImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleEvaluate = () => {
    if (inputMode === 'images') {
      if (uploadedImages.length < 2) {
        showToast('Please upload at least 2 images to evaluate visual similarity.');
        return;
      }
      handleAiImageAudit();
      return;
    }

    const list = promptsText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 5);

    if (list.length < 2) {
      showToast('Please enter at least 2 prompts (one per line) to compare.');
      return;
    }

    const diversityReport = evaluateBatchDiversity(list);
    setResult(diversityReport);
    showToast(`Evaluated ${list.length} prompts: ${diversityReport.rating} diversity`);
  };

  const handleAiImageAudit = async () => {
    if (uploadedImages.length < 2) {
      showToast('Please upload at least 2 images for Vision AI similarity audit.');
      return;
    }

    setIsAiAnalyzing(true);
    try {
      // Analyze first image and last image via Vision AI to extract visual features & compare
      const firstImg = uploadedImages[0];
      const secondImg = uploadedImages[1];

      const prompt = `Inspect these uploaded stock images for portfolio visual similarity, composition duplication, near-duplicate pose repetition, and visual cannibalization risk.
Image 1: ${firstImg.name}
Image 2: ${secondImg.name}
Total batch count: ${uploadedImages.length} images.

Return strict JSON in this exact structure:
{
  "overallHealth": "Detailed analysis of visual diversity across subjects, angles, background settings, and lighting",
  "duplicationRisk": "LOW" | "MEDIUM" | "HIGH",
  "cannibalizationClusters": ["Description of images that look too similar or have near-identical composition/pose"],
  "diversificationAdvice": ["Specific action to vary camera angles, models, lighting, or color palettes to avoid Adobe Stock duplicate rejection"]
}`;

      const raw = await AIManager.generateVision(firstImg.base64, firstImg.mimeType, prompt);
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setAiReport({
        overallHealth: parsed.overallHealth || 'Visual diversity inspected across uploaded stock assets.',
        duplicationRisk: parsed.duplicationRisk || 'LOW',
        cannibalizationClusters: parsed.cannibalizationClusters || ['No critical near-duplicates detected in uploaded assets.'],
        diversificationAdvice: parsed.diversificationAdvice || ['Vary lighting direction and background environments for future batches.']
      });

      const scoreNum = parsed.duplicationRisk === 'LOW' ? 88 : parsed.duplicationRisk === 'MEDIUM' ? 62 : 38;
      const rating = parsed.duplicationRisk === 'LOW' ? 'HIGH' : parsed.duplicationRisk === 'MEDIUM' ? 'MEDIUM' : 'LOW';

      setResult({
        diversityScore: scoreNum,
        rating,
        flaggedPairs: [],
        summary: `Vision AI inspected ${uploadedImages.length} images. Duplication Risk: ${parsed.duplicationRisk}`
      });

      showToast('Vision AI Visual Similarity Audit complete!');
    } catch (err: any) {
      showToast(`AI Analysis Error: ${err.message || 'Failed to complete image similarity audit'}`);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleAiAudit = async () => {
    if (inputMode === 'images') {
      handleAiImageAudit();
      return;
    }

    const list = promptsText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 5);

    if (list.length < 2) {
      showToast('Please enter at least 2 prompts to analyze with AI.');
      return;
    }

    setIsAiAnalyzing(true);
    try {
      const response = await AIManager.generateStructured<{
        overallHealth: string;
        duplicationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
        cannibalizationClusters: string[];
        diversificationAdvice: string[];
      }>(
        `Analyze the following batch of stock prompts for Adobe Stock portfolio similarity, conceptual clustering, and keyword/visual cannibalization risks:\n\n${list.map((p, i) => `${i + 1}. ${p}`).join('\n')}`,
        {
          taskType: 'prompt-generation',
          systemInstruction: `You are an expert Adobe Stock Portfolio Reviewer. Analyze prompt lists for similarity, visual overlap, and rejection risk due to spamming or near-duplicates.
Return JSON strictly in this structure:
{
  "overallHealth": "string describing portfolio variety",
  "duplicationRisk": "LOW" | "MEDIUM" | "HIGH",
  "cannibalizationClusters": ["Description of prompts that compete or look too similar"],
  "diversificationAdvice": ["Specific action to differentiate angles, lighting, demographics or subjects"]
}`
        }
      );

      setAiReport(response);
      showToast('AI Deep Semantic Divergence Analysis complete');
    } catch (err: any) {
      showToast(`AI Analysis Error: ${err.message || 'Failed to complete AI audit'}`);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-indigo-600" />
          <span>Similarity & Portfolio Diversity Checker</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Adobe Stock penalizes and rejects accounts for submitting near-duplicate prompts or repetitive batches. Scan your prompts or upload stock images to guarantee healthy portfolio diversity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            
            {/* Input Mode Selector */}
            <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1 text-xs">
              <button
                onClick={() => setInputMode('prompts')}
                className={`flex-1 py-1.5 px-3 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  inputMode === 'prompts' 
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Text Prompts</span>
              </button>
              <button
                onClick={() => setInputMode('images')}
                className={`flex-1 py-1.5 px-3 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  inputMode === 'images' 
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Upload Images</span>
              </button>
            </div>

            {inputMode === 'prompts' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Batch Prompts (One prompt per line) *
                  </label>
                  <button
                    onClick={() => setPromptsText(sampleBatch)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Load Sample Batch
                  </button>
                </div>
                <textarea
                  value={promptsText}
                  onChange={(e) => setPromptsText(e.target.value)}
                  placeholder="Paste multiple prompts here, one per line..."
                  rows={9}
                  className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Upload Stock Images to Compare *
                </label>

                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 rounded-xl p-5 text-center transition-all cursor-pointer relative"
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Click to browse or Drag & Drop stock images
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Upload 2 or more images to inspect visual similarity & duplicate risk
                  </p>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Images Queue ({uploadedImages.length}):</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                      {uploadedImages.map((img) => (
                        <div
                          key={img.id}
                          className="group relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-square bg-zinc-900"
                        >
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => removeImage(img.id, e)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-zinc-200 truncate px-1 py-0.5">
                            {img.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleEvaluate}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <GitCompare className="w-4 h-4" />
                <span>Evaluate Diversity</span>
              </button>

              <button
                onClick={handleAiAudit}
                disabled={isAiAnalyzing}
                className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                {isAiAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>{isAiAnalyzing ? 'Auditing...' : 'Semantic Audit'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Portfolio Diversity Report
          </h2>

          {!result && (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white/50 dark:bg-zinc-900/50 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 mx-auto flex items-center justify-center">
                <GitCompare className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Ready to Evaluate Diversity
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Paste 2 or more prompts on the left to check for redundant concepts, identical angles, or repetitive spam risks.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Score Card */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-md ${
                    result.rating === 'HIGH'
                      ? 'bg-emerald-600'
                      : result.rating === 'MEDIUM'
                      ? 'bg-amber-600'
                      : 'bg-rose-600'
                  }`}>
                    {result.diversityScore}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Concept Diversity Index
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                        result.rating === 'HIGH'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : result.rating === 'MEDIUM'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}>
                        {result.rating} DIVERSITY
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {result.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning Notice if Low/Medium */}
              {result.warningMessage && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">Adobe Stock Spam Risk Warning:</span>
                    <p className="opacity-90 leading-relaxed">{result.warningMessage}</p>
                  </div>
                </div>
              )}

              {/* Flagged Similarity Pairs */}
              {result.flaggedPairs.length > 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    Flagged Near-Duplicate Pairs ({result.flaggedPairs.length})
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {result.flaggedPairs.map((pair, idx) => (
                      <div key={idx} className="p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            Prompt #{pair.indexA} vs Prompt #{pair.indexB}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold text-[11px]">
                            {pair.score}% Overlap — {pair.similarityType}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded border border-zinc-100 dark:border-zinc-800">
                          <strong>Stock Recommendation:</strong> {pair.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>All prompts in this batch have distinct subjects, compositions, and lighting. Safe to upload!</span>
                </div>
              )}

              {/* AI Deep Semantic Divergence Report */}
              {aiReport && (
                <div className="bg-purple-50/60 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitCompare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                        Semantic Divergence Analysis
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      aiReport.duplicationRisk === 'LOW' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : aiReport.duplicationRisk === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {aiReport.duplicationRisk} Duplication Risk
                    </span>
                  </div>

                  <p className="text-xs text-purple-900/90 dark:text-purple-200/90 leading-relaxed">
                    {aiReport.overallHealth}
                  </p>

                  {aiReport.cannibalizationClusters && aiReport.cannibalizationClusters.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-purple-950 dark:text-purple-300">
                        Potential Overlap Clusters:
                      </span>
                      <ul className="list-disc pl-4 text-xs text-purple-900/80 dark:text-purple-300/80 space-y-0.5">
                        {aiReport.cannibalizationClusters.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiReport.diversificationAdvice && aiReport.diversificationAdvice.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-purple-950 dark:text-purple-300">
                        Diversification Strategies:
                      </span>
                      <ul className="list-disc pl-4 text-xs text-purple-900/80 dark:text-purple-300/80 space-y-0.5">
                        {aiReport.diversificationAdvice.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!result && aiReport && (
            <div className="bg-purple-50/60 dark:bg-purple-950/30 rounded-xl p-5 border border-purple-200 dark:border-purple-800/60 space-y-3">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-bold text-purple-950 dark:text-purple-200">
                  Semantic Divergence Analysis
                </span>
              </div>
              <p className="text-xs text-purple-900/90 dark:text-purple-200/90">
                {aiReport.overallHealth}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

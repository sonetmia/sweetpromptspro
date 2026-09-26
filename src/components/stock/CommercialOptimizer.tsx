import React, { useState } from 'react';
import { 
  TrendingUp, 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Tag, 
  ShieldAlert, 
  Layers,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  X,
  FileText
} from 'lucide-react';
import { AISettings } from '../../types';
import { callAI } from '../../lib/ai/aiService';
import { AIManager } from '../../lib/ai/AIManager';
import { sanitizePromptInput } from '../../lib/adobe-stock/promptSanitizer';
import { saveHistoryItem, saveLibraryItem } from '../../lib/storage/localStorage';

interface CommercialOptimizerProps {
  settings: AISettings;
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk: (prompt: string) => void;
}

interface CommercialAuditResult {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C';
  strengths: string[];
  weaknesses: string[];
  optimizedPrompt: string;
  copySpaceAnalysis: string;
  targetBuyerAnalysis: string;
  recommendedAspectRatios: string[];
  imagePreviewUrl?: string;
}

export const CommercialOptimizer: React.FC<CommercialOptimizerProps> = ({
  settings,
  showToast,
  onSendToMetadata,
  onSendToRisk
}) => {
  const [inputMode, setInputMode] = useState<'prompt' | 'image'>('prompt');
  const [candidatePrompt, setCandidatePrompt] = useState('');
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; name: string; url: string; base64: string; mimeType: string }>>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [commercialGoal, setCommercialGoal] = useState('Default (General Commercial Stock / As Is)');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<CommercialAuditResult | null>(null);
  const [copied, setCopied] = useState(false);

  const goalOptions = [
    'Default (General Commercial Stock / As Is)',
    'Website Hero Banner & Marketing Advertising',
    'Corporate Presentation & Annual Report Deck',
    'Social Media Paid Ads & Digital Campaigns',
    'Editorial News, Blog & Educational Publishing',
    'Packaging, Merchandising & Print Media'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    processFiles(files);
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
        const newImg = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          url,
          base64,
          mimeType
        };
        setUploadedImages(prev => [...prev, newImg]);
        setSelectedImageId(newImg.id);
      };
      reader.readAsDataURL(file);
    });
    showToast(`Added ${files.length} image(s) for commercial inspection`);
  };

  const removeImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (selectedImageId === id) {
        setSelectedImageId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  const handleOptimize = async () => {
    if (inputMode === 'prompt' && !candidatePrompt.trim()) {
      showToast('Please enter a prompt to evaluate for commercial viability.');
      return;
    }

    if (inputMode === 'image' && uploadedImages.length === 0) {
      showToast('Please upload at least one image to inspect.');
      return;
    }

    setLoading(true);
    try {
      if (inputMode === 'image') {
        const activeImg = uploadedImages.find(i => i.id === selectedImageId) || uploadedImages[0];
        if (!activeImg) {
          throw new Error('No image selected for inspection');
        }

        const visionPrompt = `You are a microstock commercial licensing director and Art Director for Adobe Stock & Getty Images.
Inspect this uploaded image for microstock commercial utility and licensing potential.
Objective: ${commercialGoal}

Provide analysis as strict JSON in this exact structure:
{
  "score": 88,
  "grade": "A",
  "strengths": ["Clear negative copy space on the right", "Authentic non-stiff human pose", "High commercial lighting"],
  "weaknesses": ["Minor clutter on background left flank"],
  "optimizedPrompt": "Full reverse-engineered commercial stock prompt accurately describing this image with pro optics, lighting, and negative space cues",
  "copySpaceAnalysis": "Specific layout advice on where headline text and branding logos can be overlaid",
  "targetBuyerAnalysis": "Which specific commercial industries and ad agencies would license this asset",
  "recommendedAspectRatios": ["16:9 Landscape", "4:5 Vertical"]
}`;

        const raw = await AIManager.generateVision(activeImg.base64, activeImg.mimeType, visionPrompt);
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const scan = sanitizePromptInput(parsed.optimizedPrompt || 'Commercial stock photograph with natural lighting');

        const result: CommercialAuditResult = {
          score: parsed.score || 88,
          grade: parsed.grade || 'A',
          strengths: parsed.strengths || ['High commercial versatility', 'Authentic composition'],
          weaknesses: parsed.weaknesses || ['Check for minor background trademarks'],
          optimizedPrompt: scan.sanitizedPrompt,
          copySpaceAnalysis: parsed.copySpaceAnalysis || 'Ample negative space available for commercial headline typography.',
          targetBuyerAnalysis: parsed.targetBuyerAnalysis || 'Marketing agencies, corporate publications, and digital ad campaigns.',
          recommendedAspectRatios: parsed.recommendedAspectRatios || ['16:9 Landscape', '3:2 Standard'],
          imagePreviewUrl: activeImg.url
        };

        setAuditResult(result);
        showToast(`Image Commercial Score: ${result.score}/100`);

      } else {
        const systemInstruction = `You are a microstock commercial licensing director and Art Director.
Evaluate the user's prompt strictly from a commercial buyer's perspective (agencies, marketing directors, web designers).
Analyze:
1. Copy space availability (where headline text can be overlaid).
2. Authenticity (relatable emotion vs cheesy fake stock pose).
3. Versatility (can multiple industries license this asset).
4. Provide a numerical Commercial Utility Score (0-100) and an optimized version of the prompt.
Output strict JSON.

JSON format:
{
  "score": 88,
  "grade": "A",
  "strengths": ["Clear commercial copy space", "Authentic non-stiff interaction"],
  "weaknesses": ["Lighting could be more directional"],
  "optimizedPrompt": "Enhanced commercial prompt with precise camera optics and negative space cues",
  "copySpaceAnalysis": "Detailed description of where and how copy space is maintained",
  "targetBuyerAnalysis": "Which specific industries and clients will license this",
  "recommendedAspectRatios": ["16:9 Landscape", "4:5 Vertical"]
}`;

        const userReq = `Candidate Prompt: "${candidatePrompt}"
Commercial Objective: ${commercialGoal}
Audit and optimize for maximum microstock sales.`;

        const raw = await callAI(userReq, systemInstruction, true);
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const scan = sanitizePromptInput(parsed.optimizedPrompt);

        const result: CommercialAuditResult = {
          score: parsed.score || 85,
          grade: parsed.grade || 'A',
          strengths: parsed.strengths || ['High buyer utility', 'Clear commercial context'],
          weaknesses: parsed.weaknesses || ['Could expand demographic representation'],
          optimizedPrompt: scan.sanitizedPrompt,
          copySpaceAnalysis: parsed.copySpaceAnalysis || 'Generous negative space preserved on the right flank for commercial typography.',
          targetBuyerAnalysis: parsed.targetBuyerAnalysis || 'Digital marketing agencies, B2B software companies, and editorial publishers.',
          recommendedAspectRatios: parsed.recommendedAspectRatios || ['16:9 Landscape', '3:2 Standard']
        };

        setAuditResult(result);

        saveHistoryItem({
          type: 'prompt',
          title: `Commercial Optimizer (Score: ${result.score}/100)`,
          summary: result.optimizedPrompt.slice(0, 100),
          data: result,
          provider: settings.provider,
          model: settings.model
        });

        showToast(`Commercial score: ${result.score}/100`);
      }
    } catch (err: any) {
      showToast(err.message || 'Commercial audit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!auditResult) return;
    navigator.clipboard.writeText(auditResult.optimizedPrompt);
    setCopied(true);
    showToast('Optimized prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <span>Commercial Stock Optimizer</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Audit prompts or upload stock images to inspect buyer utility, copy space, authentic emotion, and licensing versatility to maximize sell-through rate on Adobe Stock.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            
            {/* Input Mode Selector */}
            <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1 text-xs">
              <button
                onClick={() => setInputMode('prompt')}
                className={`flex-1 py-1.5 px-3 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  inputMode === 'prompt' 
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Text Prompt</span>
              </button>
              <button
                onClick={() => setInputMode('image')}
                className={`flex-1 py-1.5 px-3 rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  inputMode === 'image' 
                    ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>Upload Image</span>
              </button>
            </div>

            {inputMode === 'prompt' ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Candidate Prompt to Evaluate *
                </label>
                <textarea
                  value={candidatePrompt}
                  onChange={(e) => setCandidatePrompt(e.target.value)}
                  placeholder="Paste the prompt you want to optimize for commercial stock licensing..."
                  rows={4}
                  className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Upload Stock Image(s) *
                </label>

                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 rounded-xl p-5 text-center transition-all cursor-pointer relative"
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Click to browse or Drag & Drop stock images
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Supports JPG, PNG, WEBP (Supports Bulk Uploads)
                  </p>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Uploaded Files ({uploadedImages.length}):</span>
                      <span>Select image to audit</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                      {uploadedImages.map((img) => (
                        <div
                          key={img.id}
                          onClick={() => setSelectedImageId(img.id)}
                          className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all aspect-square bg-zinc-900 ${
                            selectedImageId === img.id 
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30' 
                              : 'border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100'
                          }`}
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

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Primary Commercial Goal
              </label>
              <select
                value={commercialGoal}
                onChange={(e) => setCommercialGoal(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                {goalOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOptimize}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auditing Commercial Utility...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Score & Optimize Commercial Value</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Commercial Utility Audit
          </h2>

          {!auditResult && !loading && (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white/50 dark:bg-zinc-900/50 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Ready for Commercial Optimization
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Evaluate your concept against real advertising agency requirements: copy space, multi-industry appeal, and natural lighting.
              </p>
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center bg-white dark:bg-zinc-900 space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Simulating buyer utility, negative space, and licensing breadth...
              </p>
            </div>
          )}

          {auditResult && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              {auditResult.imagePreviewUrl && (
                <div className="flex items-center gap-3 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <img src={auditResult.imagePreviewUrl} alt="Inspected Stock Asset" className="w-16 h-16 object-cover rounded-md border border-zinc-200 dark:border-zinc-700" />
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">Inspected Image Asset</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Vision AI commercial & copy space inspection</span>
                  </div>
                </div>
              )}
              {/* Score Header */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    {auditResult.score}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Commercial Viability Score
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                        GRADE {auditResult.grade}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Based on buyer utility, copy space, and microstock appeal
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-600 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Commercial Strengths
                  </span>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 text-[11px] pt-1">
                    {auditResult.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1">
                  <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Actionable Fixes
                  </span>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 text-[11px] pt-1">
                    {auditResult.weaknesses.map((w, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Optimized Prompt Output */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
                  Commercially Optimized Prompt:
                </span>
                <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-emerald-500/30 font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed select-all">
                  {auditResult.optimizedPrompt}
                </div>
              </div>

              {/* Copy Space & Buyer Analysis */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Copy Space Layout: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{auditResult.copySpaceAnalysis}</span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Target Buyers: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{auditResult.targetBuyerAnalysis}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSendToMetadata(auditResult.optimizedPrompt, 'Commercial Asset', 'Business')}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Send to Metadata</span>
                  </button>
                  <button
                    onClick={() => onSendToRisk(auditResult.optimizedPrompt)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>Scan IP Risk</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    saveLibraryItem({
                      title: 'Commercial Stock Asset',
                      prompt: auditResult.optimizedPrompt,
                      category: 'Commercial',
                      contentType: 'Photo',
                      aspectRatio: '16:9',
                      tags: ['Commercial Optimized', `Score-${auditResult.score}`]
                    });
                    showToast('Saved to Library');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Save to Library</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

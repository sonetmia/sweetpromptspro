import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  ShieldAlert, 
  Tag, 
  Copy, 
  Check, 
  RefreshCw, 
  Trash2, 
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  X,
  Wand2,
  Lock,
  CheckCircle2,
  FolderPlus,
  Info,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  ImageReferenceItem, 
  ImageToPromptResult, 
  GeneratedStockPromptItem,
  analyzeReferenceImage, 
  generatePromptsFromReferences 
} from '../../lib/ai/imageToPromptEngine';
import { AIManagerClass } from '../../lib/ai/AIManager';
import { saveLibraryItem } from '../../lib/storage/localStorage';
import { AISettings } from '../../types';

interface ImageToPromptProps {
  settings?: AISettings;
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk: (prompt: string) => void;
  onSendToPromptStudio?: (prompt: string, title?: string, category?: string) => void;
}

const aiManager = new AIManagerClass();

export const ImageToPrompt: React.FC<ImageToPromptProps> = ({
  showToast,
  onSendToMetadata,
  onSendToRisk,
  onSendToPromptStudio
}) => {
  // References state
  const [maxImages] = useState<number>(5);
  const [references, setReferences] = useState<ImageReferenceItem[]>([]);
  const [, setSelectedDrawerImage] = useState<ImageReferenceItem | null>(null);

  // Processing & Results
  const [isAnalyzingImages, setIsAnalyzingImages] = useState<boolean>(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState<boolean>(false);
  const [result, setResult] = useState<ImageToPromptResult | null>(null);
  const [showAnalysisDrawer, setShowAnalysisDrawer] = useState<boolean>(false);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vision Key status check
  const visionStatus = useMemo(() => {
    const effective = aiManager.getEffectiveProviderAndKey(undefined, undefined, true);
    return {
      hasVisionKey: Boolean(effective.apiKey),
      provider: effective.provider
    };
  }, []);

  // Process uploaded image files
  const processFiles = async (files: FileList | File[]) => {
    const remainingSlots = maxImages - references.length;
    if (remainingSlots <= 0) {
      showToast(`Maximum ${maxImages} reference images reached.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newItems: ImageReferenceItem[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) continue;

      const previewUrl = URL.createObjectURL(file);

      // Optimize image for vision AI payload (max 1920px max dimension, JPEG 0.85 quality)
      const { base64: pureBase64, width, height } = await new Promise<{ base64: string; width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const origW = img.naturalWidth || 1920;
          const origH = img.naturalHeight || 1080;
          const maxDim = 1920;
          let targetW = origW;
          let targetH = origH;

          if (origW > maxDim || origH > maxDim) {
            if (origW > origH) {
              targetW = maxDim;
              targetH = Math.round((origH * maxDim) / origW);
            } else {
              targetH = maxDim;
              targetW = Math.round((origW * maxDim) / origH);
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, targetW, targetH);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const pureBase64 = dataUrl.split(',')[1] || dataUrl;
            resolve({ base64: pureBase64, width: origW, height: origH });
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const resStr = reader.result as string;
            resolve({ base64: resStr.split(',')[1] || resStr, width: origW, height: origH });
          };
          reader.readAsDataURL(file);
        };
        img.onerror = () => {
          const reader = new FileReader();
          reader.onload = () => {
            const resStr = reader.result as string;
            resolve({ base64: resStr.split(',')[1] || resStr, width: 1920, height: 1080 });
          };
          reader.readAsDataURL(file);
        };
        img.src = previewUrl;
      });

      newItems.push({
        id: 'ref_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        file,
        previewUrl,
        filename: file.name,
        size: file.size,
        width,
        height,
        base64: pureBase64,
        mimeType: 'image/jpeg',
        status: 'Waiting'
      });
    }

    if (newItems.length > 0) {
      setReferences((prev) => [...prev, ...newItems]);
      showToast(`Added ${newItems.length} image${newItems.length > 1 ? 's' : ''}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeReference = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const item = references.find((r) => r.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    setReferences((prev) => prev.filter((r) => r.id !== id));
  };

  const clearAllReferences = () => {
    references.forEach((r) => URL.revokeObjectURL(r.previewUrl));
    setReferences([]);
    setResult(null);
    setSelectedDrawerImage(null);
    showToast('Cleared all reference images');
  };

  // Main Generation Pipeline
  const handleGeneratePrompts = async () => {
    if (references.length === 0) {
      showToast('Please upload an image first.');
      return;
    }

    if (!visionStatus.hasVisionKey) {
      showToast('Image-to-prompt requires a vision-capable AI key. Please configure your key in Settings.');
      return;
    }

    setIsAnalyzingImages(true);
    showToast('Analyzing image visual characteristics...');

    // Step 1: Analyze any un-analyzed reference images
    const updatedRefs = [...references];
    for (let i = 0; i < updatedRefs.length; i++) {
      const ref = updatedRefs[i];
      if (ref.status !== 'Analyzed' || !ref.analysis) {
        setReferences((prev) =>
          prev.map((r) => (r.id === ref.id ? { ...r, status: 'Analyzing' } : r))
        );

        try {
          const analysis = await analyzeReferenceImage(ref);
          updatedRefs[i] = { ...ref, status: 'Analyzed', analysis };
          setReferences((prev) =>
            prev.map((r) => (r.id === ref.id ? { ...r, status: 'Analyzed', analysis } : r))
          );
        } catch (err: any) {
          updatedRefs[i] = { ...ref, status: 'Failed', errorMessage: err?.message };
          setReferences((prev) =>
            prev.map((r) => (r.id === ref.id ? { ...r, status: 'Failed', errorMessage: err?.message } : r))
          );
        }
      }
    }

    setIsAnalyzingImages(false);

    // Step 2: Synthesize original prompts
    setIsGeneratingPrompts(true);
    showToast('Generating detailed prompts...');

    try {
      const promptResult = await generatePromptsFromReferences({
        references: updatedRefs.filter((r) => r.status === 'Analyzed'),
        referenceMode: 'Multiple References',
        instructions: '',
        promptCount: 5,
        commercialIntent: 'Advertising',
        contentType: 'Photo',
        negativeSpace: 'None',
        aspectRatio: '3:2',
        humanPresence: 'Automatic',
        originalityLevel: 'High',
        safeLogoTransformation: true
      });

      setResult(promptResult);
      showToast(`Generated ${promptResult.generatedPrompts.length} detailed prompt${promptResult.generatedPrompts.length > 1 ? 's' : ''}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate prompts');
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  // Copy single prompt
  const copyPrompt = (prompt: GeneratedStockPromptItem) => {
    navigator.clipboard.writeText(prompt.promptText);
    setCopiedPromptId(prompt.id);
    setTimeout(() => setCopiedPromptId(null), 2000);
    showToast(`Prompt #${prompt.promptNumber} copied to clipboard`);
  };

  // Copy all prompts (ONLY prompt text, no image names)
  const copyAllPrompts = () => {
    if (!result || result.generatedPrompts.length === 0) return;
    const allText = result.generatedPrompts
      .map((p) => p.promptText)
      .join('\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    showToast(`Copied all ${result.generatedPrompts.length} prompts to clipboard`);
  };

  // Download TXT (ONLY prompts text, no image names)
  const downloadTXT = () => {
    if (!result || result.generatedPrompts.length === 0) return;
    const content = result.generatedPrompts
      .map((p) => p.promptText)
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded prompts as TXT file');
  };

  // Download CSV
  const downloadCSV = () => {
    if (!result || result.generatedPrompts.length === 0) return;
    const headers = ['Prompt Number', 'Subject', 'Composition', 'Visual Style', 'Prompt Text'];
    const rows = result.generatedPrompts.map((p) => [
      p.promptNumber,
      `"${p.subject.replace(/"/g, '""')}"`,
      `"${p.composition.replace(/"/g, '""')}"`,
      `"${p.visualStyle.replace(/"/g, '""')}"`,
      `"${p.promptText.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-to-prompt-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded CSV spreadsheet');
  };

  // Save prompt to Stock Library
  const handleSaveToLibrary = (prompt: GeneratedStockPromptItem) => {
    saveLibraryItem({
      title: `${prompt.subject}`,
      prompt: prompt.promptText,
      category: 'Image to Prompt',
      contentType: 'Photo',
      aspectRatio: '3:2',
      keywords: ['image to prompt', 'visual concept'],
      notes: `Generated from reference image.`,
      status: 'ready'
    });
    showToast(`Saved Prompt #${prompt.promptNumber} to Library`);
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8CEBF] dark:border-[#272D30] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-[#C74A43]/10 border border-[#C74A43]/30 flex items-center justify-center text-[#C74A43]">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1A2024] dark:text-[#F3EDE2] tracking-tight">
              Image to Prompt
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#606669] dark:text-[#8C8A86]">
            Upload an image and generate detailed prompts from it.
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] text-[11px] text-[#606669] dark:text-[#8C8A86]">
          <Lock className="w-3.5 h-3.5 text-[#C74A43] shrink-0" />
          <span>Image analyzed securely via your AI key.</span>
        </div>
      </div>

      {/* 2. SIMPLE UPLOAD AREA */}
      <div className="p-4 sm:p-5 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-xl space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#D8CEBF]/60 dark:border-[#272D30]/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1A2024] dark:text-[#F3EDE2] uppercase tracking-wider">
              UPLOAD IMAGE
            </span>
            {references.length > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#C74A43]/10 text-[#C74A43] font-semibold">
                {references.length} image{references.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {references.length > 0 && (
            <button
              onClick={clearAllReferences}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43]/60 rounded-lg p-6 bg-[#F5F0E6]/50 dark:bg-[#090B0D]/50 transition-colors"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
          />

          {references.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#EDE6D8] dark:bg-[#171E24] border border-[#D8CEBF] dark:border-[#272D30] flex items-center justify-center text-[#C74A43]">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-[#1A2024] dark:text-[#F3EDE2]">
                  Drop image here
                </div>
                <div className="text-xs text-[#606669] dark:text-[#8C8A86]">
                  JPG, JPEG, PNG, WEBP
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-lg bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] text-xs font-semibold tracking-wide transition-all cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Thumbnails grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {references.map((ref, idx) => (
                  <div
                    key={ref.id}
                    className="relative group bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] rounded-lg p-2 transition-all flex flex-col justify-between"
                  >
                    <div className="relative aspect-4/3 rounded overflow-hidden bg-black/20 border border-[#D8CEBF]/50 dark:border-[#272D30]/50">
                      <img
                        src={ref.previewUrl}
                        alt={ref.filename}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                        0{idx + 1}
                      </span>
                      <button
                        onClick={(e) => removeReference(ref.id, e)}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="mt-2 space-y-1 min-w-0">
                      <div className="text-[11px] font-semibold text-[#1A2024] dark:text-[#F3EDE2] truncate" title={ref.filename}>
                        {ref.filename}
                      </div>
                      <div className="text-[10px] text-[#606669] dark:text-[#8C8A86] flex items-center justify-between">
                        <span>{ref.width}×{ref.height}</span>
                        <span>{(ref.size / 1024 / 1024).toFixed(1)}MB</span>
                      </div>

                      {/* Status */}
                      <div className="pt-1">
                        {ref.status === 'Analyzed' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Ready</span>
                          </span>
                        ) : ref.status === 'Analyzing' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            <span>Analyzing...</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#606669] dark:text-[#8C8A86] bg-[#D8CEBF]/40 dark:bg-[#272D30]/60 px-1.5 py-0.5 rounded">
                            <span>Ready</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add More button */}
                {references.length < maxImages && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-4/3 sm:aspect-auto h-full border-2 border-dashed border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] rounded-lg p-3 flex flex-col items-center justify-center gap-1 text-[#606669] dark:text-[#8C8A86] hover:text-[#C74A43] transition-colors cursor-pointer min-h-[110px]"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[11px] font-medium">+ Add Image</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. GENERATE BUTTON */}
      <div>
        {!visionStatus.hasVisionKey ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Image-to-prompt requires a vision-capable provider (Google Gemini, Groq, or OpenRouter).</span>
            </div>
            <a
              href="#settings"
              onClick={(e) => {
                e.preventDefault();
                showToast('Open Settings to add a Gemini or Groq API key.');
              }}
              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 cursor-pointer text-center"
            >
              Configure Provider Key
            </a>
          </div>
        ) : (
          <button
            onClick={handleGeneratePrompts}
            disabled={isAnalyzingImages || isGeneratingPrompts || references.length === 0}
            className="w-full py-3.5 px-6 rounded-xl bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] text-sm font-semibold tracking-wide shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {isAnalyzingImages || isGeneratingPrompts ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isAnalyzingImages ? 'Analyzing Image...' : 'Generating Prompts...'}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate Prompts →</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 4. OPTIONAL VISUAL ANALYSIS (COLLAPSIBLE) */}
      {references.some((r) => r.analysis) && (
        <div className="p-4 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#C74A43]" />
              <span className="text-xs font-semibold text-[#1A2024] dark:text-[#F3EDE2] uppercase tracking-wider">
                Detected Visual Details
              </span>
            </div>
            <button
              onClick={() => setShowAnalysisDrawer(!showAnalysisDrawer)}
              className="text-xs text-[#C74A43] hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>{showAnalysisDrawer ? 'Hide Details' : 'Show Details'}</span>
              {showAnalysisDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showAnalysisDrawer && (
            <div className="pt-2 space-y-3 border-t border-[#D8CEBF]/60 dark:border-[#272D30]/60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {references.filter((r) => r.analysis).map((r, i) => (
                  <div key={r.id} className="p-3 bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] rounded-lg text-xs space-y-1.5">
                    <div className="font-semibold text-[#1A2024] dark:text-[#F3EDE2]">
                      [0{i + 1}] {r.filename}
                    </div>

                    <div className="text-[11px] text-[#606669] dark:text-[#8C8A86] space-y-1">
                      <div><strong>Subject:</strong> {r.analysis?.subject}</div>
                      <div><strong>Composition:</strong> {r.analysis?.composition}</div>
                      <div><strong>Lighting:</strong> {r.analysis?.lighting}</div>
                      <div><strong>Color Palette:</strong> {r.analysis?.colorPalette.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. GENERATED PROMPTS OUTPUT LIST */}
      {result && result.generatedPrompts.length > 0 && (
        <div className="space-y-5">
          {/* Output Header & Export Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#D8CEBF] dark:border-[#272D30] pb-3">
            <div>
              <h2 className="text-base font-semibold text-[#1A2024] dark:text-[#F3EDE2] tracking-tight">
                Generated Detailed Prompts ({result.generatedPrompts.length})
              </h2>
              <p className="text-xs text-[#606669] dark:text-[#8C8A86]">
                Original prompt descriptions based on visual analysis
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyAllPrompts}
                className="px-3 py-1.5 rounded-md bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'Copied All' : 'Copy All'}</span>
              </button>

              <button
                onClick={downloadTXT}
                className="px-3 py-1.5 rounded-md bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#C74A43]" />
                <span>Download TXT</span>
              </button>

              <button
                onClick={downloadCSV}
                className="px-3 py-1.5 rounded-md bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#C74A43]" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {/* Warnings if any brand trademarks were safely converted */}
          {result.overallReferenceSummary.detectedRiskWarnings.length > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Safe Unbranded Transformation Applied</span>
              </div>
              <ul className="text-xs text-amber-900 dark:text-amber-200/90 space-y-0.5 pl-5 list-disc">
                {result.overallReferenceSummary.detectedRiskWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Prompts Cards */}
          <div className="space-y-4">
            {result.generatedPrompts.map((promptItem) => (
              <div
                key={promptItem.id}
                className="p-4 sm:p-5 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-xl space-y-3 shadow-xs"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 border-b border-[#D8CEBF]/60 dark:border-[#272D30]/60 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#C74A43] font-mono bg-[#C74A43]/10 px-2 py-0.5 rounded">
                      PROMPT 0{promptItem.promptNumber}
                    </span>
                    <span className="text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] truncate max-w-xs sm:max-w-md">
                      {promptItem.subject}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    Original Concept
                  </span>
                </div>

                {/* Main Prompt Text Container */}
                <div className="p-3.5 bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] rounded-lg text-xs font-mono text-[#1A2024] dark:text-[#F3EDE2] leading-relaxed">
                  {promptItem.promptText}
                </div>

                {/* Attributes Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#606669] dark:text-[#8C8A86]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span><strong>Composition:</strong> {promptItem.composition}</span>
                    <span>•</span>
                    <span><strong>Style:</strong> {promptItem.visualStyle}</span>
                    <span>•</span>
                    <span><strong>Color:</strong> {promptItem.colorPalette}</span>
                  </div>
                </div>

                {/* Per-Prompt Actions */}
                <div className="pt-2 border-t border-[#D8CEBF]/60 dark:border-[#272D30]/60 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => copyPrompt(promptItem)}
                      className="px-2.5 py-1.5 rounded bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPromptId === promptItem.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPromptId === promptItem.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => handleSaveToLibrary(promptItem)}
                      className="px-2.5 py-1.5 rounded bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] flex items-center gap-1 cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3 text-[#C74A43]" />
                      <span>Save</span>
                    </button>

                    {onSendToPromptStudio && (
                      <button
                        onClick={() => onSendToPromptStudio(promptItem.promptText, promptItem.subject)}
                        className="px-2.5 py-1.5 rounded bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] flex items-center gap-1 cursor-pointer"
                      >
                        <Wand2 className="w-3 h-3 text-[#C74A43]" />
                        <span>Improve</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSendToMetadata(promptItem.promptText, promptItem.subject)}
                      className="px-2.5 py-1.5 rounded bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] flex items-center gap-1 cursor-pointer"
                    >
                      <Tag className="w-3 h-3" />
                      <span>Metadata</span>
                    </button>

                    <button
                      onClick={() => onSendToRisk(promptItem.promptText)}
                      className="px-2.5 py-1.5 rounded bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      <span>IP Check</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#EDE6D8]/60 dark:bg-[#11161A]/60 border border-[#D8CEBF] dark:border-[#272D30] rounded-lg text-[11px] text-[#606669] dark:text-[#8C8A86] flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[#C74A43] shrink-0" />
            <span>
              Detailed prompts generated based on visual composition and characteristics of your uploaded image.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

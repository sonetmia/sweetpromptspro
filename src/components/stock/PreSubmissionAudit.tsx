import React, { useState, useRef } from 'react';
import { 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ShieldAlert, 
  Tag, 
  Copy, 
  Check, 
  Download,
  Info,
  Layers,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  Sparkles,
  Zap,
  Maximize2
} from 'lucide-react';
import { AISettings } from '../../types';
import { runPreSubmissionCheck, PreSubmissionReport } from '../../lib/adobe-stock/preSubmissionCheck';
import { AIManager } from '../../lib/ai/AIManager';

interface AuditImageScanResult {
  acceptanceProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  visualQualityScore: number;
  copyrightLogosDetected: string[];
  aiArtifactsDetected: string[];
  modelReleaseRequired: boolean;
  propertyReleaseRequired: boolean;
  summaryNotes: string;
  recommendedFixes: string[];
}

interface AuditImageItem {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
  name: string;
  sizeFormatted: string;
  width: number;
  height: number;
  isScanning?: boolean;
  scanResult?: AuditImageScanResult;
  scanError?: string;
}

interface PreSubmissionAuditProps {
  settings: AISettings;
  showToast: (msg: string) => void;
  onSendToMetadata?: (prompt: string, title?: string, category?: string) => void;
}

export const PreSubmissionAudit: React.FC<PreSubmissionAuditProps> = ({
  settings,
  showToast,
  onSendToMetadata
}) => {
  const [uploadedImages, setUploadedImages] = useState<AuditImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isBulkScanning, setIsBulkScanning] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata Audit States
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [hasPeople, setHasPeople] = useState(false);
  const [hasProperty, setHasProperty] = useState(false);
  const [isAIContent, setIsAIContent] = useState(true);
  const [report, setReport] = useState<PreSubmissionReport | null>(null);
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [aiReview, setAiReview] = useState<{
    acceptanceProbability: number;
    commercialRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK';
    reviewerNotes: string;
    criticalFlags: string[];
    optimizationTips: string[];
  } | null>(null);

  // Optimize and process uploaded image files
  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      showToast('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    const newImages: AuditImageItem[] = [];

    for (const file of fileArray) {
      const previewUrl = URL.createObjectURL(file);
      const { base64, mimeType, width, height } = await optimizeImageFile(file);
      const newId = `audit_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      newImages.push({
        id: newId,
        file,
        previewUrl,
        base64,
        mimeType,
        name: file.name,
        sizeFormatted: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        width,
        height,
      });
    }

    setUploadedImages(prev => {
      const updated = [...prev, ...newImages];
      if (!selectedImageId && updated.length > 0) {
        setSelectedImageId(updated[0].id);
      }
      return updated;
    });

    showToast(`Added ${newImages.length} image(s) for risk inspection.`);
  };

  const optimizeImageFile = (file: File): Promise<{ base64: string; mimeType: string; width: number; height: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
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
            const base64 = dataUrl.split(',')[1] || '';
            resolve({ base64, mimeType: 'image/jpeg', width: targetW, height: targetH });
          } else {
            const rawBase64 = (e.target?.result as string || '').split(',')[1] || '';
            resolve({ base64: rawBase64, mimeType: file.type || 'image/jpeg', width: origW, height: origH });
          }
        };
        img.onerror = () => {
          const rawBase64 = (e.target?.result as string || '').split(',')[1] || '';
          resolve({ base64: rawBase64, mimeType: file.type || 'image/jpeg', width: 1920, height: 1080 });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setUploadedImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (selectedImageId === id) {
        setSelectedImageId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
    showToast('Image removed from risk queue.');
  };

  const clearAllImages = () => {
    setUploadedImages([]);
    setSelectedImageId(null);
    showToast('Cleared all uploaded risk inspection images.');
  };

  // Run AI Vision Risk Inspection on a single image
  const scanSingleImageWithVision = async (imageItem: AuditImageItem): Promise<AuditImageScanResult> => {
    const promptText = `Conduct a rigorous, professional Adobe Stock Contributor Moderation & Rejection Risk Inspection on this visual image.
File Name: "${imageItem.name}"
Metadata Prompt Context: "${prompt}"
Metadata Title Context: "${title}"
Metadata Keywords Context: "${keywordsText}"

Analyze the visual image directly for:
1. Intellectual Property & Trademarks (logos, brand signs, copyrighted art, protected product designs, car logos, clothing brands, patented shapes).
2. AI Artifacts & Visual Flaws (extra or deformed fingers, unnatural eyes, floating objects, smudged/blurry textures, weird geometry, unwanted noise/grain).
3. Model Release Obligations (recognizable human faces, portraits, distinct silhouettes, identifiable personal features or tattoos).
4. Property Release Obligations (private real estate, luxury architecture, recognizable private interiors, private vehicles/yachts).
5. Commercial Buyer Viability & Technical Quality (sharpness, lighting, composition, resolution suitability for Adobe Stock buyers).

Return JSON strictly with no markdown wrapper or extra text:
{
  "acceptanceProbability": number between 0 and 100,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "visualQualityScore": number between 0 and 100,
  "copyrightLogosDetected": ["Array of detected brand names, logos or trademark issues found in image or 'None'"],
  "aiArtifactsDetected": ["Array of visual glitches, weird details, or AI errors found in image or 'None'"],
  "modelReleaseRequired": boolean,
  "propertyReleaseRequired": boolean,
  "summaryNotes": "2-3 sentences summarizing technical inspection and market readiness.",
  "recommendedFixes": ["Actionable steps to fix flaws before uploading to Adobe Stock Contributor Portal"]
}`;

    const raw = await AIManager.generateVision(imageItem.base64, imageItem.mimeType, promptText, {
      taskType: 'vision-analysis',
    });

    let cleanJsonStr = raw.trim();
    const jsonMatch = cleanJsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanJsonStr);
    return {
      acceptanceProbability: typeof parsed.acceptanceProbability === 'number' ? parsed.acceptanceProbability : 80,
      riskLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.riskLevel) ? parsed.riskLevel : 'LOW',
      visualQualityScore: typeof parsed.visualQualityScore === 'number' ? parsed.visualQualityScore : 85,
      copyrightLogosDetected: Array.isArray(parsed.copyrightLogosDetected) ? parsed.copyrightLogosDetected : [],
      aiArtifactsDetected: Array.isArray(parsed.aiArtifactsDetected) ? parsed.aiArtifactsDetected : [],
      modelReleaseRequired: Boolean(parsed.modelReleaseRequired),
      propertyReleaseRequired: Boolean(parsed.propertyReleaseRequired),
      summaryNotes: parsed.summaryNotes || 'Visual inspection completed.',
      recommendedFixes: Array.isArray(parsed.recommendedFixes) ? parsed.recommendedFixes : [],
    };
  };

  // Scan an individual image by ID
  const scanImageById = async (id: string) => {
    const target = uploadedImages.find(i => i.id === id);
    if (!target) return;

    setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, isScanning: true, scanError: undefined } : img));

    try {
      const res = await scanSingleImageWithVision(target);
      setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, isScanning: false, scanResult: res } : img));
      showToast(`Vision risk inspection completed for ${target.name}`);
    } catch (err: any) {
      setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, isScanning: false, scanError: err.message || 'Vision scan failed' } : img));
      showToast(`Error scanning ${target.name}: ${err.message || 'Scan failed'}`);
    }
  };

  // Scan ALL uploaded images in bulk
  const scanAllImages = async () => {
    if (uploadedImages.length === 0) {
      showToast('Please upload at least one image to scan.');
      return;
    }

    setIsBulkScanning(true);
    showToast(`Starting bulk vision risk scan for ${uploadedImages.length} image(s)...`);

    for (let i = 0; i < uploadedImages.length; i++) {
      const current = uploadedImages[i];
      setSelectedImageId(current.id);
      setUploadedImages(prev => prev.map(img => img.id === current.id ? { ...img, isScanning: true, scanError: undefined } : img));

      try {
        const result = await scanSingleImageWithVision(current);
        setUploadedImages(prev => prev.map(img => img.id === current.id ? { ...img, isScanning: false, scanResult: result } : img));
      } catch (err: any) {
        setUploadedImages(prev => prev.map(img => img.id === current.id ? { ...img, isScanning: false, scanError: err.message || 'Vision scan failed' } : img));
      }
    }

    setIsBulkScanning(false);
    showToast('Bulk vision risk inspection complete!');
  };

  const handleAudit = () => {
    if (!prompt.trim() && !title.trim() && uploadedImages.length === 0) {
      showToast('Please enter prompt/title or upload image(s) to audit.');
      return;
    }

    const keywords = keywordsText
      .split(/[\n,]+/)
      .map(k => k.trim())
      .filter(Boolean);

    const generatedReport = runPreSubmissionCheck({
      prompt,
      title,
      keywords,
      isAIContent,
      hasPeople: hasPeople || uploadedImages.some(i => i.scanResult?.modelReleaseRequired),
      hasProperty: hasProperty || uploadedImages.some(i => i.scanResult?.propertyReleaseRequired)
    });

    setReport(generatedReport);
    showToast('Pre-Submission audit completed');
  };

  const handleAiReview = async () => {
    if (!prompt.trim() && !title.trim() && uploadedImages.length === 0) {
      showToast('Please enter prompt, title, or upload image(s) for AI Inspector Review.');
      return;
    }

    // If images exist but aren't scanned yet, scan selected image or first image
    if (uploadedImages.length > 0) {
      const target = uploadedImages.find(i => i.id === selectedImageId) || uploadedImages[0];
      if (!target.scanResult) {
        await scanImageById(target.id);
      }
    }

    setIsAiAuditing(true);
    try {
      const response = await AIManager.generateStructured<{
        acceptanceProbability: number;
        commercialRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK';
        reviewerNotes: string;
        criticalFlags: string[];
        optimizationTips: string[];
      }>(
        `Conduct an in-depth simulated Adobe Stock Content Moderation & Quality Inspection for this submission asset:
Prompt: "${prompt}"
Title: "${title}"
Keywords: "${keywordsText}"
Uploaded Images Count: ${uploadedImages.length}
Contains People: ${hasPeople ? 'Yes' : 'No'}
Contains Property: ${hasProperty ? 'Yes' : 'No'}
Is Generative AI: ${isAIContent ? 'Yes' : 'No'}`,
        {
          taskType: 'prompt-generation',
          systemInstruction: `You are an elite Adobe Stock Senior Reviewer & Compliance Specialist.
Simulate how Adobe Stock moderation will judge this asset for legal safety, visual quality, commercial buyers, and metadata compliance.
Return JSON strictly:
{
  "acceptanceProbability": number between 0 and 100,
  "commercialRating": "EXCELLENT" | "GOOD" | "NEEDS_WORK",
  "reviewerNotes": "string of 2-3 sentences evaluating readiness and commercial viability",
  "criticalFlags": ["Array of potential rejection risks (e.g. copyright, trademark, artifacts, missing model release)"],
  "optimizationTips": ["Concrete suggestions to maximize sales and acceptance"]
}`
        }
      );

      setAiReview(response);
      showToast('AI Inspector Review completed');
    } catch (err: any) {
      showToast(`AI Review Error: ${err.message || 'Inspection failed'}`);
    } finally {
      setIsAiAuditing(false);
    }
  };

  const selectedImage = uploadedImages.find(i => i.id === selectedImageId);

  // Filter tabs for uploaded images
  const [filterMode, setFilterMode] = useState<'ALL' | 'IP_RISK' | 'CLEAN'>('ALL');

  // Computed IP stats
  const scannedImages = uploadedImages.filter(i => Boolean(i.scanResult));
  const ipRiskImages = uploadedImages.filter(i => {
    if (!i.scanResult) return false;
    const hasLogos = i.scanResult.copyrightLogosDetected.length > 0 && !i.scanResult.copyrightLogosDetected.includes('None');
    return i.scanResult.riskLevel === 'HIGH' || i.scanResult.riskLevel === 'MEDIUM' || hasLogos;
  });
  const cleanImages = uploadedImages.filter(i => {
    if (!i.scanResult) return false;
    const noLogos = i.scanResult.copyrightLogosDetected.length === 0 || i.scanResult.copyrightLogosDetected.includes('None');
    return i.scanResult.riskLevel === 'LOW' && noLogos;
  });

  const filteredImages = uploadedImages.filter(img => {
    if (filterMode === 'IP_RISK') return ipRiskImages.some(i => i.id === img.id);
    if (filterMode === 'CLEAN') return cleanImages.some(i => i.id === img.id);
    return true;
  });

  const copyBulkIPReport = () => {
    if (scannedImages.length === 0) {
      showToast('No scanned images to copy report from.');
      return;
    }

    const lines = scannedImages.map((img, idx) => {
      const res = img.scanResult;
      const logos = res?.copyrightLogosDetected.join(', ') || 'None';
      const artifacts = res?.aiArtifactsDetected.join(', ') || 'None';
      return `Image #${idx + 1}: ${img.name}
Risk Level: ${res?.riskLevel || 'UNSCANNED'} (${res?.acceptanceProbability}% Acceptance)
IP & Trademarks Detected: ${logos}
AI Glitches: ${artifacts}
Model Release Required: ${res?.modelReleaseRequired ? 'YES' : 'NO'}
Property Release Required: ${res?.propertyReleaseRequired ? 'YES' : 'NO'}
Recommended Fix: ${res?.recommendedFixes.join(' | ') || 'None'}
----------------------------------------`;
    });

    navigator.clipboard.writeText(`BULK IP & TRADEMARK COMPLIANCE REPORT (${scannedImages.length} Images)\n\n` + lines.join('\n'));
    showToast('Copied Bulk IP & Trademark Report to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Pre-Submission Stock Compliance & Risk Checker</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Bulk upload image assets and run automated 14-point compliance & AI Vision risk analysis before submitting to Adobe Stock.
          </p>
        </div>

        {uploadedImages.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={scanAllImages}
              disabled={isBulkScanning}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isBulkScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>{isBulkScanning ? `Scanning Bulk Images...` : `Scan All (${uploadedImages.length}) Images`}</span>
            </button>
            <button
              onClick={clearAllImages}
              className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium transition-all cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Bulk Image Upload Drag & Drop Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Bulk Image Risk Upload Section ({uploadedImages.length} Images Loaded)
            </h2>
          </div>
          <span className="text-[11px] text-zinc-400">
            Drag & drop multiple files or click browse
          </span>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragOver 
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.005]' 
              : 'border-zinc-300 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-zinc-50/60 dark:bg-zinc-800/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept="image/*"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Click or Drop <span className="text-indigo-600 dark:text-indigo-400 font-bold">Multiple Images</span> Here
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Upload JPG, PNG or WebP files for instant Vision AI IP & Trademark Risk Scan
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded Image Thumbnails Grid & Bulk IP Dashboard Controls */}
        {uploadedImages.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterMode === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  All ({uploadedImages.length})
                </button>
                <button
                  onClick={() => setFilterMode('IP_RISK')}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    filterMode === 'IP_RISK'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>IP & Logo Risks ({ipRiskImages.length})</span>
                </button>
                <button
                  onClick={() => setFilterMode('CLEAN')}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    filterMode === 'CLEAN'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Clean ({cleanImages.length})</span>
                </button>
              </div>

              {/* Bulk Actions */}
              <div className="flex items-center gap-2">
                {scannedImages.length > 0 && (
                  <button
                    onClick={copyBulkIPReport}
                    className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Copy Bulk IP Report</span>
                  </button>
                )}
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredImages.map((img) => {
                const isSelected = img.id === selectedImageId;
                const hasResult = Boolean(img.scanResult);
                const riskLevel = img.scanResult?.riskLevel;

                return (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImageId(img.id)}
                    className={`relative group rounded-xl overflow-hidden border transition-all cursor-pointer bg-zinc-900 aspect-square ${
                      isSelected 
                        ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-md scale-[1.02]' 
                        : 'border-zinc-200 dark:border-zinc-800 opacity-90 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                    {/* Top Badges */}
                    <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1">
                      {img.isScanning ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Scanning
                        </span>
                      ) : hasResult ? (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          riskLevel === 'LOW' 
                            ? 'bg-emerald-500 text-white' 
                            : riskLevel === 'MEDIUM' 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-rose-600 text-white'
                        }`}>
                          {riskLevel} RISK
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/60 text-zinc-300">
                          Unscanned
                        </span>
                      )}

                      <button
                        onClick={(e) => removeImage(img.id, e)}
                        className="p-1 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Bottom File Info */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 text-white text-[10px] truncate font-medium">
                      <p className="truncate drop-shadow">{img.name}</p>
                      {img.scanResult?.copyrightLogosDetected && img.scanResult.copyrightLogosDetected.length > 0 && !img.scanResult.copyrightLogosDetected.includes('None') && (
                        <p className="text-[9px] text-rose-300 truncate font-bold">
                          ⚠️ {img.scanResult.copyrightLogosDetected[0]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bulk IP Scan Summary Matrix Table */}
            {scannedImages.length > 0 && (
              <div className="mt-4 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
                <div className="p-3 bg-zinc-800/80 border-b border-zinc-700/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-400" />
                    Bulk IP & Trademark Risk Summary Matrix ({scannedImages.length} Scanned)
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {ipRiskImages.length} Warning(s) • {cleanImages.length} Clean
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-800/50 text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="p-2.5">Image Name</th>
                        <th className="p-2.5">IP / Trademark Risk</th>
                        <th className="p-2.5">Detected Logos / Brands</th>
                        <th className="p-2.5">Model / Prop. Release</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {scannedImages.map((img) => {
                        const res = img.scanResult;
                        const hasLogos = res?.copyrightLogosDetected && res.copyrightLogosDetected.length > 0 && !res.copyrightLogosDetected.includes('None');
                        return (
                          <tr key={img.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="p-2.5 font-medium text-zinc-200 max-w-[180px] truncate">
                              {img.name}
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                res?.riskLevel === 'LOW' 
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                                  : res?.riskLevel === 'MEDIUM' 
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}>
                                {res?.riskLevel} RISK ({res?.acceptanceProbability}%)
                              </span>
                            </td>
                            <td className="p-2.5 text-zinc-300 text-[11px]">
                              {hasLogos ? (
                                <span className="text-rose-400 font-semibold">
                                  🚨 {res?.copyrightLogosDetected.join(', ')}
                                </span>
                              ) : (
                                <span className="text-emerald-400">✓ No logos detected</span>
                              )}
                            </td>
                            <td className="p-2.5 text-[11px]">
                              {res?.modelReleaseRequired || res?.propertyReleaseRequired ? (
                                <span className="text-amber-400 font-medium">
                                  {res?.modelReleaseRequired ? 'Model ' : ''}
                                  {res?.propertyReleaseRequired ? 'Property ' : ''}
                                  Release Needed
                                </span>
                              ) : (
                                <span className="text-zinc-500">None</span>
                              )}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => setSelectedImageId(img.id)}
                                className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition-all cursor-pointer"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Image Vision Risk Detail Card */}
      {selectedImage && (
        <div className="bg-indigo-950/20 dark:bg-indigo-950/40 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800/60 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-200/60 dark:border-indigo-800/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-indigo-300 dark:border-indigo-700 bg-black shrink-0">
                <img src={selectedImage.previewUrl} alt={selectedImage.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-xs sm:max-w-md">
                  Active Image: {selectedImage.name}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {selectedImage.width}x{selectedImage.height} px • {selectedImage.sizeFormatted}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => scanImageById(selectedImage.id)}
                disabled={selectedImage.isScanning}
                className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {selectedImage.isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{selectedImage.isScanning ? 'Inspecting...' : selectedImage.scanResult ? 'Re-Inspect Image' : 'Run Vision Risk Scan'}</span>
              </button>
            </div>
          </div>

          {/* Vision Scan Result Display */}
          {selectedImage.scanResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Rejection Risk Level</span>
                  <div className="flex items-center gap-1.5">
                    {selectedImage.scanResult.riskLevel === 'LOW' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {selectedImage.scanResult.riskLevel === 'MEDIUM' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    {selectedImage.scanResult.riskLevel === 'HIGH' && <XCircle className="w-4 h-4 text-rose-500" />}
                    <span className={`text-xs font-extrabold ${
                      selectedImage.scanResult.riskLevel === 'LOW' ? 'text-emerald-600' :
                      selectedImage.scanResult.riskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {selectedImage.scanResult.riskLevel} REJECTION RISK
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Acceptance Probability</span>
                  <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {selectedImage.scanResult.acceptanceProbability}% Ready
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Visual Quality Score</span>
                  <p className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                    {selectedImage.scanResult.visualQualityScore} / 100
                  </p>
                </div>
              </div>

              {/* Summary Notes */}
              <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-900/80 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 leading-relaxed">
                {selectedImage.scanResult.summaryNotes}
              </p>

              {/* IP & AI Glitch Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Copyright / Logos */}
                <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    Trademarks & Copyright Logos:
                  </span>
                  {selectedImage.scanResult.copyrightLogosDetected.length > 0 ? (
                    <ul className="list-disc pl-4 text-rose-600 dark:text-rose-400 space-y-0.5 text-[11px]">
                      {selectedImage.scanResult.copyrightLogosDetected.map((logo, idx) => (
                        <li key={idx}>{logo}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ No visible trademarks or brand logos detected.
                    </p>
                  )}
                </div>

                {/* AI Artifacts */}
                <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    AI Artifacts & Visual Errors:
                  </span>
                  {selectedImage.scanResult.aiArtifactsDetected.length > 0 ? (
                    <ul className="list-disc pl-4 text-amber-600 dark:text-amber-400 space-y-0.5 text-[11px]">
                      {selectedImage.scanResult.aiArtifactsDetected.map((art, idx) => (
                        <li key={idx}>{art}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Clean composition with no major AI distortion found.
                    </p>
                  )}
                </div>
              </div>

              {/* Recommended Fixes */}
              {selectedImage.scanResult.recommendedFixes.length > 0 && (
                <div className="p-3 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 space-y-1.5">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200 text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Actionable Fixes Before Adobe Stock Submission:
                  </span>
                  <ul className="list-disc pl-4 text-indigo-900 dark:text-indigo-300 text-[11px] space-y-0.5">
                    {selectedImage.scanResult.recommendedFixes.map((fix, idx) => (
                      <li key={idx}>{fix}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {selectedImage.scanError && (
            <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/50 p-3 rounded-lg border border-rose-200 dark:border-rose-800">
              {selectedImage.scanError}
            </p>
          )}
        </div>
      )}

      {/* Main Audit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Image Generation Prompt Context *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Paste the prompt used to create this image asset..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Adobe Stock Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Female architect reviewing blueprints in modern office"
                className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                {title.length} characters (Recommended: 30 - 70 characters)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Keywords / Tags (Comma or line separated)
              </label>
              <textarea
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                placeholder="business, architect, blueprints, office, modern, female..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Checkbox Options */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={isAIContent}
                  onChange={(e) => setIsAIContent(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Generated with Generative AI (Requires AI checkbox on submission)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={hasPeople}
                  onChange={(e) => setHasPeople(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Features recognizable people or realistic portraits</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={hasProperty}
                  onChange={(e) => setHasProperty(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Features recognizable private real estate, interiors, or vehicles</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleAudit}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>14-Point Audit</span>
              </button>

              <button
                onClick={handleAiReview}
                disabled={isAiAuditing}
                className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                {isAiAuditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>{isAiAuditing ? 'Simulating...' : 'Inspector Simulation'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Audit Results */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Compliance Audit Report
          </h2>

          {!report && (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white/50 dark:bg-zinc-900/50 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 mx-auto flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Ready for Compliance Audit
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Upload image(s) above and fill in prompt/title to evaluate trademark safety, title quality, release obligations, and commercial viability.
              </p>
            </div>
          )}

          {report && (
            <div className="space-y-4">
              {/* Overall Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                report.overallStatus === 'GREEN'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : report.overallStatus === 'YELLOW'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              }`}>
                {report.overallStatus === 'GREEN' && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}
                {report.overallStatus === 'YELLOW' && <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />}
                {report.overallStatus === 'RED' && <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />}
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">
                    {report.headline}
                  </h3>
                  <p className="text-xs opacity-90 leading-relaxed">
                    Review the itemized checklist below before finalizing your submission on the Adobe Stock Contributor Portal.
                  </p>
                </div>
              </div>

              {/* Legal & Release Advisories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {report.aiLabelRequired && (
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" /> Generative AI Label
                    </span>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Adobe Stock requires checking "Created using generative AI tools" during asset submission.
                    </p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-zinc-500" /> Model / Property Releases
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {report.modelReleaseNotice}
                  </p>
                </div>
              </div>

              {/* 14-Point Itemized Checklist */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>14-Point Pre-Submission Audit Criteria</span>
                  <span className="text-[11px] text-zinc-500 font-normal">
                    {report.items.filter(i => i.status === 'PASS').length} / {report.items.length} Passed
                  </span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {report.items.map((item) => (
                    <div key={item.id} className="p-3 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {item.label}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {item.detail}
                        </p>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {item.status === 'PASS' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            <Check className="w-3 h-3" /> PASS
                          </span>
                        )}
                        {item.status === 'WARNING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="w-3 h-3" /> REVIEW
                          </span>
                        )}
                        {item.status === 'FAIL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            <XCircle className="w-3 h-3" /> RISK
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Inspector Simulation Card */}
              {aiReview && (
                <div className="bg-purple-50/60 dark:bg-purple-950/30 rounded-xl p-5 border border-purple-200 dark:border-purple-800/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                          Simulated Adobe Stock Inspector Review
                        </span>
                        <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80">
                          Moderation simulation by senior contributor heuristics
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        aiReview.acceptanceProbability >= 85
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : aiReview.acceptanceProbability >= 65
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {aiReview.acceptanceProbability}% Acceptance Prob.
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-purple-900/90 dark:text-purple-200/90 bg-white/60 dark:bg-zinc-900/60 p-3 rounded-lg border border-purple-100 dark:border-purple-900/50 leading-relaxed">
                    {aiReview.reviewerNotes}
                  </p>

                  {aiReview.criticalFlags && aiReview.criticalFlags.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Critical Inspection Flags:
                      </span>
                      <ul className="list-disc pl-4 text-xs text-purple-950 dark:text-purple-200 space-y-0.5">
                        {aiReview.criticalFlags.map((flag, idx) => (
                          <li key={idx}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiReview.optimizationTips && aiReview.optimizationTips.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300">
                        Commercial Optimization Tips:
                      </span>
                      <ul className="list-disc pl-4 text-xs text-purple-900/90 dark:text-purple-300/90 space-y-0.5">
                        {aiReview.optimizationTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!report && aiReview && (
            <div className="bg-purple-50/60 dark:bg-purple-950/30 rounded-xl p-5 border border-purple-200 dark:border-purple-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                    Simulated Adobe Stock Inspector Review
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {aiReview.acceptanceProbability}% Acceptance
                </span>
              </div>
              <p className="text-xs text-purple-900 dark:text-purple-200">{aiReview.reviewerNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

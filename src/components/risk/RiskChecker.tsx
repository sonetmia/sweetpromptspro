import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  RefreshCw, 
  FileText, 
  Layers, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet,
  Filter,
  Upload,
  Image as ImageIcon,
  X,
  UserCheck,
  Building2,
  Tag
} from 'lucide-react';
import { RiskCheckResult } from '../../types';
import { validateStockRisk } from '../../lib/risk/validator';
import { saveHistoryItem } from '../../lib/storage/localStorage';
import { exportToCSV, exportToJSON, exportToTXT } from '../../lib/utils/exportUtils';
import { AIManager } from '../../lib/ai/AIManager';

interface RiskCheckerProps {
  initialText?: string;
  showToast: (msg: string) => void;
}

interface BulkRiskItem extends RiskCheckResult {
  id: string;
  text: string;
}

interface ImageRiskItem {
  id: string;
  name: string;
  url: string;
  base64: string;
  mimeType: string;
  status: 'Idle' | 'Scanning' | 'Done' | 'Failed';
  report?: {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    legalSummary: string;
    detectedLogos: string[];
    modelReleaseRequired: boolean;
    propertyReleaseRequired: boolean;
    rejectionRiskReason: string;
    actionableFix: string;
  };
}

interface AiRiskReport {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  legalSummary: string;
  detectedRisks: {
    target: string;
    riskCategory: string;
    explanation: string;
    safeAlternative: string;
  }[];
  propertyReleaseRequired: boolean;
  modelReleaseRequired: boolean;
}

export const RiskChecker: React.FC<RiskCheckerProps> = ({
  initialText,
  showToast,
}) => {
  const [mode, setMode] = useState<'single' | 'bulk' | 'image'>('single');

  // Single mode state
  const [text, setText] = useState(initialText || '');
  const [result, setResult] = useState<RiskCheckResult | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiReport, setAiReport] = useState<AiRiskReport | null>(null);

  // Bulk mode state
  const [bulkInput, setBulkInput] = useState(
    'Nike athletic running sneakers on minimalist studio podium\nVintage Rolex luxury gold watch on executive dark oak desk\nModern generic electric scooter parked on city sidewalk\nSpider-Man action pose on futuristic skyscraper rooftop\nApple MacBook pro with coffee cup in sunlight office'
  );
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkRiskItem[]>([]);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Image mode state
  const [uploadedImages, setUploadedImages] = useState<ImageRiskItem[]>([]);
  const [isScanningImages, setIsScanningImages] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    processImageFiles(Array.from(e.target.files));
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.files?.length) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    processImageFiles(files);
  };

  const processImageFiles = (files: File[]) => {
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
            id: `risk_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            url,
            base64,
            mimeType,
            status: 'Idle'
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    showToast(`Added ${files.length} image(s) to IP Risk Scanner queue`);
  };

  const removeImageItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const scanImagesRisk = async () => {
    if (uploadedImages.length === 0) {
      showToast('Please upload at least one image to scan.');
      return;
    }

    setIsScanningImages(true);
    showToast('Scanning images for trademarks, logos, and copyright risks...');

    const updated = [...uploadedImages];
    for (let i = 0; i < updated.length; i++) {
      const img = updated[i];
      setUploadedImages(prev => prev.map(item => item.id === img.id ? { ...item, status: 'Scanning' } : item));

      try {
        const prompt = `Inspect this uploaded stock image strictly for Adobe Stock & Getty Images IP/Trademark rejection risks.
Analyze:
1. Visible corporate logos, brand names, swooshes, or emblems (e.g. Nike, Apple, Rolex, BMW, Coca-Cola).
2. Protected trade dress or proprietary shapes.
3. Recognizable human faces requiring Model Releases.
4. Private property, landmarks, or night architecture requiring Property Releases.

Output strict JSON in this exact structure:
{
  "overallRisk": "LOW" | "MEDIUM" | "HIGH",
  "legalSummary": "Short 2-sentence legal risk breakdown",
  "detectedLogos": ["List of detected brand logos or trademarked items, if any"],
  "modelReleaseRequired": boolean,
  "propertyReleaseRequired": boolean,
  "rejectionRiskReason": "Specific reason for potential rejection or Clean",
  "actionableFix": "How to edit, crop, or modify this image to pass stock compliance"
}`;

        const raw = await AIManager.generateVision(img.base64, img.mimeType, prompt);
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const report = {
          overallRisk: parsed.overallRisk || 'LOW',
          legalSummary: parsed.legalSummary || 'No high-risk trademarks detected.',
          detectedLogos: parsed.detectedLogos || [],
          modelReleaseRequired: Boolean(parsed.modelReleaseRequired),
          propertyReleaseRequired: Boolean(parsed.propertyReleaseRequired),
          rejectionRiskReason: parsed.rejectionRiskReason || 'Image appears compliant.',
          actionableFix: parsed.actionableFix || 'Ready for microstock upload.'
        };

        setUploadedImages(prev => prev.map(item => item.id === img.id ? { ...item, status: 'Done', report } : item));
      } catch (err) {
        setUploadedImages(prev => prev.map(item => item.id === img.id ? { ...item, status: 'Failed' } : item));
      }
    }

    setIsScanningImages(false);
    showToast('Completed image IP risk inspection!');
  };

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      setResult(validateStockRisk(initialText));
    }
  }, [initialText]);

  const handleScanSingle = () => {
    if (!text.trim()) {
      showToast('Please enter text or prompt to scan.');
      return;
    }

    const scanResult = validateStockRisk(text);
    setResult(scanResult);

    saveHistoryItem({
      type: 'risk',
      title: `Risk Scan: ${scanResult.overall} Risk`,
      summary: scanResult.summary,
      data: scanResult,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
    });

    showToast(`Risk scan completed: ${scanResult.overall} risk level`);
  };

  const handleAiScan = async () => {
    if (!text.trim()) {
      showToast('Please enter text or prompt to scan with AI.');
      return;
    }

    setIsAiScanning(true);
    try {
      const response = await AIManager.generateStructured<AiRiskReport>(
        `Conduct an exhaustive IP, Trademark, Copyright, Trade Dress, and Public Figure audit for microstock submission on this prompt or metadata:\n"${text}"`,
        {
          taskType: 'prompt-generation',
          systemInstruction: `You are a specialist Intellectual Property Attorney and Adobe Stock Compliance Auditor.
Scan the input text for explicit AND implicit risks:
1. Recognizable human faces, direct portraits, or identifiable individuals (requiring signed Model Releases; advise faceless / rear-view / silhouette alternatives).
2. Registered trademarks, brand names, corporate logos, or emblems (e.g. Nike, Apple, Rolex, Tesla, Coke, Lego, Barbie).
3. Protected proprietary designs / trade dress (e.g. iPhone notch, Converse stripe, red Louboutin sole, Porsche 911 silhouette).
4. Living celebrities, politicians, athletes, or living artists (e.g. style of Greg Rutkowski, Elon Musk, Taylor Swift).
5. Copyrighted fictional characters and franchises (e.g. Pikachu, Jedi, Marvel, Disney).
6. Architecture requiring property release (e.g. Eiffel Tower night lights, Sydney Opera House, Burj Khalifa).
7. Prohibited stock items (real currency banknotes, government seals, badges, spam buzzwords).

Return strictly JSON matching:
{
  "overallRisk": "LOW" | "MEDIUM" | "HIGH",
  "legalSummary": "2-sentence legal risk assessment for commercial stock",
  "detectedRisks": [
    {
      "target": "flagged term or concept",
      "riskCategory": "Human Face | Trademark | Logo | Trade Dress | Living Person | Copyright | Property | Prohibited",
      "explanation": "why this cannot be submitted commercially to Adobe Stock",
      "safeAlternative": "clean generic replacement"
    }
  ],
  "propertyReleaseRequired": boolean,
  "modelReleaseRequired": boolean
}`
        }
      );

      setAiReport(response);
      showToast(`AI IP Audit completed: ${response.overallRisk} risk`);
    } catch (err: any) {
      showToast(`AI Scan Error: ${err.message || 'Audit failed'}`);
    } finally {
      setIsAiScanning(false);
    }
  };

  const handleScanBulk = () => {
    const lines = bulkInput
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      showToast('Please enter at least one line to scan.');
      return;
    }

    setBulkLoading(true);
    const results: BulkRiskItem[] = [];

    lines.forEach(line => {
      const res = validateStockRisk(line);
      const item: BulkRiskItem = {
        ...res,
        id: 'risk_' + Math.random().toString(36).substr(2, 9),
        text: line,
      };
      results.push(item);

      saveHistoryItem({
        type: 'risk',
        title: `Bulk Risk Scan: ${res.overall}`,
        summary: `${res.findings.length} findings in "${line.slice(0, 40)}..."`,
        data: item,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
      });
    });

    setBulkResults(results);
    setBulkLoading(false);
    showToast(`Scanned ${results.length} items for IP & trademark risks`);
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Bulk Export Functions
  const filteredBulkResults = bulkResults.filter(item => {
    if (riskFilter === 'all') return true;
    return item.overall.toLowerCase() === riskFilter.toLowerCase();
  });

  const handleBulkExportCSV = () => {
    if (filteredBulkResults.length === 0) {
      showToast('No risk findings to export.');
      return;
    }
    const data = filteredBulkResults.map((item, idx) => ({
      Index: idx + 1,
      OriginalText: item.text,
      OverallRisk: item.overall,
      FindingsCount: item.findings.length,
      FlaggedTerms: item.findings.map(f => f.term).join('; '),
      Recommendations: item.findings.map(f => `${f.term}: ${f.recommendation}`).join(' | '),
    }));
    exportToCSV(data, `stock-risk-report-${Date.now()}.csv`);
    showToast('Exported risk assessment as CSV');
  };

  const handleBulkExportJSON = () => {
    if (filteredBulkResults.length === 0) {
      showToast('No risk findings to export.');
      return;
    }
    exportToJSON(filteredBulkResults, `stock-risk-report-${Date.now()}.json`);
    showToast('Exported risk assessment as JSON');
  };

  const handleBulkExportTXT = () => {
    if (filteredBulkResults.length === 0) {
      showToast('No risk findings to export.');
      return;
    }
    const textReport = filteredBulkResults.map((item, idx) => {
      const findingsList = item.findings.map(f => `  - [${f.level}] ${f.term} (${f.category}): ${f.reason} -> Rec: ${f.recommendation}`).join('\n');
      return `ITEM ${idx + 1}: [${item.overall} RISK]\nTEXT: "${item.text}"\nFINDINGS:\n${findingsList || '  None (Safe)'}\n`;
    }).join('\n===============================\n\n');
    exportToTXT(textReport, `stock-risk-report-${Date.now()}.txt`);
    showToast('Exported risk assessment as TXT');
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher Banner */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">IP & Trademark Risk Validator</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Scan prompts and titles against brands, trademarks, and copyright rules</p>
          </div>
        </div>

        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setMode('single')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'single'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Single Prompt Scan
          </button>
          <button
            onClick={() => setMode('bulk')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === 'bulk'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bulk Prompts Scan</span>
          </button>
          <button
            onClick={() => setMode('image')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === 'image'
                ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
            <span>Image Upload Risk Scan</span>
          </button>
        </div>
      </div>

      {mode === 'image' ? (
        /* IMAGE RISK SCAN MODE */
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-base">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  <span>Upload Stock Images for IP & Trademark Inspection</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Upload single or bulk images to scan for visible corporate logos, trademarked designs, model releases, and property release requirements.
                </p>
              </div>

              {uploadedImages.length > 0 && (
                <button
                  onClick={scanImagesRisk}
                  disabled={isScanningImages}
                  className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanningImages ? 'animate-spin' : ''}`} />
                  <span>{isScanningImages ? 'Scanning Images...' : `Scan All Images (${uploadedImages.length})`}</span>
                </button>
              )}
            </div>

            {/* Dropzone Area */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleImageDrop}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-purple-500/60 dark:hover:border-purple-500/60 bg-zinc-50 dark:bg-zinc-950/60 hover:bg-purple-50/10 dark:hover:bg-purple-950/10 rounded-xl p-8 text-center transition-all cursor-pointer relative"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-3 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Click to browse or Drag & Drop stock images here
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Supports JPG, PNG, WEBP (Supports Single or Bulk Uploads)
              </p>
            </div>

            {/* Uploaded Images List & Risk Reports */}
            {uploadedImages.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Uploaded Image Queue ({uploadedImages.length})
                  </span>
                  <button
                    onClick={() => setUploadedImages([])}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedImages.map((img) => (
                    <div 
                      key={img.id}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex gap-3 items-start">
                        <img src={img.url} alt={img.name} className="w-20 h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-900" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{img.name}</span>
                            <button
                              onClick={(e) => removeImageItem(img.id, e)}
                              className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            {img.status === 'Idle' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                                Ready to Scan
                              </span>
                            )}
                            {img.status === 'Scanning' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-semibold flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Scanning...
                              </span>
                            )}
                            {img.status === 'Done' && img.report && (
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                img.report.overallRisk === 'LOW' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                img.report.overallRisk === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                {img.report.overallRisk} RISK
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Scan Report Result if Done */}
                      {img.report && (
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                          <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                            {img.report.legalSummary}
                          </p>

                          {img.report.detectedLogos.length > 0 && (
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 space-y-0.5">
                              <span className="font-bold flex items-center gap-1">
                                <Tag className="w-3.5 h-3.5 text-rose-600" /> Detected Trademarks / Logos:
                              </span>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {img.report.detectedLogos.map((logo, lIdx) => (
                                  <span key={lIdx} className="px-1.5 py-0.5 bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 rounded text-[10px] font-mono font-bold">
                                    {logo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-400">
                            <span className={`flex items-center gap-1 ${img.report.modelReleaseRequired ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}>
                              <UserCheck className="w-3.5 h-3.5" /> Model Release: {img.report.modelReleaseRequired ? 'Required' : 'Not Needed'}
                            </span>
                            <span>•</span>
                            <span className={`flex items-center gap-1 ${img.report.propertyReleaseRequired ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}>
                              <Building2 className="w-3.5 h-3.5" /> Property Release: {img.report.propertyReleaseRequired ? 'Required' : 'Not Needed'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-medium text-[11px]">
                            <span className="font-bold">Actionable Fix: </span> {img.report.actionableFix}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : mode === 'single' ? (
        /* SINGLE SCAN MODE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  <span>IP & Trademark Scanner</span>
                </h3>
                <span className="text-xs text-zinc-400 font-mono">Brand Safety</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Prompt or Description to Scan *</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your prompt, title, or keywords here to check for protected trademarks, celebrity likeness, and brand names..."
                  rows={6}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3.5 text-sm text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleScanSingle}
                  className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-xs shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                >
                  <Search className="w-4 h-4" />
                  <span>Rule-Based Scan</span>
                </button>

                <button
                  onClick={handleAiScan}
                  disabled={isAiScanning}
                  className="py-3 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-xs shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isAiScanning ? 'animate-spin' : ''}`} />
                  <span>{isAiScanning ? 'Auditing IP...' : 'AI Deep Legal Audit'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Risk Validation Report</span>
                </h3>
                {result && (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                      result.overall === 'SAFE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      result.overall === 'LOW' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                      result.overall === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}>
                      {result.overall} RISK
                    </span>
                    <button
                      onClick={() => exportToCSV([result], `risk-scan-${Date.now()}.csv`)}
                      className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                      title="Export CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                  </div>
                )}
              </div>

              {result ? (
                <div className="flex-1 py-4 space-y-5">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                    {result.overall === 'SAFE' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    ) : result.overall === 'LOW' ? (
                      <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />
                    ) : result.overall === 'MEDIUM' ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{result.summary}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {result.findings.length === 0
                          ? 'This concept does not reference known restricted brands or copyrighted franchises.'
                          : 'Review detected signals to ensure marketplace compliance and avoid trademark rejections.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Detailed Findings ({result.findings.length})</h4>
                    {result.findings.length === 0 ? (
                      <div className="p-6 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                        No high-risk trademarks, logos, or celebrity likeness detected in text.
                      </div>
                    ) : (
                      result.findings.map((finding, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                              <span>"{finding.term}"</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                                {finding.category}
                              </span>
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              finding.level === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                              finding.level === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}>
                              {finding.level}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">{finding.reason}</p>
                          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                            <span className="font-bold">Recommendation: </span>
                            {finding.recommendation}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* AI Deep Legal Audit Report */}
                  {aiReport && (
                    <div className="mt-6 pt-5 border-t border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                            AI Deep Legal & Trademark Audit
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          aiReport.overallRisk === 'LOW' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : aiReport.overallRisk === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {aiReport.overallRisk} Legal Risk
                        </span>
                      </div>

                      <p className="text-xs text-purple-900/90 dark:text-purple-200/90 leading-relaxed bg-white/70 dark:bg-zinc-900/70 p-3 rounded-lg border border-purple-100 dark:border-purple-900/40">
                        {aiReport.legalSummary}
                      </p>

                      <div className="flex gap-4 text-xs font-semibold">
                        <span className={aiReport.propertyReleaseRequired ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          Property Release: {aiReport.propertyReleaseRequired ? 'Required / Recommended' : 'Not Required'}
                        </span>
                        <span className={aiReport.modelReleaseRequired ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          Model Release: {aiReport.modelReleaseRequired ? 'Required / Recommended' : 'Not Required'}
                        </span>
                      </div>

                      {aiReport.detectedRisks && aiReport.detectedRisks.length > 0 && (
                        <div className="space-y-2 mt-2">
                          <span className="text-[11px] font-bold text-purple-950 dark:text-purple-300">
                            AI Identified IP & Policy Liabilities ({aiReport.detectedRisks.length}):
                          </span>
                          {aiReport.detectedRisks.map((risk, idx) => (
                            <div key={idx} className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-lg border border-purple-200/70 dark:border-purple-800/40 text-xs space-y-1">
                              <div className="flex items-center justify-between font-bold text-purple-950 dark:text-purple-200">
                                <span>"{risk.target}"</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                  {risk.riskCategory}
                                </span>
                              </div>
                              <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">{risk.explanation}</p>
                              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                <strong>Safe Commercial Replacement: </strong>{risk.safeAlternative}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : aiReport ? (
                <div className="flex-1 space-y-4">
                  <div className="bg-purple-50/50 dark:bg-purple-950/20 rounded-xl p-4 space-y-3 border border-purple-200 dark:border-purple-800/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                          AI Deep Legal & Trademark Audit
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {aiReport.overallRisk} Risk
                      </span>
                    </div>
                    <p className="text-xs text-purple-900 dark:text-purple-200">{aiReport.legalSummary}</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                  <ShieldAlert className="w-12 h-12 text-zinc-400 mb-3" />
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">No prompt scanned yet</p>
                  <p className="text-xs text-zinc-500 max-w-xs mt-1">
                    Enter your prompt or keyword list to perform IP & trademark safety validation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* BULK SCAN & BULK EXPORT MODE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Batch Scan Prompts (One per line)</span>
                </h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Bulk Mode</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Paste Multiple Prompts or Titles
                </label>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  rows={8}
                  placeholder="Enter concepts one per line..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-zinc-400">
                  Count: {bulkInput.split('\n').filter(l => l.trim()).length} items queued for scan.
                </p>
              </div>

              <button
                onClick={handleScanBulk}
                disabled={bulkLoading}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-xs shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {bulkLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning items...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Scan Bulk Items ({bulkInput.split('\n').filter(l => l.trim()).length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bulk Results & Export Section */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col h-full min-h-[500px]">
              {/* Bulk Export Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Bulk Risk Results ({bulkResults.length} Items)
                  </span>
                </div>

                {bulkResults.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 text-xs">
                      {['all', 'safe', 'low', 'medium', 'high'].map(lvl => (
                        <button
                          key={lvl}
                          onClick={() => setRiskFilter(lvl)}
                          className={`px-2 py-1 rounded capitalize font-medium cursor-pointer ${
                            riskFilter === lvl ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleBulkExportCSV}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Export CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Bulk CSV</span>
                    </button>
                    <button
                      onClick={handleBulkExportJSON}
                      className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>JSON</span>
                    </button>
                    <button
                      onClick={handleBulkExportTXT}
                      className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>TXT</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bulk Results List */}
              <div className="flex-1 py-4 space-y-4 max-h-[620px] overflow-y-auto pr-1">
                {bulkResults.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-zinc-400">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">No bulk scan performed yet</p>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1">
                      Paste a list of concepts on the left and click "Scan Bulk Items" to inspect them all and export the findings.
                    </p>
                  </div>
                ) : (
                  filteredBulkResults.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 max-w-[70%] truncate">
                          #{idx + 1} • "{item.text}"
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            item.overall === 'SAFE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            item.overall === 'LOW' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                            item.overall === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}>
                            {item.overall}
                          </span>
                          <button
                            onClick={() => handleCopy(item.text, item.id)}
                            className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {item.findings.length > 0 ? (
                        <div className="space-y-1.5">
                          {item.findings.map((f, fidx) => (
                            <div key={fidx} className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex items-start gap-2">
                              <span className="font-semibold text-red-600 dark:text-red-400 font-mono">"{f.term}"</span>
                              <span className="text-zinc-500 text-[11px]">— {f.reason}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>No major trademark or brand issues detected.</span>
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

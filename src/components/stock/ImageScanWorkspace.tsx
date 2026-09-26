import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ScanSearch, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Loader2, 
  FileText, 
  Download, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCw, 
  Layers, 
  Tag, 
  FolderPlus, 
  Copy, 
  Check, 
  Info,
  ChevronRight,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { 
  ImageScanItem, 
  ImageScanResult, 
  computePerceptualHash, 
  analyzeImageCanvas, 
  runPipelineScan,
  fileToBase64 
} from '../../lib/adobe-stock/imageScanEngine';
import { auditImageTechnicalSpecs } from '../../lib/adobe-stock/technicalRules';
import { AISettings, ModuleType } from '../../types';
import { saveLibraryItem } from '../../lib/storage/localStorage';

interface ImageScanWorkspaceProps {
  settings: AISettings;
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk?: (prompt: string) => void;
}

export const ImageScanWorkspace: React.FC<ImageScanWorkspaceProps> = ({
  settings,
  showToast,
  onSendToMetadata,
}) => {
  const [items, setItems] = useState<ImageScanItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLETE' | 'REVIEW' | 'FLAG'>('ALL');
  const [isDragOver, setIsDragOver] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScanningRef = useRef(false);

  const dragCounter = useRef(0);

  const [selectedCheckIds, setSelectedCheckIds] = useState<string[]>([]);
  const [concurrency, setConcurrency] = useState<number>(2); // 2 parallel requests

  // Selected item
  const selectedItem = useMemo(() => {
    return items.find((it) => it.id === selectedId) || items[0] || null;
  }, [items, selectedId]);

  // Read image dimensions and metadata helper
  const processUploadedFiles = async (files: FileList | File[]) => {
    const newItems: ImageScanItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const previewUrl = URL.createObjectURL(file);
      const id = 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      // Load image to determine dimensions & compute perceptual hash
      const img = new Image();
      img.src = previewUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });

      const width = img.naturalWidth || 2000;
      const height = img.naturalHeight || 2000;
      const megapixels = Number(((width * height) / 1_000_000).toFixed(2));
      const dHash = await computePerceptualHash(img);
      const technicalAudit = auditImageTechnicalSpecs(
        { name: file.name, size: file.size, type: file.type },
        { width, height }
      );

      newItems.push({
        id,
        file,
        previewUrl,
        filename: file.name,
        size: file.size,
        width,
        height,
        megapixels,
        status: 'Waiting',
        dHash,
        technicalAudit
      });
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      setSelectedCheckIds((prev) => [...prev, ...newItems.map((n) => n.id)]);
      if (!selectedId) {
        setSelectedId(newItems[0].id);
      }
      showToast(`Added ${newItems.length} image${newItems.length > 1 ? 's' : ''} to bulk scan queue`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  // Checkbox multi-select helpers
  const toggleSelectAll = () => {
    if (selectedCheckIds.length === items.length) {
      setSelectedCheckIds([]);
    } else {
      setSelectedCheckIds(items.map((i) => i.id));
    }
  };

  const toggleCheckItem = (id: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setSelectedCheckIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const deleteSelected = () => {
    if (selectedCheckIds.length === 0) return;
    const toRemove = items.filter((i) => selectedCheckIds.includes(i.id));
    toRemove.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems((prev) => prev.filter((i) => !selectedCheckIds.includes(i.id)));
    setSelectedCheckIds([]);
    if (selectedId && selectedCheckIds.includes(selectedId)) {
      const remaining = items.filter((i) => !selectedCheckIds.includes(i.id));
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
    showToast(`Removed ${toRemove.length} image${toRemove.length > 1 ? 's' : ''}`);
  };

  // Copy Titles & Keywords for all completed items
  const copyAllBatchTitlesKeywords = () => {
    const completedItems = items.filter((i) => i.result && i.status !== 'Waiting' && i.status !== 'Error');
    if (completedItems.length === 0) {
      showToast('No completed scanned items available to copy.');
      return;
    }

    const lines = completedItems.map((item, idx) => {
      const title = item.result?.suggestedTitle || item.filename;
      const kw = item.result?.suggestedKeywords.slice(0, 25).join(', ') || '';
      return `[${idx + 1}] ${item.filename}\nTitle: ${title}\nKeywords: ${kw}`;
    });

    navigator.clipboard.writeText(lines.join('\n\n'));
    showToast(`Copied titles & keywords for ${completedItems.length} images`);
  };

  // Run bulk scan with parallel worker pool
  const startBulkScan = async (targetIds?: string[]) => {
    if (items.length === 0 || isScanning) return;

    const idsToScan = targetIds && targetIds.length > 0 
      ? targetIds 
      : items.filter((it) => it.status === 'Waiting' || it.status === 'Error').map((i) => i.id);

    const itemsToScan = items.filter((it) => idsToScan.includes(it.id));
    if (itemsToScan.length === 0) {
      showToast('No items waiting to scan.');
      return;
    }

    setIsScanning(true);
    isScanningRef.current = true;
    const totalToScan = itemsToScan.length;
    setScanProgress({ current: 0, total: totalToScan });

    let scannedCount = 0;
    const queue = [...itemsToScan];

    // Worker function for parallel scanning
    const worker = async () => {
      while (queue.length > 0 && isScanningRef.current) {
        const item = queue.shift();
        if (!item) break;

        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'Scanning' } : it))
        );

        try {
          const result = await runPipelineScan(item, items);
          let finalStatus: ImageScanItem['status'] = 'Complete';
          if (result.potentialRisk === 'High' || result.readinessScore < 60) {
            finalStatus = 'Needs Review';
          } else if (result.potentialRisk === 'Medium') {
            finalStatus = 'Needs Review';
          }

          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, status: finalStatus, result } : it))
          );
        } catch (err: any) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, status: 'Error', errorMessage: err?.message || 'Scan failed' }
                : it
            )
          );
        }

        scannedCount++;
        setScanProgress({ current: scannedCount, total: totalToScan });
      }
    };

    // Run 2 parallel workers
    const workers = [worker(), worker()];
    await Promise.all(workers);

    setIsScanning(false);
    isScanningRef.current = false;
    showToast(`Bulk Image Scan complete (${scannedCount}/${totalToScan} items)`);
  };

  const stopScan = () => {
    isScanningRef.current = false;
    setIsScanning(false);
    showToast('Scan paused');
  };

  // Clear all
  const clearAll = () => {
    items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    setItems([]);
    setSelectedId(null);
    showToast('Scan queue cleared');
  };

  // Remove single
  const removeItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = items.find((i) => i.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) {
      const remaining = items.filter((i) => i.id !== id);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Rescan single item
  const rescanSingle = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'Scanning' } : it))
    );

    try {
      const result = await runPipelineScan(item, items);
      const finalStatus: ImageScanItem['status'] = result.potentialRisk === 'High' || result.readinessScore < 65 ? 'Needs Review' : 'Complete';
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: finalStatus, result } : it))
      );
      showToast(`Scan complete for ${item.filename}`);
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'Error', errorMessage: err?.message } : it))
      );
    }
  };

  // Filtered items list
  const filteredItems = useMemo(() => {
    if (filterStatus === 'ALL') return items;
    if (filterStatus === 'COMPLETE') return items.filter((i) => i.status === 'Complete');
    if (filterStatus === 'REVIEW') return items.filter((i) => i.status === 'Needs Review');
    if (filterStatus === 'FLAG') return items.filter((i) => i.result?.potentialRisk === 'High');
    return items;
  }, [items, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'Complete').length;
    const review = items.filter((i) => i.status === 'Needs Review').length;
    const waiting = items.filter((i) => i.status === 'Waiting').length;
    const avgScore = completed > 0 
      ? Math.round(items.filter((i) => i.result).reduce((acc, i) => acc + (i.result?.readinessScore || 0), 0) / (completed + review || 1))
      : 0;

    return { total, completed, review, waiting, avgScore };
  }, [items]);

  // Export report
  const exportReport = (format: 'CSV' | 'JSON' | 'TXT') => {
    if (items.length === 0) return;

    let content = '';
    let filename = `adobe-stock-scan-report-${Date.now()}`;
    let mimeType = 'text/plain';

    if (format === 'JSON') {
      content = JSON.stringify(
        items.map((i) => ({
          filename: i.filename,
          dimensions: `${i.width}x${i.height}`,
          megapixels: i.megapixels,
          fileSize: (i.size / (1024 * 1024)).toFixed(2) + ' MB',
          status: i.status,
          readinessScore: i.result?.readinessScore,
          potentialRisk: i.result?.potentialRisk,
          suggestedTitle: i.result?.suggestedTitle,
          suggestedKeywords: i.result?.suggestedKeywords,
          actionItems: i.result?.actionItems,
          scannedAt: i.result?.scannedAt
        })),
        null,
        2
      );
      filename += '.json';
      mimeType = 'application/json';
    } else if (format === 'CSV') {
      const headers = ['Filename', 'Status', 'Readiness Score', 'Potential Risk', 'Megapixels', 'Dimensions', 'File Size (MB)', 'Suggested Title', 'Model Release', 'Property Release', 'AI Labeled'];
      const rows = items.map((i) => [
        `"${i.filename}"`,
        `"${i.status}"`,
        i.result?.readinessScore || 'N/A',
        `"${i.result?.potentialRisk || 'N/A'}"`,
        i.megapixels,
        `"${i.width}x${i.height}"`,
        (i.size / (1024 * 1024)).toFixed(2),
        `"${(i.result?.suggestedTitle || '').replace(/"/g, '""')}"`,
        i.result?.releasesRequired.modelRelease ? 'Yes' : 'No',
        i.result?.releasesRequired.propertyRelease ? 'Yes' : 'No',
        i.result?.releasesRequired.aiLabelRequired ? 'Yes' : 'No'
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      filename += '.csv';
      mimeType = 'text/csv';
    } else {
      content = `SWEETPROMPTS PRO - ADOBE STOCK PRE-SUBMISSION SCAN REPORT\n`;
      content += `Generated: ${new Date().toLocaleString()}\n`;
      content += `Total Assets: ${items.length} | Avg Readiness: ${stats.avgScore}/100\n`;
      content += `==========================================================\n\n`;
      items.forEach((it, idx) => {
        content += `[${idx + 1}] ${it.filename}\n`;
        content += `Dimensions: ${it.width}x${it.height}px (${it.megapixels} MP) | File Size: ${(it.size / 1024 / 1024).toFixed(2)} MB\n`;
        content += `Status: ${it.status} | Readiness Score: ${it.result?.readinessScore ?? 'Unscanned'}/100 | Risk: ${it.result?.potentialRisk ?? 'N/A'}\n`;
        if (it.result) {
          content += `Suggested Title: ${it.result.suggestedTitle}\n`;
          content += `Keywords (${it.result.suggestedKeywords.length}): ${it.result.suggestedKeywords.join(', ')}\n`;
          if (it.result.actionItems.length > 0) {
            content += `Action Items:\n  - ${it.result.actionItems.join('\n  - ')}\n`;
          }
        }
        content += `----------------------------------------------------------\n`;
      });
      filename += '.txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${format} scan report`);
  };

  // Add to library
  const handleAddToLibrary = (item: ImageScanItem) => {
    if (!item.result) return;
    saveLibraryItem({
      title: item.result.suggestedTitle,
      prompt: `Stock Photo Asset: ${item.result.suggestedTitle}`,
      category: item.result.suggestedCategory,
      contentType: 'Photo',
      aspectRatio: `${item.width}:${item.height}`,
      copySpace: item.result.suggestedCopySpace,
      keywords: item.result.suggestedKeywords,
      notes: `Image Scan Readiness Score: ${item.result.readinessScore}/100. Potential Risk: ${item.result.potentialRisk}.`,
      status: 'ready'
    });
    showToast(`Saved "${item.filename}" to Stock Library`);
  };

  // Copy inspection summary
  const copyInspectionSummary = (item: ImageScanItem) => {
    if (!item.result) return;
    const summaryText = `Adobe Stock Pre-Submission Audit: ${item.filename}
Submission Readiness Score: ${item.result.readinessScore}/100
Potential Risk: ${item.result.potentialRisk}
Resolution: ${item.width}x${item.height}px (${item.megapixels} MP)
File Size: ${(item.size / 1024 / 1024).toFixed(2)} MB

Pipeline Checks:
- File & Technical: ${item.result.checks.fileCheck.status} (${item.result.checks.fileCheck.summary})
- Visual Quality: ${item.result.checks.visualQualityCheck.status}
- Text/Logo IP: ${item.result.checks.textLogoCheck.status}
- Releases: Model: ${item.result.releasesRequired.modelRelease ? 'Yes' : 'No'} | Property: ${item.result.releasesRequired.propertyRelease ? 'Yes' : 'No'}
- Suggested Title: ${item.result.suggestedTitle}
- Keywords: ${item.result.suggestedKeywords.slice(0, 15).join(', ')}`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
    showToast('Inspection report copied to clipboard');
  };

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative space-y-6"
    >
      {/* Global Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-[#C74A43]/10 dark:bg-[#C74A43]/20 backdrop-blur-xs border-4 border-dashed border-[#C74A43] flex items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className="bg-[#EDE6D8] dark:bg-[#11161A] p-8 rounded-2xl shadow-2xl border border-[#C74A43] text-center max-w-md space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#C74A43]/20 text-[#C74A43] flex items-center justify-center animate-bounce">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#1A2024] dark:text-[#F3EDE2]">
              Drop Multiple Images Here
            </h3>
            <p className="text-xs text-[#606669] dark:text-[#8C8A86]">
              JPG, JPEG, PNG • Multiple files will be added to the scan queue
            </p>
          </div>
        </div>
      )}

      {/* 1. HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D8CEBF] dark:border-[#272D30] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-[#C74A43]/10 border border-[#C74A43]/30 flex items-center justify-center text-[#C74A43]">
              <ScanSearch className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1A2024] dark:text-[#F3EDE2] tracking-tight">
              Image Scan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#606669] dark:text-[#8C8A86]">
            Review your images before submitting to Adobe Stock.
          </p>
        </div>

        {/* Global Batch Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {items.length > 0 && (
            <>
              <button
                onClick={clearAll}
                disabled={isScanning}
                className="px-3 py-1.5 text-xs font-medium text-[#606669] dark:text-[#8C8A86] hover:text-rose-600 dark:hover:text-rose-400 border border-[#D8CEBF] dark:border-[#272D30] rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                Clear Queue
              </button>

              <div className="relative group">
                <button
                  className="px-3 py-1.5 text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#C74A43]" />
                  <span>Export Report</span>
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-36 py-1.5 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-md shadow-xl z-30 animate-fade-in">
                  <button
                    onClick={() => exportReport('CSV')}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] cursor-pointer"
                  >
                    CSV Spreadsheet
                  </button>
                  <button
                    onClick={() => exportReport('JSON')}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] cursor-pointer"
                  >
                    JSON Dataset
                  </button>
                  <button
                    onClick={() => exportReport('TXT')}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] cursor-pointer"
                  >
                    TXT Summary
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Main Scan CTA */}
          {items.length > 0 && (
            isScanning ? (
              <button
                onClick={stopScan}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning {String(scanProgress.current).padStart(2, '0')} / {String(scanProgress.total).padStart(2, '0')} (Pause)</span>
              </button>
            ) : (
              <button
                onClick={() => startBulkScan()}
                className="px-5 py-2 text-xs font-semibold text-[#F3EDE2] bg-[#C74A43] hover:bg-[#B53F39] rounded-md transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ScanSearch className="w-4 h-4" />
                <span>
                  {items.filter((i) => i.status === 'Waiting').length > 0
                    ? `Scan ${items.filter((i) => i.status === 'Waiting').length} Image${items.filter((i) => i.status === 'Waiting').length > 1 ? 's' : ''}`
                    : `Re-Scan All (${items.length})`}
                </span>
              </button>
            )
          )}
        </div>
      </div>

      {/* 2. DRAG & DROP UPLOAD ZONE (WHEN EMPTY OR AT TOP) */}
      {items.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 sm:p-14 text-center transition-all ${
            isDragOver
              ? 'border-[#C74A43] bg-[#C74A43]/5 scale-[1.005]'
              : 'border-[#D8CEBF] dark:border-[#272D30] bg-[#EDE6D8]/40 dark:bg-[#11161A]/40 hover:border-[#C74A43]/60 hover:bg-[#EDE6D8]/70 dark:hover:bg-[#11161A]/70'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#EDE6D8] dark:bg-[#171E24] border border-[#D8CEBF] dark:border-[#272D30] flex items-center justify-center text-[#C74A43] shadow-xs">
              <Upload className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-semibold text-[#1A2024] dark:text-[#F3EDE2] tracking-tight">
                DRAG & DROP IMAGES HERE
              </h3>
              <p className="text-xs text-[#606669] dark:text-[#8C8A86]">
                JPG, JPEG, PNG • Multiple files supported • Bulk image analysis
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-md bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-xs"
              >
                Browse Images
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. MAIN SCAN WORKSPACE (QUEUE + PREVIEW + 12 PIPELINE RESULTS) */}
      {items.length > 0 && (
        <div className="space-y-6">
          {/* Top Bar: Progress & Status Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-lg">
              <div className="text-[11px] font-medium text-[#606669] dark:text-[#8C8A86] uppercase tracking-wider">Total Queue</div>
              <div className="text-xl font-bold text-[#1A2024] dark:text-[#F3EDE2] mt-0.5">{stats.total}</div>
            </div>
            <div className="p-3 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-lg">
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Completed</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.completed}</div>
            </div>
            <div className="p-3 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-lg">
              <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Needs Review</div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.review}</div>
            </div>
            <div className="p-3 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-lg">
              <div className="text-[11px] font-medium text-[#C74A43] uppercase tracking-wider">Avg Readiness</div>
              <div className="text-xl font-bold text-[#C74A43] mt-0.5">
                {stats.avgScore > 0 ? `${stats.avgScore}/100` : '—'}
              </div>
            </div>
          </div>

          {/* Grid Layout: Left Column (Queue & Controls) | Right Column (Preview & Analysis) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ========================================================= */}
            {/* LEFT COLUMN: Upload Queue (4 cols on lg)                  */}
            {/* ========================================================= */}
            <div className="lg:col-span-4 space-y-3">
              {/* Queue Controls & Filters */}
              <div className="p-2.5 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCheckIds.length === items.length && items.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-[#D8CEBF] dark:border-[#272D30] text-[#C74A43] focus:ring-[#C74A43] cursor-pointer"
                      title="Select all queue items"
                    />
                    <span className="text-xs font-semibold text-[#1A2024] dark:text-[#F3EDE2]">
                      Queue ({filteredItems.length})
                    </span>
                    {selectedCheckIds.length > 0 && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#C74A43]/10 text-[#C74A43]">
                        {selectedCheckIds.length} selected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] bg-[#E2D9C7]/60 dark:bg-[#171E24] hover:bg-[#C74A43] hover:text-white rounded transition-colors flex items-center gap-1 cursor-pointer"
                      title="Add more images to bulk scan queue"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Add Images</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Bulk Action Bar for Selected Items */}
                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#D8CEBF]/60 dark:border-[#272D30]/60 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startBulkScan(selectedCheckIds)}
                      disabled={isScanning || selectedCheckIds.length === 0}
                      className="px-2 py-1 text-[11px] font-medium bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] rounded transition-all cursor-pointer disabled:opacity-40"
                    >
                      Scan Selected ({selectedCheckIds.length})
                    </button>
                    <button
                      onClick={deleteSelected}
                      disabled={selectedCheckIds.length === 0}
                      className="p-1 text-[#606669] dark:text-[#8C8A86] hover:text-rose-600 rounded cursor-pointer disabled:opacity-40"
                      title="Delete selected images"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={copyAllBatchTitlesKeywords}
                    className="px-2 py-1 text-[11px] font-medium text-[#1A2024] dark:text-[#F3EDE2] bg-[#E2D9C7]/60 dark:bg-[#171E24] hover:border-[#C74A43] rounded transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copy titles & keywords for all scanned images"
                  >
                    <Copy className="w-3 h-3 text-[#C74A43]" />
                    <span>Copy Titles & KW</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {(['ALL', 'COMPLETE', 'REVIEW', 'FLAG'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-[5px] font-medium transition-colors cursor-pointer border ${
                      filterStatus === st
                        ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#C74A43] font-semibold'
                        : 'border-[#D8CEBF] dark:border-[#272D30] text-[#606669] dark:text-[#8C8A86] hover:text-[#1A2024] dark:hover:text-[#F3EDE2]'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'COMPLETE' ? 'Complete' : st === 'REVIEW' ? 'Review' : 'High Risk'}
                  </button>
                ))}
              </div>

              {/* Animated Progress Bar during Bulk Scanning */}
              {isScanning && (
                <div className="p-2.5 bg-[#C74A43]/10 border border-[#C74A43]/30 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#C74A43]">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Batch Scanning in Progress...
                    </span>
                    <span>
                      {Math.round((scanProgress.current / (scanProgress.total || 1)) * 100)}% ({scanProgress.current}/{scanProgress.total})
                    </span>
                  </div>
                  <div className="w-full bg-[#D8CEBF] dark:bg-[#272D30] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#C74A43] h-full transition-all duration-300 rounded-full" 
                      style={{ width: `${Math.round((scanProgress.current / (scanProgress.total || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Queue Items List */}
              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {filteredItems.map((it, idx) => {
                  const isSelected = selectedItem?.id === it.id;
                  const isChecked = selectedCheckIds.includes(it.id);
                  return (
                    <div
                      key={it.id}
                      onClick={() => setSelectedId(it.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#C74A43] bg-[#C74A43]/5 shadow-xs'
                          : 'border-[#D8CEBF] dark:border-[#272D30] bg-[#EDE6D8]/50 dark:bg-[#11161A]/50 hover:border-[#C74A43]/40'
                      }`}
                    >
                      {/* Left: Checkbox + Thumbnail + Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleCheckItem(it.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-3.5 h-3.5 rounded border-[#D8CEBF] dark:border-[#272D30] text-[#C74A43] focus:ring-[#C74A43] cursor-pointer shrink-0"
                        />

                        <span className="text-[10px] font-mono font-medium text-[#606669] dark:text-[#8C8A86] w-3.5 shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        
                        <img
                          src={it.previewUrl}
                          alt={it.filename}
                          className="w-10 h-10 object-cover rounded border border-[#D8CEBF] dark:border-[#272D30] shrink-0 bg-black/10"
                        />

                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#1A2024] dark:text-[#F3EDE2] truncate max-w-[130px] sm:max-w-[150px]" title={it.filename}>
                            {it.filename}
                          </div>
                          <div className="text-[10px] text-[#606669] dark:text-[#8C8A86] flex items-center gap-1.5 mt-0.5">
                            <span>{it.megapixels} MP</span>
                            <span>•</span>
                            <span>{(it.size / 1024 / 1024).toFixed(1)} MB</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Badge & Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {it.status === 'Scanning' ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Scanning</span>
                          </span>
                        ) : it.status === 'Complete' ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>{it.result?.readinessScore}/100</span>
                          </span>
                        ) : it.status === 'Needs Review' ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>{it.result?.readinessScore || 'Review'}</span>
                          </span>
                        ) : it.status === 'Error' ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                            <XCircle className="w-2.5 h-2.5" />
                            <span>Error</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-[#606669] dark:text-[#8C8A86] bg-[#D8CEBF]/40 dark:bg-[#272D30]/60 px-2 py-0.5 rounded">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Waiting</span>
                          </span>
                        )}

                        <button
                          onClick={(e) => removeItem(it.id, e)}
                          className="p-1 text-[#8C8A86] hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========================================================= */}
            {/* RIGHT COLUMN: Large Preview & 12 Pipeline Inspection      */}
            {/* ========================================================= */}
            <div className="lg:col-span-8 space-y-5">
              {selectedItem ? (
                <div className="space-y-5">
                  {/* Top Bar for Selected Item */}
                  <div className="p-3.5 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#C74A43] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-[#1A2024] dark:text-[#F3EDE2] truncate">
                          {selectedItem.filename}
                        </div>
                        <div className="text-[11px] text-[#606669] dark:text-[#8C8A86] flex items-center gap-2 mt-0.5">
                          <span>{selectedItem.width} × {selectedItem.height} px</span>
                          <span>•</span>
                          <span>{selectedItem.megapixels} MP</span>
                          <span>•</span>
                          <span>{(selectedItem.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => rescanSingle(selectedItem.id)}
                        disabled={selectedItem.status === 'Scanning'}
                        className="px-3 py-1.5 text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] rounded-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${selectedItem.status === 'Scanning' ? 'animate-spin' : ''}`} />
                        <span>Re-Scan</span>
                      </button>

                      {selectedItem.result && (
                        <>
                          <button
                            onClick={() => copyInspectionSummary(selectedItem)}
                            className="px-3 py-1.5 text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            onClick={() => handleAddToLibrary(selectedItem)}
                            className="px-3 py-1.5 text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <FolderPlus className="w-3.5 h-3.5 text-[#C74A43]" />
                            <span>Save to Library</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Image Viewer Container */}
                  <div className="relative bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] rounded-xl overflow-hidden flex items-center justify-center min-h-[320px] max-h-[460px] group">
                    <img
                      src={selectedItem.previewUrl}
                      alt={selectedItem.filename}
                      style={{ transform: `scale(${zoomLevel})` }}
                      className="max-h-[440px] max-w-full object-contain transition-transform duration-150 select-none"
                    />

                    {/* Image Viewer Controls Overlay */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-white text-xs">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                        className="p-1 hover:text-[#C74A43] cursor-pointer"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-[11px] px-1">{Math.round(zoomLevel * 100)}%</span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                        className="p-1 hover:text-[#C74A43] cursor-pointer"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setZoomLevel(1)}
                        className="p-1 hover:text-[#C74A43] cursor-pointer ml-1"
                        title="Reset fit"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Technical badge overlay */}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 text-white text-[10px] font-mono flex items-center gap-2">
                      <span>{selectedItem.width}×{selectedItem.height}</span>
                      <span>•</span>
                      <span>{selectedItem.megapixels} MP</span>
                      <span>•</span>
                      <span className="uppercase">{selectedItem.filename.split('.').pop()}</span>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* 12-PIPELINE INSPECTION AUDIT RESULTS                     */}
                  {/* ========================================================= */}
                  {selectedItem.result ? (
                    <div className="space-y-4">
                      {/* 12. FINAL READINESS SCORE HERO CARD */}
                      <div className="p-4 sm:p-5 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-[#606669] dark:text-[#8C8A86]">
                                Pre-Submission Quality Indicator
                              </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A2024] dark:text-[#F3EDE2]">
                              Submission Readiness Score: <span className={
                                selectedItem.result.readinessScore >= 85 
                                  ? 'text-emerald-600 dark:text-emerald-400' 
                                  : selectedItem.result.readinessScore >= 65 
                                  ? 'text-amber-600 dark:text-amber-400' 
                                  : 'text-rose-600 dark:text-rose-400'
                              }>{selectedItem.result.readinessScore}/100</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#606669] dark:text-[#8C8A86]">
                              <span>Potential Risk: <strong className="text-[#1A2024] dark:text-[#F3EDE2]">{selectedItem.result.potentialRisk}</strong></span>
                              <span>•</span>
                              <span>Audit Engine: {selectedItem.result.modelUsed}</span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => {
                                onSendToMetadata(
                                  selectedItem.result?.suggestedTitle || '',
                                  selectedItem.result?.suggestedTitle,
                                  selectedItem.result?.suggestedCategory
                                );
                              }}
                              className="px-4 py-2.5 rounded-md bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              <span>Send to Metadata Studio</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Internal Pre-Submission Quality Indicator Disclaimer */}
                        <div className="mt-3.5 pt-3 border-t border-[#D8CEBF] dark:border-[#272D30] flex items-start gap-2 text-[11px] text-[#606669] dark:text-[#8C8A86]">
                          <Info className="w-3.5 h-3.5 shrink-0 text-[#C74A43] mt-0.5" />
                          <span>
                            Internal pre-submission quality indicator, NOT an Adobe acceptance prediction. SweetPrompts Pro assists your workflow; final acceptance is solely at Adobe Stock's editorial discretion.
                          </span>
                        </div>
                      </div>

                      {/* Action items banner if any issues */}
                      {selectedItem.result.actionItems.length > 0 && (
                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
                          <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Recommended Fixes Before Submission ({selectedItem.result.actionItems.length})</span>
                          </div>
                          <ul className="text-xs text-amber-900 dark:text-amber-200/90 space-y-1 pl-5 list-disc">
                            {selectedItem.result.actionItems.map((act, i) => (
                              <li key={i}>{act}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 12 Detailed Pipeline Checks */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-[#1A2024] dark:text-[#F3EDE2] uppercase tracking-wider px-1">
                          12-Dimension Adobe Stock Compliance Pipeline
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.values(selectedItem.result.checks).map((chk) => {
                            const isPass = chk.status === 'PASS';
                            const isReview = chk.status === 'REVIEW';
                            const isFlag = chk.status === 'FLAG';

                            return (
                              <div
                                key={chk.id}
                                className="p-3 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-lg space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-[#1A2024] dark:text-[#F3EDE2]">
                                    {chk.name}
                                  </span>

                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                                    isPass 
                                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                      : isReview
                                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                  }`}>
                                    {isPass ? <CheckCircle2 className="w-2.5 h-2.5" /> : isReview ? <AlertTriangle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                                    <span>{chk.status}</span>
                                  </span>
                                </div>

                                <div className="text-xs text-[#1A2024] dark:text-[#E8E4DC] font-medium">
                                  {chk.summary}
                                </div>

                                <div className="text-[11px] text-[#606669] dark:text-[#8C8A86] space-y-0.5 border-t border-[#D8CEBF]/60 dark:border-[#272D30]/60 pt-1.5">
                                  {chk.details.map((d, di) => (
                                    <div key={di} className="leading-snug">• {d}</div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Stock Metadata & Keywords Preview */}
                      <div className="p-4 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#1A2024] dark:text-[#F3EDE2] uppercase tracking-wider">
                            Generated Stock Title & Keywords
                          </span>
                          <button
                            onClick={() => {
                              onSendToMetadata(
                                selectedItem.result?.suggestedTitle || '',
                                selectedItem.result?.suggestedTitle,
                                selectedItem.result?.suggestedCategory
                              );
                            }}
                            className="text-xs text-[#C74A43] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open in Metadata Studio</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div>
                          <div className="text-[11px] text-[#606669] dark:text-[#8C8A86] font-medium mb-1">Recommended Title</div>
                          <div className="p-2.5 bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] rounded text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2]">
                            {selectedItem.result.suggestedTitle}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] text-[#606669] dark:text-[#8C8A86] font-medium mb-1.5 flex items-center justify-between">
                            <span>Keywords ({selectedItem.result.suggestedKeywords.length})</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(selectedItem.result?.suggestedKeywords.join(', ') || '');
                                showToast('Keywords copied to clipboard');
                              }}
                              className="text-[11px] text-[#606669] dark:text-[#8C8A86] hover:text-[#1A2024] dark:hover:text-[#F3EDE2] cursor-pointer"
                            >
                              Copy all
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                            {selectedItem.result.suggestedKeywords.map((kw, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] text-[11px] text-[#1A2024] dark:text-[#E8E4DC]"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    /* Not yet scanned state for selected item */
                    <div className="p-8 text-center bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-xl space-y-4">
                      <div className="w-12 h-12 mx-auto rounded-full bg-[#C74A43]/10 text-[#C74A43] flex items-center justify-center">
                        <ScanSearch className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-[#1A2024] dark:text-[#F3EDE2]">
                          Ready to Analyze This Image
                        </h4>
                        <p className="text-xs text-[#606669] dark:text-[#8C8A86] max-w-sm mx-auto">
                          Click below to run the 12-dimension Adobe Stock pre-submission review pipeline.
                        </p>
                      </div>
                      <button
                        onClick={() => rescanSingle(selectedItem.id)}
                        className="px-5 py-2 text-xs font-semibold text-[#F3EDE2] bg-[#C74A43] hover:bg-[#B53F39] rounded-md transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <ScanSearch className="w-4 h-4" />
                        <span>Run Image Scan</span>
                      </button>
                    </div>
                  )}

                </div>
              ) : null}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

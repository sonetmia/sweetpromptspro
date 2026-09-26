import React, { useState } from 'react';
import { Layers, Copy, Check, Tag, RefreshCw, FileText, Download } from 'lucide-react';
import { AISettings } from '../../types';
import { callAI } from '../../lib/ai/aiService';
import { saveHistoryItem } from '../../lib/storage/localStorage';
import { downloadFile } from '../../lib/utils/exportUtils';
import { autoSanitizePrompt } from '../../lib/adobe-stock/promptSanitizer';

interface MicrostockGeneratorProps {
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
}

export const MicrostockGenerator: React.FC<MicrostockGeneratorProps> = ({
  showToast,
  onSendToMetadata,
}) => {
  const [marketplace, setMarketplace] = useState('Adobe Stock');
  const [category, setCategory] = useState('Default (As Is / Exact)');
  const [topic, setTopic] = useState('Airport and modern air travel concept');
  const [numberPrompts, setNumberPrompts] = useState(10);
  const [negativeSpace, setNegativeSpace] = useState('85% copy space');
  const [humanFaces, setHumanFaces] = useState('No');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  
  const [loading, setLoading] = useState(false);
  const [generatedList, setGeneratedList] = useState<{ title: string; prompt: string; category: string }[]>([]);

  const marketplaces = ['Adobe Stock', 'Shutterstock', 'Freepik', 'Getty Images', 'Alamy'];
  const categories = [
    'Default (As Is / Exact)',
    'Travel & Tourism', 'Business & Corporate', 'Technology & AI', 
    'Healthcare & Medical', 'Finance & Banking', 'Lifestyle & Family',
    'Food & Beverage', 'E-commerce & Retail', 'Logistics & Shipping', 'Abstract Backgrounds'
  ];

  const handleGenerateBulk = async () => {
    if (!topic.trim()) {
      showToast('Please enter a topic.');
      return;
    }

    setLoading(true);
    try {
      const systemInstruction = `You are a professional microstock prompt generator specialized in Adobe Stock compliance. Generate exactly ${numberPrompts} distinct, commercial-ready AI image prompts for ${marketplace}.
Category: ${category}
Topic: ${topic}
Negative Space: ${negativeSpace}
Human Faces: Faceless & Anonymous (strictly NO recognizable human faces, close-up portraits, or head-on eyes; if people are depicted, frame from behind, silhouette, cropped headless, or hands-only)
Aspect Ratio: ${aspectRatio}

STRICT ADOBE STOCK COMPLIANCE RULES:
1. NEVER generate recognizable human faces or close-up portraits (always faceless, rear-view, silhouette, or hands-only).
2. NEVER include brand names, corporate logos, emblems, or registered trademarks (use generic descriptions).
3. NEVER include living artists, celebrities, or copyrighted fictional characters.
4. NEVER use spam buzzwords like "photorealistic", "8k", "trending on artstation", "octane render".
5. Ensure zero watermarks, zero text, and zero typography errors.

Ensure each prompt is uniquely varied in composition, angle, and setting.
Return a JSON array of objects:
[
  { "title": "Concise Commercial Title", "prompt": "Complete detailed brand-safe prompt string...", "category": "${category}" }
]`;

      const raw = await callAI(`Generate ${numberPrompts} stock prompts for: ${topic}`, systemInstruction, true);
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const items = (Array.isArray(parsed) ? parsed : []).map((item: any) => {
        const pScan = autoSanitizePrompt(item.prompt || '');
        return {
          title: item.title || topic,
          prompt: pScan.sanitizedPrompt,
          category: item.category || category
        };
      });
      setGeneratedList(items);

      saveHistoryItem({
        type: 'microstock',
        title: `Bulk Microstock: ${topic} (${items.length} prompts)`,
        summary: items[0]?.prompt || topic,
        data: items,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
      });

      showToast(`Generated ${items.length} commercial microstock prompts`);
    } catch (err: any) {
      showToast(err.message || 'Bulk generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (generatedList.length === 0) return;
    const csvLines = ['Title,Prompt,Category'];
    generatedList.forEach(item => {
      csvLines.push(`"${item.title.replace(/"/g, '""')}","${item.prompt.replace(/"/g, '""')}","${item.category}"`);
    });
    downloadFile(csvLines.join('\n'), `microstock-batch-${Date.now()}.csv`, 'text/csv');
    showToast('Exported bulk prompts as CSV');
  };

  const handleExportJSON = () => {
    if (generatedList.length === 0) return;
    downloadFile(JSON.stringify(generatedList, null, 2), `microstock-batch-${Date.now()}.json`, 'application/json');
    showToast('Exported bulk prompts as JSON');
  };

  const handleExportTXT = () => {
    if (generatedList.length === 0) return;
    const textData = generatedList.map((item, idx) => `[PROMPT ${idx + 1}] ${item.title}\n${item.prompt}\n`).join('\n');
    downloadFile(textData, `microstock-batch-${Date.now()}.txt`, 'text/plain');
    showToast('Exported bulk prompts as TXT');
  };

  const handleCopyAll = () => {
    if (generatedList.length === 0) return;
    const all = generatedList.map((item, idx) => `${idx + 1}. ${item.title}\n${item.prompt}`).join('\n\n');
    navigator.clipboard.writeText(all);
    showToast('Copied all bulk prompts to clipboard');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Input Form */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Bulk Generator Parameters</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Microstock Workflow</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Marketplace</label>
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-sm text-zinc-900 dark:text-zinc-100"
            >
              {marketplaces.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Category & Subcategory</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-sm text-zinc-900 dark:text-zinc-100"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Topic / Core Theme *</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Sustainable green energy and wind turbines in agricultural landscape..."
              rows={3}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-sm text-zinc-900 dark:text-zinc-100 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Number of Prompts</label>
              <select
                value={numberPrompts}
                onChange={(e) => setNumberPrompts(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-sm text-zinc-900 dark:text-zinc-100"
              >
                {[5, 10, 20, 30].map(n => <option key={n} value={n}>{n} Prompts</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-sm text-zinc-900 dark:text-zinc-100"
              >
                {['1:1', '4:5', '3:4', '16:9', '9:16', '3:2'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Negative Space</label>
              <input
                type="text"
                value={negativeSpace}
                onChange={(e) => setNegativeSpace(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Human Faces</label>
              <select
                value={humanFaces}
                onChange={(e) => setHumanFaces(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="No">No (Brand safe)</option>
                <option value="Yes">Yes (With Model Release)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateBulk}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating batch...</span>
              </>
            ) : (
              <span>Generate Bulk Prompts ({numberPrompts})</span>
            )}
          </button>
        </div>
      </div>

      {/* Results List */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[550px]">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Generated Batch ({generatedList.length})</span>
            </h3>
            {generatedList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Export CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
                  title="Export JSON"
                >
                  <span>JSON</span>
                </button>
                <button
                  onClick={handleExportTXT}
                  className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
                  title="Export TXT"
                >
                  <span>TXT</span>
                </button>
                <button
                  onClick={handleCopyAll}
                  className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                  title="Copy All"
                >
                  <Copy className="w-3 h-3" />
                  <span>All</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] space-y-3 py-4 pr-1">
            {generatedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 text-zinc-400">
                <Layers className="w-12 h-12 mb-3 text-zinc-400" />
                <p className="font-medium text-zinc-700 dark:text-zinc-300">No bulk prompts generated yet</p>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Configure parameters and generate a high-volume batch for stock submission workflows.
                </p>
              </div>
            ) : (
              generatedList.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-emerald-600">#{idx + 1} • {item.title}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.prompt);
                          showToast(`Copied prompt #${idx + 1}`);
                        }}
                        className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => onSendToMetadata(item.prompt, item.title, item.category)}
                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        <span>Metadata</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-zinc-800 dark:text-zinc-200 leading-relaxed">
                    {item.prompt}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

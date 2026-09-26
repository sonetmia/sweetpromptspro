import React, { useState } from 'react';
import { 
  Languages, 
  Copy, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  Tag, 
  ShieldAlert, 
  Layers
} from 'lucide-react';
import { AISettings } from '../../types';
import { callAI } from '../../lib/ai/aiService';
import { sanitizePromptInput } from '../../lib/adobe-stock/promptSanitizer';
import { saveHistoryItem, saveLibraryItem } from '../../lib/storage/localStorage';

interface PromptTranslatorProps {
  settings: AISettings;
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk: (prompt: string) => void;
}

export const PromptTranslator: React.FC<PromptTranslatorProps> = ({
  settings,
  showToast,
  onSendToMetadata,
  onSendToRisk
}) => {
  const [foreignPrompt, setForeignPrompt] = useState('');
  const [sourceLang, setSourceLang] = useState('Auto-Detect');
  const [translatedResult, setTranslatedResult] = useState<{
    original: string;
    translatedStockPrompt: string;
    detectedLanguage: string;
    title: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const samplePrompts = [
    { lang: 'Spanish', text: 'Un médico mayor explicando una radiografía digital a un paciente joven en un hospital moderno y luminoso' },
    { lang: 'French', text: 'Une femme d’affaires souriante tenant une tasse de café dans un bureau scandinave épuré' },
    { lang: 'German', text: 'Ein Ingenieur mit Schutzhelm überprüft Solarzellen auf einem modernen Hausdach bei Sonnenuntergang' },
    { lang: 'Japanese', text: 'モダンなカフェでノートパソコンを使ってリモートワークをする若い女性、自然光、コピースペース' }
  ];

  const handleTranslate = async () => {
    if (!foreignPrompt.trim()) {
      showToast('Please enter a prompt to translate.');
      return;
    }

    setLoading(true);
    try {
      const systemInstruction = `You are a specialized multilingual microstock prompt translator.
Translate international prompts into studio-quality English prompts optimized for AI generators (Midjourney, Flux, Adobe Firefly).
Rules:
1. Translate nuances faithfully while formatting as a commercial stock prompt (camera cues, natural light, copy space).
2. Strip trademarks, brand names, and celebrity references.
3. Output JSON strictly.

JSON structure:
{
  "detectedLanguage": "Name of source language",
  "title": "Short descriptive stock title in English",
  "translatedStockPrompt": "Polished English prompt ready for generation"
}`;

      const userReq = `Source Language: ${sourceLang}
Input text: "${foreignPrompt}"
Translate into production-ready English commercial stock prompt.`;

      const raw = await callAI(userReq, systemInstruction, true);
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const scan = sanitizePromptInput(parsed.translatedStockPrompt);

      const finalResult = {
        original: foreignPrompt,
        translatedStockPrompt: scan.sanitizedPrompt,
        detectedLanguage: parsed.detectedLanguage || 'Detected Language',
        title: parsed.title || 'Translated Stock Asset'
      };

      setTranslatedResult(finalResult);

      saveHistoryItem({
        type: 'prompt',
        title: `Translated: ${finalResult.title}`,
        summary: scan.sanitizedPrompt.slice(0, 100),
        data: finalResult,
        provider: settings.provider,
        model: settings.model
      });

      showToast(`Translated from ${finalResult.detectedLanguage}`);
    } catch (err: any) {
      showToast(err.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!translatedResult) return;
    navigator.clipboard.writeText(translatedResult.translatedStockPrompt);
    setCopied(true);
    showToast('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Languages className="w-5 h-5 text-teal-600" />
          <span>Prompt Stock Translator</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Translate prompts from Spanish, French, German, Japanese, Chinese, Arabic, and more into fluent English stock prompts with photography cues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Non-English Prompt *
                </label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="text-[11px] p-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  <option value="Auto-Detect">Auto-Detect</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Italian">Italian</option>
                  <option value="Russian">Russian</option>
                  <option value="Korean">Korean</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
              <textarea
                value={foreignPrompt}
                onChange={(e) => setForeignPrompt(e.target.value)}
                placeholder="Escribe tu prompt en cualquier idioma..."
                rows={4}
                className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                Try Examples:
              </span>
              <div className="space-y-1.5">
                {samplePrompts.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setForeignPrompt(s.text);
                      setSourceLang(s.lang);
                    }}
                    className="w-full text-left p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 flex items-center gap-2 truncate"
                  >
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                      {s.lang}
                    </span>
                    <span className="truncate">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleTranslate}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Translating & Stock Formatting...</span>
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4" />
                  <span>Translate to Stock Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Fluent English Stock Prompt
          </h2>

          {!translatedResult && !loading && (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white/50 dark:bg-zinc-900/50 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 mx-auto flex items-center justify-center">
                <Languages className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                Ready for Translation
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Paste foreign language concepts to convert them into native English commercial stock prompts with studio terminology.
              </p>
            </div>
          )}

          {loading && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center bg-white dark:bg-zinc-900 space-y-3">
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Translating idioms and framing with commercial photography keywords...
              </p>
            </div>
          )}

          {translatedResult && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-900 mb-1 inline-block">
                    FROM {translatedResult.detectedLanguage.toUpperCase()}
                  </span>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                    {translatedResult.title}
                  </h3>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Original Text:
                </span>
                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 italic">
                  "{translatedResult.original}"
                </div>

                <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider block pt-1">
                  Commercial English Prompt:
                </span>
                <div className="p-3.5 rounded-lg bg-teal-50/30 dark:bg-zinc-950/60 border border-teal-500/30 font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed select-all">
                  {translatedResult.translatedStockPrompt}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSendToMetadata(translatedResult.translatedStockPrompt, translatedResult.title, 'Stock Photo')}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Send to Metadata</span>
                  </button>
                  <button
                    onClick={() => onSendToRisk(translatedResult.translatedStockPrompt)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>Scan IP</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    saveLibraryItem({
                      title: translatedResult.title,
                      prompt: translatedResult.translatedStockPrompt,
                      category: 'Translated',
                      contentType: 'Photo',
                      aspectRatio: '16:9',
                      tags: ['Translated', translatedResult.detectedLanguage]
                    });
                    showToast('Saved to Library');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-teal-500" />
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

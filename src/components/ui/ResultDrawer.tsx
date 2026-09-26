import React, { useState } from 'react';
import { X, Copy, Check, ShieldCheck, Tag, Layers, ExternalLink } from 'lucide-react';
import { CompliancePanel } from './CompliancePanel';
import { StatusBadge } from './StatusBadge';

export interface DrawerPayload {
  title?: string;
  prompt: string;
  category?: string;
  contentType?: string;
  metadataKeywords?: string[];
  metadataTitle?: string;
}

interface ResultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: DrawerPayload | null;
  onSendToMetadata?: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk?: (prompt: string) => void;
}

export const ResultDrawer: React.FC<ResultDrawerProps> = ({
  isOpen,
  onClose,
  data,
  onSendToMetadata,
  onSendToRisk,
}) => {
  const [activeTab, setActiveTab] = useState<'result' | 'compliance' | 'metadata'>('result');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col h-full z-10 animate-fade-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Asset Inspector</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-xs">
              {data.title || 'Selected Stock Prompt'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-zinc-800 px-4 bg-zinc-950/40 text-xs font-medium">
          {(['result', 'compliance', 'metadata'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-3 uppercase tracking-wider text-[11px] font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'result' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-zinc-400 block mb-1.5 uppercase tracking-wider text-[10px]">
                  Stock Title
                </span>
                <p className="text-sm font-semibold text-zinc-100">
                  {data.title || 'Untitled Commercial Asset'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                    Full Prompt
                  </span>
                  <button
                    onClick={handleCopy}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 leading-relaxed select-all">
                  {data.prompt}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Category</span>
                  <span className="text-zinc-200 font-medium">{data.category || 'General Commercial'}</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Content Type</span>
                  <span className="text-zinc-200 font-medium">{data.contentType || 'Photo (JPG)'}</span>
                </div>
              </div>

              {/* Quick Compliance Preview */}
              <CompliancePanel promptText={data.prompt} titleText={data.title} compact />
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <CompliancePanel promptText={data.prompt} titleText={data.title} />
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs space-y-2">
                <span className="font-semibold text-zinc-200 block">Stock Guidelines Reminder:</span>
                <ul className="space-y-1 text-zinc-400 text-[11px] list-disc list-inside">
                  <li>Never upload with visible brand logos or trademarked gadgets.</li>
                  <li>Do not imitate living artist signature styles.</li>
                  <li>Check the Generative AI box upon uploading to Adobe Stock.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-zinc-400 block mb-1 uppercase tracking-wider text-[10px]">
                  Generated / Suggested Title
                </span>
                <p className="text-sm font-semibold text-zinc-100 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  {data.metadataTitle || data.title || 'Commercial Stock Photo Concept'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                    Keywords ({data.metadataKeywords?.length || 0}/49)
                  </span>
                </div>
                {data.metadataKeywords && data.metadataKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    {data.metadataKeywords.map((k, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded-md ${
                          idx < 3
                            ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <Tag className="w-6 h-6 text-zinc-500 mx-auto" />
                    <p className="text-xs text-zinc-400">
                      No metadata generated yet for this prompt.
                    </p>
                    {onSendToMetadata && (
                      <button
                        onClick={() => {
                          onSendToMetadata(data.prompt, data.title, data.category);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                      >
                        Open in Metadata Studio
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onSendToMetadata && (
              <button
                onClick={() => {
                  onSendToMetadata(data.prompt, data.title, data.category);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>To Metadata</span>
              </button>
            )}
            {onSendToRisk && (
              <button
                onClick={() => {
                  onSendToRisk(data.prompt);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>To IP Scan</span>
              </button>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

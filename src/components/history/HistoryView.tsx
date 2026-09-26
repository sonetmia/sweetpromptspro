import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  ArrowRight, 
  Download, 
  FileSpreadsheet, 
  CheckSquare, 
  Square,
  FileText
} from 'lucide-react';
import { HistoryItem } from '../../types';
import { getStoredHistory, deleteHistoryItem, clearAllHistory } from '../../lib/storage/localStorage';
import { exportToCSV, exportToJSON, exportToTXT } from '../../lib/utils/exportUtils';

interface HistoryViewProps {
  onSelectHistory: (item: HistoryItem) => void;
  showToast: (msg: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onSelectHistory,
  showToast,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setHistory(getStoredHistory());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteHistoryItem(id);
    setHistory(updated);
    setSelectedIds(prev => prev.filter(item => item !== id));
    showToast('Deleted item from history');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all generation history?')) {
      clearAllHistory();
      setHistory([]);
      setSelectedIds([]);
      showToast('Cleared all history');
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredHistory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredHistory.map(i => i.id));
    }
  };

  // Bulk Export Functions
  const itemsToExport = selectedIds.length > 0 
    ? history.filter(h => selectedIds.includes(h.id))
    : filteredHistory;

  const handleBulkExportCSV = () => {
    if (itemsToExport.length === 0) {
      showToast('No items to export.');
      return;
    }
    const data = itemsToExport.map((item, idx) => ({
      Index: idx + 1,
      Type: item.type,
      Title: item.title,
      Summary: item.summary,
      Provider: item.provider,
      Model: item.model,
      CreatedDate: new Date(item.createdAt).toISOString(),
    }));
    exportToCSV(data, `sweetprompts-history-${Date.now()}.csv`);
    showToast(`Exported ${itemsToExport.length} history items as CSV`);
  };

  const handleBulkExportJSON = () => {
    if (itemsToExport.length === 0) {
      showToast('No items to export.');
      return;
    }
    exportToJSON(itemsToExport, `sweetprompts-history-${Date.now()}.json`);
    showToast(`Exported ${itemsToExport.length} history items as JSON`);
  };

  const handleBulkExportTXT = () => {
    if (itemsToExport.length === 0) {
      showToast('No items to export.');
      return;
    }
    const textData = itemsToExport.map((item, idx) => 
      `[${idx + 1}] TYPE: ${item.type.toUpperCase()} | DATE: ${new Date(item.createdAt).toLocaleString()}\nTITLE: ${item.title}\nSUMMARY: ${item.summary}\n`
    ).join('\n----------------------------------------\n\n');
    exportToTXT(textData, `sweetprompts-history-${Date.now()}.txt`);
    showToast(`Exported ${itemsToExport.length} history items as TXT`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-medium">
              {['all', 'prompt', 'vision', 'microstock', 'metadata', 'risk'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                    filterType === type 
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs' 
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bulk Action & Export Toolbar */}
        {filteredHistory.length > 0 && (
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
              >
                {selectedIds.length === filteredHistory.length ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-400" />
                )}
                <span>
                  {selectedIds.length > 0 ? `Selected (${selectedIds.length}/${filteredHistory.length})` : 'Select All'}
                </span>
              </button>
              <span className="text-zinc-400 text-xs hidden sm:inline">•</span>
              <span className="text-zinc-500 text-xs hidden sm:inline">
                {selectedIds.length > 0 ? `Ready to export ${selectedIds.length} items` : `Ready to export ${filteredHistory.length} items`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:inline">Bulk Export:</span>
              <button
                onClick={handleBulkExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-2xs cursor-pointer"
                title="Export as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleBulkExportJSON}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
                title="Export as JSON"
              >
                <span>JSON</span>
              </button>
              <button
                onClick={handleBulkExportTXT}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
                title="Export as TXT"
              >
                <span>TXT</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
            <History className="w-12 h-12 mx-auto mb-3 text-zinc-400 opacity-40" />
            <p className="font-medium text-zinc-700 dark:text-zinc-300">No generation history found</p>
            <p className="text-xs text-zinc-500 mt-1">
              Prompts, image analyses, and metadata generations will appear here automatically.
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => onSelectHistory(item)}
                className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={(e) => toggleSelect(item.id, e)}
                    className="p-1 text-zinc-400 hover:text-emerald-600 mt-0.5 cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        {item.type}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        • {item.provider}
                      </span>
                    </div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-2xl">
                      {item.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(item.summary);
                      setCopiedId(item.id);
                      showToast('Copied summary to clipboard');
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors cursor-pointer"
                    title="Copy content"
                  >
                    {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2 text-zinc-400 group-hover:text-emerald-600 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

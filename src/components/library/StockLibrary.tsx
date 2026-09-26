import React, { useState, useEffect } from 'react';
import { 
  FolderArchive, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  FileSpreadsheet, 
  Tag, 
  ShieldAlert
} from 'lucide-react';
import { LibraryItem } from '../../types';
import { getStoredLibrary, deleteLibraryItem, clearAllLibrary } from '../../lib/storage/localStorage';
import { exportToCSV, exportToJSON } from '../../lib/utils/exportUtils';

interface StockLibraryProps {
  showToast: (msg: string) => void;
  onSendToMetadata: (prompt: string, title?: string, category?: string) => void;
  onSendToRisk: (prompt: string) => void;
}

export const StockLibrary: React.FC<StockLibraryProps> = ({
  showToast,
  onSendToMetadata,
  onSendToRisk
}) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Photo' | 'Illustration' | 'Vector'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setItems(getStoredLibrary());
  }, []);

  const handleDelete = (id: string) => {
    const updated = deleteLibraryItem(id);
    setItems(updated);
    showToast('Item removed from Library');
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    if (window.confirm('Are you sure you want to clear your library archive?')) {
      clearAllLibrary();
      setItems([]);
      showToast('Library archive cleared');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied prompt to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = items.filter(item => {
    const matchesQuery = 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || item.contentType === typeFilter;
    return matchesQuery && matchesType;
  });

  const handleExportCSV = () => {
    if (filteredItems.length === 0) return;
    const headers = ['Title', 'Prompt', 'Category', 'Content Type', 'Aspect Ratio', 'Date Added'];
    const rows = filteredItems.map(i => [
      i.title,
      i.prompt,
      i.category,
      i.contentType,
      i.aspectRatio,
      new Date(i.createdAt).toISOString()
    ]);
    exportToCSV(headers, rows, `stock_library_${Date.now()}`);
    showToast('Exported Library as CSV');
  };

  const handleExportJSON = () => {
    if (filteredItems.length === 0) return;
    exportToJSON(filteredItems, `stock_library_${Date.now()}`);
    showToast('Exported Library as JSON');
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#272D30]">
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-[#8C8A86] uppercase mb-1">
            CURATED ARCHIVE
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl text-[#F3EDE2] font-normal tracking-tight">
            Stock Library
          </h1>
          <p className="text-xs text-[#8C8A86] mt-1">
            Visual archive of curated prompts, photo concepts, and isolated assets.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-[6px] border border-[#383E41] hover:border-[#4B5357] bg-[#11161A] hover:bg-[#171E24] text-xs font-medium text-[#E8E4DC] hover:text-[#F3EDE2] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#C74A43]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-[6px] border border-[#383E41] hover:border-[#4B5357] bg-[#11161A] hover:bg-[#171E24] text-xs font-medium text-[#E8E4DC] hover:text-[#F3EDE2] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#8C8A86]" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-[6px] border border-[#272D30] hover:border-[#C74A43]/50 bg-transparent hover:bg-[#C74A43]/10 text-xs font-medium text-[#8C8A86] hover:text-[#C74A43] transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#606669] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archive by title, subject, or category..."
            className="w-full pl-9 pr-3.5 py-2 rounded-[6px] border border-[#272D30] bg-[#11161A] text-xs text-[#F3EDE2] placeholder-[#606669] focus:outline-none focus:border-[#C74A43]"
          />
        </div>

        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 rounded-[6px] bg-[#11161A] border border-[#272D30] text-xs">
          {(['All', 'Photo', 'Illustration', 'Vector'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                typeFilter === type
                  ? 'bg-[#C74A43] text-[#F3EDE2]'
                  : 'text-[#8C8A86] hover:text-[#F3EDE2] hover:bg-[#171E24]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Archive Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-[8px] bg-[#11161A] border border-[#272D30] space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#090B0D] text-[#606669] flex items-center justify-center mx-auto border border-[#272D30]">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="font-editorial text-base text-[#F3EDE2]">
              No Archive Records Found
            </h3>
            <p className="text-xs text-[#8C8A86] max-w-sm mx-auto">
              Save prompts from Prompt Studio, JPG Creator, or PNG Creator to build your library.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-[6px] bg-[#11161A] border border-[#272D30] hover:border-[#383E41] transition-colors space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-[#F3EDE2]">
                    {item.title}
                  </span>
                  <span className="text-[#383E41]">·</span>
                  <span className="text-[10px] font-mono text-[#8C8A86]">
                    {item.contentType || 'Prompt'}
                  </span>
                  {item.category && (
                    <>
                      <span className="text-[#383E41]">·</span>
                      <span className="text-[10px] text-[#606669]">
                        {item.category}
                      </span>
                    </>
                  )}
                </div>

                <span className="text-[10px] text-[#606669] font-mono">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-[#090B0D] p-3 rounded-[4px] border border-[#1C2428]">
                <p className="text-xs text-[#E8E4DC] font-mono leading-relaxed select-all">
                  {item.prompt}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(item.prompt, item.id)}
                    className="px-2.5 py-1 rounded-[4px] border border-[#272D30] hover:border-[#383E41] bg-[#11161A] text-[#E8E4DC] hover:text-[#F3EDE2] text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedId === item.id ? <Check className="w-3 h-3 text-[#4E8793]" /> : <Copy className="w-3 h-3 text-[#8C8A86]" />}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => onSendToMetadata(item.prompt, item.title, item.category)}
                    className="px-2.5 py-1 rounded-[4px] border border-[#272D30] hover:border-[#383E41] bg-[#11161A] text-[#E8E4DC] hover:text-[#F3EDE2] text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Tag className="w-3 h-3 text-[#8C8A86]" />
                    <span>Metadata</span>
                  </button>

                  <button
                    onClick={() => onSendToRisk(item.prompt)}
                    className="px-2.5 py-1 rounded-[4px] border border-[#272D30] hover:border-[#383E41] bg-[#11161A] text-[#E8E4DC] hover:text-[#F3EDE2] text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-3 h-3 text-[#8C8A86]" />
                    <span>IP Check</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-[#606669] hover:text-[#C74A43] transition-colors cursor-pointer"
                  title="Remove from library"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

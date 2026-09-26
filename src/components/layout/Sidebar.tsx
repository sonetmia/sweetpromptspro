import React from 'react';
import { 
  Home,
  Package,
  Lightbulb,
  Camera,
  Image as ImageIcon,
  PenTool,
  Wand2,
  Layers,
  Maximize2,
  ShieldCheck,
  Languages,
  Compass,
  Users,
  Tag,
  ShieldAlert,
  TrendingUp,
  GitCompare,
  FileCheck,
  FolderArchive,
  Settings,
  ScanSearch,
  X
} from 'lucide-react';
import { ModuleType, AISettings } from '../../types';

interface SidebarProps {
  currentModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
  settings: AISettings;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  mobileOpen,
  setMobileOpen,
}) => {
  const handleNav = (mod: ModuleType) => {
    onSelectModule(mod);
    setMobileOpen(false);
  };

  const createItems = [
    { id: 'bulk-hub' as ModuleType, label: 'Bulk Generator', icon: Package },
    { id: 'idea-gen' as ModuleType, label: 'Idea Generator', icon: Lightbulb },
    { id: 'jpg-creator' as ModuleType, label: 'JPG Creator', icon: Camera },
    { id: 'png-creator' as ModuleType, label: 'PNG Creator', icon: ImageIcon },
    { id: 'vector-studio' as ModuleType, label: 'Vector Prompt Studio', icon: PenTool },
  ];

  const toolsItems = [
    { id: 'image-to-prompt' as ModuleType, label: 'Image to Prompt', icon: ImageIcon },
    { id: 'prompt-improver' as ModuleType, label: 'Prompt Improver', icon: ShieldCheck },
    { id: 'prompt-variations' as ModuleType, label: 'Prompt Variations', icon: Layers },
    { id: 'prompt-expander' as ModuleType, label: 'Prompt Expander', icon: Maximize2 },
    { id: 'prompt-fixer' as ModuleType, label: 'Prompt Fixer', icon: ShieldCheck },
    { id: 'prompt-translator' as ModuleType, label: 'Prompt Translator', icon: Languages },
    { id: 'brainstormer' as ModuleType, label: 'Brainstormer', icon: Compass },
    { id: 'silhouette-finder' as ModuleType, label: 'Silhouette Finder', icon: Users },
  ];

  const stockItems = [
    { id: 'image-scan' as ModuleType, label: 'Image Scan', icon: ScanSearch },
    { id: 'metadata' as ModuleType, label: 'Metadata Studio', icon: Tag },
    { id: 'risk-checker' as ModuleType, label: 'IP & Risk Checker', icon: ShieldAlert },
    { id: 'commercial-optimizer' as ModuleType, label: 'Commercial Optimizer', icon: TrendingUp },
    { id: 'similarity-checker' as ModuleType, label: 'Similarity Checker', icon: GitCompare },
    { id: 'pre-submission-check' as ModuleType, label: 'Pre-Submission Check', icon: FileCheck },
  ];

  const renderItem = (item: { id: ModuleType; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const Icon = item.icon;
    const isActive = currentModule === item.id || 
      (item.id === 'metadata' && currentModule === 'metadata-studio') ||
      (item.id === 'bulk-hub' && currentModule === 'bulk-gen');
      
    return (
      <button
        key={item.id}
        onClick={() => handleNav(item.id)}
        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[6px] text-xs transition-colors text-left cursor-pointer border ${
          isActive
            ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#1A2024] dark:text-[#F3EDE2] font-semibold'
            : 'border-[#D8CEBF]/70 dark:border-[#272D30]/60 bg-transparent text-[#606669] dark:text-[#8C8A86] hover:text-[#1A2024] dark:hover:text-[#F3EDE2] hover:border-[#C74A43]/50 dark:hover:border-[#383E41] hover:bg-[#E2D9C7]/50 dark:hover:bg-[#171E24]/60'
        }`}
      >
        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#C74A43]' : 'text-[#8C8A86] dark:text-[#6B7280]'}`} />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 bg-[#EDE6D8] dark:bg-[#11161A] border-r border-[#D8CEBF] dark:border-[#272D30]
        flex flex-col transition-transform duration-200 ease-in-out shrink-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Editorial Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#D8CEBF] dark:border-[#272D30]">
          <div 
            onClick={() => handleNav('home')}
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            <div className="w-2 h-2 rounded-full bg-[#C74A43]" />
            <span className="font-semibold text-[#1A2024] dark:text-[#F3EDE2] tracking-tight text-sm">
              SweetPrompts <span className="font-normal text-[#606669] dark:text-[#8C8A86]">Pro</span>
            </span>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-[#606669] dark:text-[#8C8A86] hover:text-[#1A2024] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] rounded cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {/* HOME */}
          <div>
            <button
              onClick={() => handleNav('home')}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[6px] text-xs transition-colors text-left cursor-pointer border ${
                currentModule === 'home'
                  ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#1A2024] dark:text-[#F3EDE2] font-semibold'
                  : 'border-[#D8CEBF]/70 dark:border-[#272D30]/60 bg-transparent text-[#606669] dark:text-[#8C8A86] hover:text-[#1A2024] dark:hover:text-[#F3EDE2] hover:border-[#C74A43]/50 dark:hover:border-[#383E41] hover:bg-[#E2D9C7]/50 dark:hover:bg-[#171E24]/60'
              }`}
            >
              <Home className={`w-3.5 h-3.5 shrink-0 ${currentModule === 'home' ? 'text-[#C74A43]' : 'text-[#8C8A86] dark:text-[#6B7280]'}`} />
              <span className="font-medium">HOME</span>
            </button>
          </div>

          {/* CREATE GROUP */}
          <div className="space-y-1.5">
            <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[#606669] dark:text-[#606669]">
              CREATE
            </div>
            <div className="space-y-1">
              {createItems.map(renderItem)}
            </div>
          </div>

          {/* TOOLS GROUP */}
          <div className="space-y-1.5">
            <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[#606669] dark:text-[#606669]">
              TOOLS
            </div>
            <div className="space-y-1">
              {toolsItems.map(renderItem)}
            </div>
          </div>

          {/* STOCK AUDIT GROUP */}
          <div className="space-y-1.5">
            <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[#606669] dark:text-[#606669]">
              STOCK
            </div>
            <div className="space-y-1">
              {stockItems.map(renderItem)}
            </div>
          </div>

          {/* LIBRARY */}
          <div className="space-y-1.5">
            <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[#606669] dark:text-[#606669]">
              LIBRARY
            </div>
            <button
              onClick={() => handleNav('library')}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[6px] text-xs transition-colors text-left cursor-pointer border ${
                currentModule === 'library'
                  ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#1A2024] dark:text-[#F3EDE2] font-semibold'
                  : 'border-[#D8CEBF]/70 dark:border-[#272D30]/60 bg-transparent text-[#606669] dark:text-[#8C8A86] hover:text-[#1A2024] dark:hover:text-[#F3EDE2] hover:border-[#C74A43]/50 dark:hover:border-[#383E41] hover:bg-[#E2D9C7]/50 dark:hover:bg-[#171E24]/60'
              }`}
            >
              <FolderArchive className={`w-3.5 h-3.5 shrink-0 ${currentModule === 'library' ? 'text-[#C74A43]' : 'text-[#8C8A86] dark:text-[#6B7280]'}`} />
              <span className="truncate">Stock Library</span>
            </button>
          </div>
        </div>

        {/* Footer / Settings */}
        <div className="p-3 border-t border-[#D8CEBF] dark:border-[#272D30]">
          <button
            onClick={() => handleNav('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs transition-colors text-left cursor-pointer border ${
              currentModule === 'settings'
                ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#1A2024] dark:text-[#F3EDE2] font-semibold'
                : 'border-[#D8CEBF]/70 dark:border-[#272D30]/60 bg-transparent text-[#606669] dark:text-[#8C8A86] hover:text-[#1A2024] dark:hover:text-[#F3EDE2] hover:border-[#C74A43]/50 dark:hover:border-[#383E41]'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-[#8C8A86] dark:text-[#6B7280]" />
            <span className="font-medium">Settings & Providers</span>
          </button>
        </div>
      </aside>
    </>
  );
};

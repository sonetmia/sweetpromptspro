import React from 'react';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon 
} from 'lucide-react';
import { ModuleType, AISettings } from '../../types';
import { useTheme } from '../../lib/theme/ThemeContext';

interface HeaderProps {
  currentModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
  settings: AISettings;
  onUpdateSettings: (newSettings: AISettings) => void;
  setMobileOpen: (open: boolean) => void;
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  onSelectModule,
  settings,
  onUpdateSettings,
  setMobileOpen,
  onOpenCommandPalette,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleToggleThemeMode = () => {
    toggleTheme();
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ ...settings, theme: nextTheme });
  };

  const isDarkMode = resolvedTheme === 'dark';

  const formatModuleName = (mod: string) => {
    return mod.replace(/-/g, ' ');
  };

  return (
    <header className="h-14 px-4 sm:px-6 bg-[#EDE6D8] dark:bg-[#11161A] border-b border-[#D8CEBF] dark:border-[#272D30] flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Left: Mobile Toggle & Brand / Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-1.5 text-[#606669] dark:text-[#8C8A86] hover:text-[#1A2024] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] rounded-md transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onSelectModule('home')} 
            className="text-xs font-semibold text-[#606669] dark:text-[#8C8A86] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] transition-colors cursor-pointer"
          >
            SweetPrompts Pro
          </button>
          <span className="text-[#D8CEBF] dark:text-[#383E41] text-xs">/</span>
          <span className="text-xs font-medium text-[#1A2024] dark:text-[#F3EDE2] capitalize">
            {formatModuleName(currentModule)}
          </span>
        </div>
      </div>

      {/* Center: Search / Ctrl K */}
      <div className="flex-1 max-w-xs mx-4 hidden md:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full h-8 px-3 rounded-[6px] bg-[#F5F0E6] dark:bg-[#090B0D] border border-[#D8CEBF] dark:border-[#272D30] hover:border-[#C74A43] dark:hover:border-[#383E41] text-[#606669] dark:text-[#8C8A86] hover:text-[#1A2024] dark:hover:text-[#F3EDE2] text-xs flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#606669]" />
            <span className="font-normal">Search tools...</span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EDE6D8] dark:bg-[#171E24] text-[#606669] dark:text-[#8C8A86] border border-[#D8CEBF] dark:border-[#272D30]">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Theme Toggle */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenCommandPalette}
          className="md:hidden p-1.5 text-[#606669] dark:text-[#8C8A86] hover:text-[#1A2024] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] rounded-md transition-colors cursor-pointer"
          title="Search (Ctrl + K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={handleToggleThemeMode}
          className="px-3 py-1.5 rounded-[6px] border border-[#D8CEBF] dark:border-[#272D30] bg-[#F5F0E6] dark:bg-[#090B0D] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] text-[#1A2024] dark:text-[#8C8A86] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
          title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle dark/light theme"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#C74A43]" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#1A2024]" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

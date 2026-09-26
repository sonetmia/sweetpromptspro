import React, { useState } from 'react';
import { ModuleType, AISettings } from '../../types';
import { CinematicAtmosphericLandscape } from './CinematicAtmosphericLandscape';
import { Sun, Moon, ChevronDown } from 'lucide-react';
import { useTheme } from '../../lib/theme/ThemeContext';

interface HomeDashboardProps {
  onSelectModule: (module: ModuleType) => void;
  onSendToTool?: (text: string, targetModule: ModuleType) => void;
  settings?: AISettings;
  onToggleTheme?: () => void;
  onUpdateSettings?: (settings: AISettings) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ 
  onSelectModule, 
  onToggleTheme
}) => {
  const [creatorsMenuOpen, setCreatorsMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleToggle = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      toggleTheme();
    }
  };

  const isDarkMode = resolvedTheme === 'dark';

  return (
    <div className="min-h-screen w-full bg-[#F5F0E6] dark:bg-[#090B0D] text-[#1A2024] dark:text-[#F3EDE2] flex flex-col justify-between selection:bg-[#C74A43] selection:text-[#F3EDE2] font-brand-sans transition-colors duration-200">
      {/* ================================================== */}
      {/* 1. MINIMAL EDITORIAL NAVIGATION                    */}
      {/* ================================================== */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-8 pb-6 flex items-center justify-between z-20">
        {/* Brand Logo */}
        <button
          onClick={() => onSelectModule('home')}
          className="group flex items-center gap-2.5 text-left cursor-pointer transition-opacity hover:opacity-90"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#C74A43] group-hover:scale-125 transition-transform" />
          <span className="text-lg font-semibold tracking-tight text-[#1A2024] dark:text-[#F3EDE2]">
            SweetPrompts <span className="font-normal text-[#606669] dark:text-[#8C8A86]">Pro</span>
          </span>
        </button>

        {/* Center Minimal Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#606669] dark:text-[#8C8A86]">
          <button
            onClick={() => onSelectModule('home')}
            className="text-[#1A2024] dark:text-[#F3EDE2] relative py-1 hover:text-[#C74A43] dark:hover:text-white transition-colors cursor-pointer"
          >
            Home
            <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C74A43]" />
          </button>

          {/* Creators Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setCreatorsMenuOpen(!creatorsMenuOpen);
                setToolsMenuOpen(false);
              }}
              className="flex items-center gap-1 hover:text-[#1A2024] dark:hover:text-[#F3EDE2] py-1 transition-colors cursor-pointer"
            >
              <span>Creators</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${creatorsMenuOpen ? 'rotate-180 text-[#C74A43]' : ''}`} />
            </button>

            {creatorsMenuOpen && (
              <div 
                className="absolute top-full left-0 mt-2 w-48 py-2 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-md shadow-2xl z-30 animate-fade-in"
                onMouseLeave={() => setCreatorsMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    onSelectModule('bulk-hub');
                    setCreatorsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Bulk Generator
                </button>
                <button
                  onClick={() => {
                    onSelectModule('idea-gen');
                    setCreatorsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Idea Generator
                </button>
                <button
                  onClick={() => {
                    onSelectModule('jpg-creator');
                    setCreatorsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  JPG Creator
                </button>
                <button
                  onClick={() => {
                    onSelectModule('png-creator');
                    setCreatorsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  PNG Creator
                </button>
                <button
                  onClick={() => {
                    onSelectModule('vector-studio');
                    setCreatorsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[#C74A43] dark:text-[#C74A43] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Vector Prompt Studio</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-[#C74A43]/10">NEW</span>
                </button>
              </div>
            )}
          </div>

          {/* Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setToolsMenuOpen(!toolsMenuOpen);
                setCreatorsMenuOpen(false);
              }}
              className="flex items-center gap-1 hover:text-[#1A2024] dark:hover:text-[#F3EDE2] py-1 transition-colors cursor-pointer"
            >
              <span>Tools</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${toolsMenuOpen ? 'rotate-180 text-[#C74A43]' : ''}`} />
            </button>

            {toolsMenuOpen && (
              <div 
                className="absolute top-full left-0 mt-2 w-52 py-2 bg-[#EDE6D8] dark:bg-[#11161A] border border-[#D8CEBF] dark:border-[#272D30] rounded-md shadow-2xl z-30 animate-fade-in"
                onMouseLeave={() => setToolsMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    onSelectModule('image-to-prompt');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[#C74A43] dark:text-[#C74A43] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Image to Prompt</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-[#C74A43]/10">NEW</span>
                </button>
                <button
                  onClick={() => {
                    onSelectModule('prompt-studio');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Prompt Studio
                </button>
                <button
                  onClick={() => {
                    onSelectModule('prompt-improver');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Prompt Improver
                </button>
                <button
                  onClick={() => {
                    onSelectModule('prompt-variations');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Prompt Variations
                </button>
                <button
                  onClick={() => {
                    onSelectModule('prompt-expander');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Prompt Expander
                </button>
                <button
                  onClick={() => {
                    onSelectModule('prompt-fixer');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Prompt Fixer
                </button>
                <button
                  onClick={() => {
                    onSelectModule('prompt-translator');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Prompt Translator
                </button>
                <button
                  onClick={() => {
                    onSelectModule('brainstormer');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Brainstormer
                </button>
                <button
                  onClick={() => {
                    onSelectModule('silhouette-finder');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Silhouette Finder
                </button>
                <div className="border-t border-[#D8CEBF] dark:border-[#272D30] my-1" />
                <button
                  onClick={() => {
                    onSelectModule('image-scan');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[#C74A43] dark:text-[#C74A43] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Image Scan (Bulk Review)</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-[#C74A43]/10">NEW</span>
                </button>
                <button
                  onClick={() => {
                    onSelectModule('metadata-studio');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Metadata Studio
                </button>
                <button
                  onClick={() => {
                    onSelectModule('risk-checker');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  IP & Risk Checker
                </button>
                <button
                  onClick={() => {
                    onSelectModule('commercial-optimizer');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Commercial Optimizer
                </button>
                <button
                  onClick={() => {
                    onSelectModule('similarity-checker');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Similarity Checker
                </button>
                <button
                  onClick={() => {
                    onSelectModule('pre-submission-check');
                    setToolsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#1A2024] dark:text-[#E8E4DC] hover:text-[#C74A43] dark:hover:text-[#F3EDE2] hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] transition-colors cursor-pointer"
                >
                  Pre-Submission Check
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onSelectModule('library')}
            className="hover:text-[#1A2024] dark:hover:text-[#F3EDE2] py-1 transition-colors cursor-pointer"
          >
            Library
          </button>

          <button
            onClick={() => onSelectModule('settings')}
            className="hover:text-[#1A2024] dark:hover:text-[#F3EDE2] py-1 transition-colors cursor-pointer"
          >
            Settings
          </button>
        </nav>

        {/* Right Side: Light / Dark Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className="px-3.5 py-1.5 rounded-[6px] border border-[#D8CEBF] dark:border-[#272D30] text-xs font-medium text-[#1A2024] dark:text-[#E8E4DC] hover:border-[#C74A43] dark:hover:border-[#383E41] transition-all flex items-center gap-2 cursor-pointer bg-[#EDE6D8] dark:bg-[#11161A]"
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
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

      {/* ================================================== */}
      {/* 2. HERO SECTION: 65-70% LEFT / 35-45% RIGHT        */}
      {/* ================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 flex items-center my-auto py-10 lg:py-16">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* ============================================== */}
          {/* LEFT SIDE: Headline & Short Copy */}
          <div className="lg:col-span-7 space-y-7 max-w-xl">
            
            {/* Main Headline */}
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#1A2024] dark:text-[#F3EDE2] leading-[1.08]">
              Turn Ideas <br />
              Into <span className="text-[#C74A43] italic font-normal">Stock-Ready Work.</span>
            </h1>

            {/* Short Supporting Description */}
            <p className="text-base sm:text-lg text-[#606669] dark:text-[#8C8A86] font-normal leading-relaxed">
              Generate, refine, and organize prompts for microstock.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              {/* Primary Button */}
              <button
                onClick={() => onSelectModule('prompt-studio')}
                className="h-11 px-7 rounded-[7px] bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] text-sm font-semibold tracking-wide shadow-sm transition-all flex items-center gap-2.5 cursor-pointer group"
              >
                <span>Start Creating</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>

              {/* Secondary Button */}
              <button
                onClick={() => onSelectModule('jpg-creator')}
                className="h-11 px-7 rounded-[7px] bg-transparent hover:bg-[#E2D9C7] dark:hover:bg-[#171E24] border border-[#D8CEBF] dark:border-[#383E41] text-[#1A2024] dark:text-[#E8E4DC] text-sm font-medium tracking-wide transition-all cursor-pointer"
              >
                Explore Tools
              </button>
            </div>
          </div>

          {/* ============================================== */}
          {/* RIGHT SIDE: Minimal Editorial Consistency Card */}
          {/* ============================================== */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[380px] p-8 sm:p-10 rounded-2xl bg-[#EDE6D8]/70 dark:bg-[#11161A]/90 border border-[#D8CEBF] dark:border-[#272D30] shadow-sm relative overflow-hidden backdrop-blur-sm space-y-6 text-center">
              <div>
                <h2 className="font-editorial text-4xl sm:text-5xl font-normal tracking-tight text-[#1A2024] dark:text-[#F3EDE2] italic">
                  Consistency
                </h2>
              </div>
              <div className="pt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-[#606669] dark:text-[#8C8A86] border-t border-[#D8CEBF]/60 dark:border-[#272D30]/60">
                <span className="w-2 h-2 rounded-full bg-[#C74A43]" />
                <span>Microstock Journey with Sonet</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ================================================== */}
      {/* 3. MINIMAL EDITORIAL FOOTER                        */}
      {/* ================================================== */}
      <footer className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#606669] dark:text-[#606669] border-t border-[#D8CEBF] dark:border-[#171E24]">
        <div className="flex items-center gap-2">
          <span>SweetPrompts Pro</span>
          <span className="text-[#D8CEBF] dark:text-[#272D30]">•</span>
          <span>Commercial Stock Workflow Studio</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => onSelectModule('pre-submission-check')} className="hover:text-[#1A2024] dark:hover:text-[#8C8A86] transition-colors cursor-pointer">
            Adobe Stock Guidelines
          </button>
          <button onClick={() => onSelectModule('settings')} className="hover:text-[#1A2024] dark:hover:text-[#8C8A86] transition-colors cursor-pointer">
            API & Theme Settings
          </button>
        </div>
      </footer>
    </div>
  );
};

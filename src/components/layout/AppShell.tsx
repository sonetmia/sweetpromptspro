import React, { useState, useEffect } from 'react';
import { ModuleType, AISettings, GeneratedPromptResult } from '../../types';
import { getStoredSettings, saveStoredSettings } from '../../lib/storage/localStorage';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

// Core Modules
import { HomeDashboard } from '../home/HomeDashboard';
import { PromptStudio } from '../prompt/PromptStudio';
import { ImageToPrompt } from '../vision/ImageToPrompt';
import { MicrostockGenerator } from '../microstock/MicrostockGenerator';
import { StockIntelligence } from '../intelligence/StockIntelligence';
import { MetadataGenerator } from '../metadata/MetadataGenerator';
import { RiskChecker } from '../risk/RiskChecker';
import { HistoryView } from '../history/HistoryView';
import { SettingsView } from '../settings/SettingsView';
import { BulkHub } from '../bulk/BulkHub';

// Creators
import { JPGCreator } from '../creators/JPGCreator';
import { PNGCreator } from '../creators/PNGCreator';
import { VectorPromptStudio } from '../creators/VectorPromptStudio';
import { IdeaGenerator } from '../creators/IdeaGenerator';

// AI Tools
import { PromptImprover } from '../tools/PromptImprover';
import { PromptVariations } from '../tools/PromptVariations';
import { PromptExpander } from '../tools/PromptExpander';
import { PromptFixer } from '../tools/PromptFixer';
import { PromptTranslator } from '../tools/PromptTranslator';
import { Brainstormer } from '../tools/Brainstormer';
import { SilhouetteFinder } from '../tools/SilhouetteFinder';

// Stock Compliance & Audit
import { ImageScanWorkspace } from '../stock/ImageScanWorkspace';
import { PreSubmissionAudit } from '../stock/PreSubmissionAudit';
import { CommercialOptimizer } from '../stock/CommercialOptimizer';
import { SimilarityChecker } from '../stock/SimilarityChecker';
import { StockLibrary } from '../library/StockLibrary';

// UI System Components
import { CommandPalette } from '../ui/CommandPalette';
import { ResultDrawer, DrawerPayload } from '../ui/ResultDrawer';

export default function AppShell() {
  const [currentModule, setCurrentModule] = useState<ModuleType>('home');
  const [settings, setSettings] = useState<AISettings>(getStoredSettings());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<DrawerPayload | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Shared state for transferring data seamlessly between modules
  const [activePromptData, setActivePromptData] = useState<{ prompt: string; title?: string; category?: string } | null>(null);

  useEffect(() => {
    saveStoredSettings(settings);
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSendToMetadata = (prompt: string, title?: string, category?: string) => {
    setActivePromptData({ prompt, title, category });
    setCurrentModule('metadata');
    showToast('Sent to Adobe Stock Metadata Studio');
  };

  const handleSendToRisk = (prompt: string) => {
    setActivePromptData({ prompt });
    setCurrentModule('risk-checker');
    showToast('Sent to IP & Risk Validator');
  };

  const handleSendToPromptStudio = (prompt: string, title?: string, category?: string) => {
    setActivePromptData({ prompt, title, category });
    setCurrentModule('prompt-studio');
    showToast('Loaded into Prompt Studio');
  };

  // Determine styling based on themeStyle: 'sweet' | 'simple' | 'futuristic'
  const themeClasses = {
    sweet: 'selection:bg-emerald-500 selection:text-white',
    simple: 'selection:bg-zinc-800 selection:text-white',
    futuristic: 'selection:bg-indigo-500 selection:text-white'
  }[settings.themeStyle || 'sweet'];

  const isHomePage = currentModule === 'home';

  if (isHomePage) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] dark:bg-[#090B0D] text-[#1A2024] dark:text-[#F3EDE2] antialiased selection:bg-[#C74A43] selection:text-[#F3EDE2] transition-colors duration-200">
        <HomeDashboard
          onSelectModule={setCurrentModule}
          onSendToTool={(text, target) => {
            setActivePromptData({ prompt: text });
            setCurrentModule(target);
            showToast(`Loaded into ${target.replace('-', ' ')}`);
          }}
          settings={settings}
          onUpdateSettings={setSettings}
        />
        {/* Global Command Palette available via Ctrl+K */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onSelectModule={setCurrentModule}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E6] dark:bg-[#090B0D] text-[#1A2024] dark:text-[#F3EDE2] flex flex-col lg:flex-row antialiased selection:bg-[#C74A43] selection:text-[#F3EDE2] transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        settings={settings}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentModule={currentModule}
          onSelectModule={setCurrentModule}
          settings={settings}
          onUpdateSettings={setSettings}
          setMobileOpen={setMobileOpen}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">

          {/* Workflow Studio */}
          {currentModule === 'prompt-studio' && (
            <PromptStudio
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'image-to-prompt' && (
            <ImageToPrompt
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
              onSendToPromptStudio={handleSendToPromptStudio}
            />
          )}
          {currentModule === 'microstock-gen' && (
            <MicrostockGenerator
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
            />
          )}
          {currentModule === 'stock-intelligence' && (
            <StockIntelligence
              onSelectPromptIdea={(idea) => {
                setActivePromptData({ prompt: idea });
                setCurrentModule('prompt-studio');
                showToast(`Loaded concept: ${idea}`);
              }}
            />
          )}
          {(currentModule === 'metadata' || currentModule === 'metadata-studio') && (
            <MetadataGenerator
              initialData={activePromptData}
              showToast={showToast}
            />
          )}
          {currentModule === 'risk-checker' && (
            <RiskChecker
              initialText={activePromptData?.prompt}
              showToast={showToast}
            />
          )}
          {(currentModule === 'bulk-hub' || currentModule === 'bulk-gen') && (
            <BulkHub
              settings={settings}
              onAddToast={showToast}
            />
          )}

          {/* Creators */}
          {currentModule === 'jpg-creator' && (
            <JPGCreator
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'png-creator' && (
            <PNGCreator
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'vector-studio' && (
            <VectorPromptStudio
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'idea-gen' && (
            <IdeaGenerator
              settings={settings}
              showToast={showToast}
              onSendToPromptStudio={handleSendToPromptStudio}
              onSendToMetadata={handleSendToMetadata}
            />
          )}

          {/* AI Tools */}
          {currentModule === 'prompt-improver' && (
            <PromptImprover
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'prompt-variations' && (
            <PromptVariations
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'prompt-expander' && (
            <PromptExpander
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'prompt-fixer' && (
            <PromptFixer
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'prompt-translator' && (
            <PromptTranslator
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'brainstormer' && (
            <Brainstormer
              settings={settings}
              showToast={showToast}
              onSendToPromptStudio={handleSendToPromptStudio}
            />
          )}
          {currentModule === 'silhouette-finder' && (
            <SilhouetteFinder
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}

          {/* Stock & Compliance Tools */}
          {currentModule === 'image-scan' && (
            <ImageScanWorkspace
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'pre-submission-check' && (
            <PreSubmissionAudit
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
            />
          )}
          {currentModule === 'commercial-optimizer' && (
            <CommercialOptimizer
              settings={settings}
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'similarity-checker' && (
            <SimilarityChecker
              settings={settings}
              showToast={showToast}
            />
          )}

          {/* Catalog & Settings */}
          {currentModule === 'library' && (
            <StockLibrary
              showToast={showToast}
              onSendToMetadata={handleSendToMetadata}
              onSendToRisk={handleSendToRisk}
            />
          )}
          {currentModule === 'history' && (
            <HistoryView
              onSelectHistory={(item) => {
                if (item.type === 'prompt' && item.data) {
                  setCurrentModule('prompt-studio');
                  showToast('Loaded prompt from history');
                } else if (item.type === 'metadata') {
                  setCurrentModule('metadata');
                  showToast('Loaded metadata from history');
                } else {
                  setCurrentModule('risk-checker');
                  showToast('Loaded item from history');
                }
              }}
              showToast={showToast}
            />
          )}
          {currentModule === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectModule={(module) => {
          setCurrentModule(module);
          setCommandPaletteOpen(false);
        }}
        onSelectTheme={(theme) => {
          setSettings((prev) => ({ ...prev, themeStyle: theme }));
          showToast(`Theme updated to ${theme}`);
        }}
      />

      {/* Slide-out Result & Compliance Drawer */}
      <ResultDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        data={drawerData}
        onSendToMetadata={handleSendToMetadata}
        onSendToRisk={handleSendToRisk}
      />
    </div>
  );
}

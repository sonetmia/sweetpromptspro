import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  Shield, 
  Moon, 
  Sun, 
  Eye, 
  EyeOff, 
  Zap, 
  Globe, 
  Layers, 
  Check, 
  Wand2, 
  ExternalLink,
  Sparkles,
  Monitor,
  CheckCircle
} from 'lucide-react';
import { AISettings, AIProviderName, ThemeStyle } from '../../types';
import { AIManager } from '../../lib/ai/AIManager';
import { PROVIDER_CAPABILITIES } from '../../lib/ai/capabilities';
import { TestConnectionResult } from '../../lib/ai/providerTypes';
import { useTheme } from '../../lib/theme/ThemeContext';

interface SettingsViewProps {
  settings: AISettings;
  onUpdateSettings: (newSettings: AISettings) => void;
  showToast: (msg: string) => void;
}

interface ProviderMeta {
  id: AIProviderName;
  name: string;
  badge: string;
  description: string;
  freeTier: boolean;
  speedTier: string;
  hasVision: boolean;
  getKeyUrl: string;
  keyPlaceholder: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Vision + Text (Recommended)',
    description: 'Full website capability: Deep stock prompt engineering, structured reasoning, and high-fidelity vision analysis.',
    freeTier: true,
    speedTier: 'Fast',
    hasVision: true,
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIzaSy...',
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Vision + Text (Ultra-Fast LPU)',
    description: 'Full website capability: Blazing 400+ tok/s LPU inference with vision support for Image Scan & Image to Prompt.',
    freeTier: true,
    speedTier: 'Ultra-Fast',
    hasVision: true,
    getKeyUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    badge: 'Vision + Text (European Precision)',
    description: 'Full website capability: High-precision Pixtral multimodal model supporting full site prompt & vision tasks.',
    freeTier: true,
    speedTier: 'Fast',
    hasVision: true,
    getKeyUrl: 'https://console.mistral.ai/api-keys/',
    keyPlaceholder: 'paste mistral key...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Vision + Text (100+ Models)',
    description: 'Full website capability: Universal router supporting Claude 3.5 Sonnet, GPT-4o, and top vision models.',
    freeTier: false,
    speedTier: 'Standard',
    hasVision: true,
    getKeyUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-...',
  },
  {
    id: 'cerebras',
    name: 'Cerebras Cloud',
    badge: 'Text Only (1,500+ tok/s)',
    description: 'Text generation only: Instantaneous prompt expansion and generation (no vision capability).',
    freeTier: true,
    speedTier: 'Instant',
    hasVision: false,
    getKeyUrl: 'https://cloud.cerebras.ai/platform/',
    keyPlaceholder: 'csk-...',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    badge: 'Text Only (Open Source)',
    description: 'Text generation only: Inference endpoints for open source LLMs (Llama 3.3, Qwen 2.5).',
    freeTier: true,
    speedTier: 'Fast',
    hasVision: false,
    getKeyUrl: 'https://huggingface.co/settings/tokens',
    keyPlaceholder: 'hf_...',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  showToast,
}) => {
  const { setTheme: setGlobalTheme } = useTheme();
  const [activeProvider, setActiveProvider] = useState<AIProviderName>(settings.provider || 'gemini');
  const [apiKeys, setApiKeys] = useState<Record<AIProviderName, string>>({
    gemini: settings.apiKeys?.gemini || (settings.provider === 'gemini' ? settings.apiKey : '') || '',
    groq: settings.apiKeys?.groq || (settings.provider === 'groq' ? settings.apiKey : '') || '',
    mistral: settings.apiKeys?.mistral || (settings.provider === 'mistral' ? settings.apiKey : '') || '',
    openrouter: settings.apiKeys?.openrouter || (settings.provider === 'openrouter' ? settings.apiKey : '') || '',
    cerebras: settings.apiKeys?.cerebras || (settings.provider === 'cerebras' ? settings.apiKey : '') || '',
    huggingface: settings.apiKeys?.huggingface || (settings.provider === 'huggingface' ? settings.apiKey : '') || '',
  });

  const [quickPasteKey, setQuickPasteKey] = useState('');
  const [model, setModel] = useState(settings.model || 'gemini-2.5-flash');
  const [autoModel, setAutoModel] = useState<boolean>(settings.autoModel ?? true);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [commercialMode, setCommercialMode] = useState(settings.commercialMode ?? true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(settings.theme || 'dark');
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(settings.themeStyle || 'sweet');

  const [testingProvider, setTestingProvider] = useState<AIProviderName | null>(null);
  const [testResults, setTestResults] = useState<Partial<Record<AIProviderName, TestConnectionResult>>>({});

  // Auto-detect provider when quick-pasting
  const [detectedQuickProv, setDetectedQuickProv] = useState<AIProviderName | null>(null);

  useEffect(() => {
    if (!quickPasteKey.trim()) {
      setDetectedQuickProv(null);
      return;
    }
    const detected = AIManager.detectProviderFromKey(quickPasteKey.trim());
    setDetectedQuickProv(detected);
  }, [quickPasteKey]);

  const handleKeyChange = (prov: AIProviderName, val: string) => {
    const updatedKeys = { ...apiKeys, [prov]: val };
    setApiKeys(updatedKeys);

    // If active provider key changed, update
    if (prov === activeProvider) {
      // Keep in sync
    }
  };

  const handleTestSaveAndActivate = async (prov: AIProviderName, keyOverride?: string) => {
    const key = (keyOverride !== undefined ? keyOverride : apiKeys[prov])?.trim() || '';
    if (!key) {
      showToast(`Please enter an API key for ${prov.toUpperCase()} first`);
      return;
    }

    setTestingProvider(prov);
    try {
      const activeModel = autoModel ? undefined : model;
      const res = await AIManager.testConnection(prov, key, activeModel);
      setTestResults(prev => ({ ...prev, [prov]: res }));

      // Save key & set as active provider
      const updatedKeys = { ...apiKeys, [prov]: key };
      setApiKeys(updatedKeys);
      setActiveProvider(prov);

      const caps = PROVIDER_CAPABILITIES[prov];
      const newModel = caps?.defaultTextModel || 'gemini-2.5-flash';
      setModel(newModel);

      const updatedSettings: AISettings = {
        ...settings,
        provider: prov,
        apiKey: key,
        apiKeys: updatedKeys,
        model: newModel,
        autoModel,
        commercialMode,
        theme,
        themeStyle,
      };

      onUpdateSettings(updatedSettings);

      if (res.success) {
        showToast(`✓ Tested, Saved & Activated ${prov.toUpperCase()} (${res.latencyMs || 0}ms)! Entire site ready.`);
      } else {
        showToast(`⚠️ ${prov.toUpperCase()} saved & activated, but connection test failed: ${res.message || 'Check key'}`);
      }
    } catch (err: any) {
      const updatedKeys = { ...apiKeys, [prov]: key };
      setApiKeys(updatedKeys);
      setActiveProvider(prov);

      const updatedSettings: AISettings = {
        ...settings,
        provider: prov,
        apiKey: key,
        apiKeys: updatedKeys,
        model,
        autoModel,
        commercialMode,
        theme,
        themeStyle,
      };
      onUpdateSettings(updatedSettings);

      setTestResults(prev => ({
        ...prev,
        [prov]: {
          success: false,
          provider: prov,
          message: err.message || 'Connection test failed',
          error: err.message,
          hasText: false,
          hasVision: false,
          modelsCount: 0,
          availableModels: [],
        }
      }));
      showToast(`⚠️ Saved & Activated ${prov.toUpperCase()}, but test failed.`);
    } finally {
      setTestingProvider(null);
    }
  };

  const handleApplyQuickKey = async () => {
    const key = quickPasteKey.trim();
    if (!key) {
      showToast('Please paste an API key first');
      return;
    }

    const detected = detectedQuickProv || activeProvider;
    setQuickPasteKey('');
    await handleTestSaveAndActivate(detected, key);
  };

  const handleSetActiveProvider = (prov: AIProviderName) => {
    setActiveProvider(prov);
    const caps = PROVIDER_CAPABILITIES[prov];
    const newModel = caps?.defaultTextModel || 'gemini-2.5-flash';
    setModel(newModel);
    setTestResults(prev => ({ ...prev, [prov]: undefined }));

    const updated: AISettings = {
      ...settings,
      provider: prov,
      apiKey: apiKeys[prov] || '',
      apiKeys,
      model: newModel,
      autoModel,
      commercialMode,
      theme,
      themeStyle,
    };
    onUpdateSettings(updated);
    showToast(`✓ Active provider switched to ${prov.toUpperCase()}`);
  };

  const handleTestProvider = (prov: AIProviderName) => {
    handleTestSaveAndActivate(prov);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setGlobalTheme(newTheme);
  };

  const handleSaveAll = () => {
    const activeKey = apiKeys[activeProvider]?.trim() || '';
    const updated: AISettings = {
      ...settings,
      provider: activeProvider,
      apiKey: activeKey,
      apiKeys,
      model,
      autoModel,
      commercialMode,
      theme,
      themeStyle,
    };
    onUpdateSettings(updated);
    showToast('✓ Settings & API keys saved successfully');
  };

  const toggleShowKey = (prov: string) => {
    setShowKeys(prev => ({ ...prev, [prov]: !prev[prov] }));
  };

  const activeCapabilities = PROVIDER_CAPABILITIES[activeProvider] || PROVIDER_CAPABILITIES.gemini;
  const availableModels = activeCapabilities.supportedModels || [];

  // Count configured keys
  const configuredCount = Object.values(apiKeys).filter(k => Boolean(k && k.trim())).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#272D30]">
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-[#8C8A86] uppercase mb-1">
            PREFERENCES & API KEYS
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl text-[#F3EDE2] font-normal tracking-tight">
            Settings & AI Configuration
          </h1>
          <p className="text-xs text-[#8C8A86] mt-1 font-normal">
            Add any one API key to power all tools, creators, compliance engines, and metadata analyzers across SweetPrompts Pro.
          </p>
        </div>

        {/* Global Status Pill */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-[6px] bg-[#11161A] border border-[#272D30] text-xs">
          <span className={`w-2.5 h-2.5 rounded-full ${configuredCount > 0 ? 'bg-[#4E8793]' : 'bg-[#C74A43] animate-pulse'}`} />
          <span className="text-[#8C8A86]">Active:</span>
          <span className="font-semibold text-[#F3EDE2] uppercase font-mono">{activeProvider}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A2228] text-[#8C8A86] border border-[#272D30]">
            {configuredCount} key{configuredCount !== 1 ? 's' : ''} ready
          </span>
        </div>
      </div>

      {/* Universal Notice Box */}
      <div className="p-4 rounded-[8px] bg-[#10232D]/40 border border-[#21434B] flex items-start gap-3 text-xs">
        <Sparkles className="w-4 h-4 text-[#4E8793] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-[#F3EDE2]">
            Universal Single-Key Operation (Vision-Capable Providers First)
          </p>
          <p className="text-[#8C8A86] leading-relaxed">
            The <strong>Vision-capable providers (Google Gemini, Groq Cloud, Mistral AI, OpenRouter)</strong> are listed first. Adding <strong>any ONE API key</strong> from these vision-capable providers will seamlessly power 100% of all features across the entire platform — including Image Scan, Image to Prompt, Prompt Creators, and Metadata Studio.
          </p>
        </div>
      </div>

      {/* Quick Auto-Detect Bar */}
      <div className="bg-[#11161A] border border-[#272D30] rounded-[8px] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#F3EDE2] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#C74A43]" />
            <span>Quick Setup: Paste Any API Key</span>
          </label>
          {detectedQuickProv && (
            <span className="text-[11px] text-[#4E8793] font-mono bg-[#21434B]/30 px-2 py-0.5 rounded border border-[#21434B]">
              Detected: {detectedQuickProv.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickPasteKey}
              onChange={(e) => setQuickPasteKey(e.target.value)}
              placeholder="Paste Google Gemini (AIza...), Groq (gsk_...), OpenRouter (sk-or-...), Cerebras (csk-...), or Hugging Face key..."
              className="w-full bg-[#090B0D] border border-[#272D30] rounded-[6px] px-3.5 py-2.5 text-xs text-[#F3EDE2] placeholder-[#8C8A86]/50 focus:outline-none focus:border-[#C74A43] font-mono"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyQuickKey}
            className="px-5 py-2.5 bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] text-xs font-semibold rounded-[6px] transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Test & Save Key</span>
          </button>
        </div>
      </div>

      {/* Multi-Provider Key Management Grid */}
      <div className="bg-[#11161A] border border-[#272D30] rounded-[8px] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1F272B] gap-2">
          <div>
            <h3 className="font-medium text-[#F3EDE2] text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#8C8A86]" />
              <span>AI Provider Keys & Endpoints</span>
            </h3>
            <p className="text-xs text-[#8C8A86] mt-0.5">
              Enter any AI provider API key. Click <strong>Test & Save</strong> to test connection, save to browser, and activate across the entire website.
            </p>
          </div>
          <span className="text-[11px] text-[#8C8A86] font-mono">
            {configuredCount} of {PROVIDERS.length} configured
          </span>
        </div>

        <div className="space-y-4">
          {PROVIDERS.map((p) => {
            const currentVal = apiKeys[p.id] || '';
            const isConfigured = Boolean(currentVal && currentVal.trim());
            const isActive = activeProvider === p.id;
            const isTesting = testingProvider === p.id;
            const testResult = testResults[p.id];
            const isVisible = showKeys[p.id] || false;

            return (
              <div 
                key={p.id}
                className={`p-4 rounded-[8px] border transition-all ${
                  isActive 
                    ? 'border-[#C74A43]/60 bg-[#090B0D]' 
                    : isConfigured 
                      ? 'border-[#272D30] bg-[#090B0D]/60' 
                      : 'border-[#1F272B] bg-[#090B0D]/30'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  {/* Provider Details */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#F3EDE2]">{p.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171E24] text-[#8C8A86] border border-[#272D30]">
                        {p.badge}
                      </span>
                    </div>

                    {/* Status badge */}
                    {isActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#C74A43]/15 text-[#C74A43] border border-[#C74A43]/30 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        ACTIVE
                      </span>
                    ) : isConfigured ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#21434B]/30 text-[#4E8793] border border-[#21434B] flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        READY
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#171E24] text-[#8C8A86] border border-[#272D30]">
                        NO KEY
                      </span>
                    )}
                  </div>

                  {/* Provider Links & Quick Actions */}
                  <div className="flex items-center gap-2">
                    <a
                      href={p.getKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#8C8A86] hover:text-[#F3EDE2] flex items-center gap-1 hover:underline transition-colors"
                    >
                      <span>Get Free Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {!isActive && isConfigured && (
                      <button
                        type="button"
                        onClick={() => handleSetActiveProvider(p.id)}
                        className="text-[11px] px-2.5 py-1 bg-[#171E24] hover:bg-[#212A30] text-[#E8E4DC] hover:text-[#F3EDE2] border border-[#272D30] rounded-[4px] transition-colors cursor-pointer"
                      >
                        Set as Active
                      </button>
                    )}
                  </div>
                </div>

                {/* Input & Test Row */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-3.5 w-3.5 text-[#8C8A86]" />
                    </div>
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={currentVal}
                      onChange={(e) => handleKeyChange(p.id, e.target.value)}
                      placeholder={p.keyPlaceholder}
                      className="w-full bg-[#11161A] border border-[#272D30] rounded-[6px] pl-9 pr-10 py-2 text-xs text-[#F3EDE2] placeholder-[#8C8A86]/40 focus:outline-none focus:border-[#C74A43] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(p.id)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C8A86] hover:text-[#F3EDE2] cursor-pointer"
                    >
                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestProvider(p.id)}
                    disabled={isTesting || !isConfigured}
                    className="px-4 py-2 bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] rounded-[6px] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isTesting ? 'Testing...' : 'Test & Save'}</span>
                  </button>
                </div>

                {/* Test Feedback */}
                {testResult && (
                  <div className={`mt-2.5 p-2 rounded-[6px] border text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-[#21434B]/20 border-[#21434B] text-[#4E8793]'
                      : 'bg-[#C74A43]/15 border-[#C74A43]/40 text-[#C74A43]'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#4E8793]" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#C74A43]" />
                    )}
                    <span className="truncate">{testResult.message} ({testResult.latencyMs || 0}ms)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Automatic Model Discovery & Routing */}
        <div className="space-y-3 pt-4 border-t border-[#1F272B]">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-medium text-[#E8E4DC] flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-[#C74A43]" />
                <span>Model Selection & Capability Routing</span>
              </label>
              <p className="text-xs text-[#8C8A86] mt-0.5">
                Auto-routing dynamically selects ultra-fast models for bulk ideas and high-precision models for metadata.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8C8A86]">Auto-Router</span>
              <button
                type="button"
                onClick={() => setAutoModel(!autoModel)}
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  autoModel ? 'bg-[#C74A43] justify-end' : 'bg-[#272D30] justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>

          {autoModel ? (
            <div className="p-3 rounded-[6px] bg-[#10232D]/30 border border-[#21434B] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-[#4E8793] shrink-0" />
                <div>
                  <span className="font-semibold text-[#F3EDE2]">Capability-Aware Automatic Routing Active</span>
                  <span className="text-[#8C8A86] block text-[11px]">
                    Bulk Prompts: Ultra-fast tier • Metadata: Structured Schema • Image Analysis: Vision Tier
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21434B]/40 text-[#4E8793] font-semibold border border-[#21434B]">
                OPTIMAL
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-[6px] border border-[#272D30] bg-[#090B0D] p-2.5 text-xs text-[#F3EDE2] focus:outline-none focus:border-[#C74A43] font-mono"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m} {m === activeCapabilities.defaultTextModel ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Workspace & Theme Preferences */}
      <div className="bg-[#11161A] border border-[#272D30] rounded-[8px] p-6 space-y-6">
        <div className="pb-3 border-b border-[#1F272B]">
          <h3 className="font-medium text-[#F3EDE2] text-sm">
            Workspace & Appearance Preferences
          </h3>
          <p className="text-xs text-[#8C8A86] mt-0.5">
            Switch between dark cinematic atmosphere and editorial light mode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appearance Mode */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#E8E4DC]">
              Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-2.5 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                  theme === 'light'
                    ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#F3EDE2] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86] hover:text-[#F3EDE2]'
                }`}
              >
                <Sun className="w-4 h-4 text-[#C74A43]" />
                <span className="text-xs">Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-2.5 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                  theme === 'dark'
                    ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#F3EDE2] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86] hover:text-[#F3EDE2]'
                }`}
              >
                <Moon className="w-4 h-4 text-[#8C8A86]" />
                <span className="text-xs">Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`p-2.5 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                  theme === 'system'
                    ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#F3EDE2] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86] hover:text-[#F3EDE2]'
                }`}
              >
                <Monitor className="w-4 h-4 text-[#8C8A86]" />
                <span className="text-xs">System</span>
              </button>
            </div>
          </div>

          {/* Accent Style */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#E8E4DC]">
              Palette Accent
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setThemeStyle('sweet')}
                className={`p-2.5 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                  themeStyle === 'sweet'
                    ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#F3EDE2] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#C74A43]" />
                <span className="text-xs">Coral Red</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeStyle('simple')}
                className={`p-2.5 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                  themeStyle === 'simple'
                    ? 'border-[#383E41] bg-[#171E24] text-[#F3EDE2] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#8C8A86]" />
                <span className="text-xs">Monochrome</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeStyle('futuristic')}
                className={`p-2.5 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                  themeStyle === 'futuristic'
                    ? 'border-[#21434B] bg-[#21434B]/20 text-[#4E8793] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#21434B]" />
                <span className="text-xs">Deep Teal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stock Safety Defaults */}
        <div className="pt-2 border-t border-[#1F272B]">
          <div className="flex items-center justify-between p-3.5 rounded-[6px] bg-[#090B0D] border border-[#272D30]">
            <div>
              <span className="font-semibold text-xs text-[#F3EDE2] block">
                Commercial Stock Compliance Standard
              </span>
              <span className="text-[11px] text-[#8C8A86]">
                Enforces faceless human presence, brand isolation, and negative space across all prompt generators.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCommercialMode(!commercialMode)}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                commercialMode ? 'bg-[#C74A43] justify-end' : 'bg-[#272D30] justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-[#8C8A86]">
          Active engine: <strong className="text-[#F3EDE2] uppercase font-mono">{activeProvider}</strong>
        </span>

        <button
          type="button"
          onClick={handleSaveAll}
          className="h-[42px] px-6 bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] font-semibold text-xs rounded-[6px] flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
};

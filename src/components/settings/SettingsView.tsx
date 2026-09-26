import React, { useState } from 'react';
import { 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Moon, 
  Sun, 
  Eye, 
  EyeOff, 
  Globe, 
  Check, 
  ExternalLink,
  Monitor,
  CheckCircle,
  Trash2,
  Sparkles,
  Cpu,
  ShieldCheck
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
  getKeyUrl: string;
  keyPlaceholder: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Vision + Text (Recommended)',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIzaSy...',
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Vision + Text (Ultra-Fast LPU)',
    getKeyUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    badge: 'Vision + Text',
    getKeyUrl: 'https://console.mistral.ai/api-keys/',
    keyPlaceholder: 'paste mistral key...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Vision + Text (100+ Models)',
    getKeyUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-v1-...',
  },
  {
    id: 'cerebras',
    name: 'Cerebras Cloud',
    badge: 'Text Only (Instant)',
    getKeyUrl: 'https://cloud.cerebras.ai/platform/',
    keyPlaceholder: 'csk-...',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    badge: 'Text Only (Open Source)',
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

  // Input fields for typing new keys
  const [inputValues, setInputValues] = useState<Record<AIProviderName, string>>({
    gemini: '',
    groq: '',
    mistral: '',
    openrouter: '',
    cerebras: '',
    huggingface: '',
  });

  // Saved Keys stored in settings / localStorage
  const [savedKeys, setSavedKeys] = useState<Record<AIProviderName, string>>({
    gemini: settings.apiKeys?.gemini || (settings.provider === 'gemini' ? settings.apiKey : '') || '',
    groq: settings.apiKeys?.groq || (settings.provider === 'groq' ? settings.apiKey : '') || '',
    mistral: settings.apiKeys?.mistral || (settings.provider === 'mistral' ? settings.apiKey : '') || '',
    openrouter: settings.apiKeys?.openrouter || (settings.provider === 'openrouter' ? settings.apiKey : '') || '',
    cerebras: settings.apiKeys?.cerebras || (settings.provider === 'cerebras' ? settings.apiKey : '') || '',
    huggingface: settings.apiKeys?.huggingface || (settings.provider === 'huggingface' ? settings.apiKey : '') || '',
  });

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(settings.theme || 'dark');
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(settings.themeStyle || 'sweet');

  const [testingProvider, setTestingProvider] = useState<AIProviderName | null>(null);
  const [testResults, setTestResults] = useState<Partial<Record<AIProviderName, TestConnectionResult>>>({});

  const handleInputChange = (prov: AIProviderName, val: string) => {
    setInputValues(prev => ({ ...prev, [prov]: val }));
  };

  /**
   * Smart Test & Save:
   * 1. Auto selects optimal model for that provider
   * 2. Runs connection ping
   * 3. Saves key to savedKeys & localStorage
   * 4. Clears the input box so key disappears from input field
   * 5. Displays key underneath as a Saved/Valid item with model name
   */
  const handleTestSaveAndActivate = async (prov: AIProviderName) => {
    const rawKey = inputValues[prov]?.trim() || savedKeys[prov]?.trim() || '';
    if (!rawKey) {
      showToast(`Please enter an API key for ${prov.toUpperCase()} first`);
      return;
    }

    setTestingProvider(prov);
    try {
      const caps = PROVIDER_CAPABILITIES[prov];
      const autoModel = caps?.defaultTextModel || 'gemini-2.5-flash';

      // Live test connection
      const res = await AIManager.testConnection(prov, rawKey, autoModel);
      setTestResults(prev => ({ ...prev, [prov]: res }));

      // Save key & clear input box
      const updatedKeys = { ...savedKeys, [prov]: rawKey };
      setSavedKeys(updatedKeys);
      setInputValues(prev => ({ ...prev, [prov]: '' })); // Clear input box
      setActiveProvider(prov);

      const updatedSettings: AISettings = {
        ...settings,
        provider: prov,
        apiKey: rawKey,
        apiKeys: updatedKeys,
        model: autoModel,
        autoModel: true,
        commercialMode: true,
        theme,
        themeStyle,
      };

      onUpdateSettings(updatedSettings);

      if (res.success) {
        showToast(`✓ Connected & Saved! ${prov.toUpperCase()} model assigned.`);
      } else {
        showToast(`⚠️ ${prov.toUpperCase()} key saved, but connection failed: ${res.message || 'Verify key'}`);
      }
    } catch (err: any) {
      const updatedKeys = { ...savedKeys, [prov]: rawKey };
      setSavedKeys(updatedKeys);
      setInputValues(prev => ({ ...prev, [prov]: '' })); // Clear input box
      setActiveProvider(prov);

      const updatedSettings: AISettings = {
        ...settings,
        provider: prov,
        apiKey: rawKey,
        apiKeys: updatedKeys,
        model: 'gemini-2.5-flash',
        autoModel: true,
        commercialMode: true,
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
      showToast(`⚠️ Saved ${prov.toUpperCase()} key, but test failed.`);
    } finally {
      setTestingProvider(null);
    }
  };

  /**
   * Clear Key:
   * Removes saved key for a provider, resets active provider if needed, and updates settings
   */
  const handleClearKey = (prov: AIProviderName) => {
    const updatedKeys = { ...savedKeys, [prov]: '' };
    setSavedKeys(updatedKeys);
    setInputValues(prev => ({ ...prev, [prov]: '' }));
    
    // Clear test results for this provider
    setTestResults(prev => ({ ...prev, [prov]: undefined }));

    // If active provider was cleared, switch to another saved provider or reset
    let nextActive = activeProvider;
    if (activeProvider === prov) {
      const remainingProv = (Object.keys(updatedKeys) as AIProviderName[]).find(p => Boolean(updatedKeys[p]?.trim()));
      nextActive = remainingProv || 'gemini';
    }
    setActiveProvider(nextActive);

    const activeKey = updatedKeys[nextActive] || '';
    const caps = PROVIDER_CAPABILITIES[nextActive];

    const updatedSettings: AISettings = {
      ...settings,
      provider: nextActive,
      apiKey: activeKey,
      apiKeys: updatedKeys,
      model: caps?.defaultTextModel || 'gemini-2.5-flash',
    };

    onUpdateSettings(updatedSettings);
    showToast(`✓ Cleared ${prov.toUpperCase()} API Key`);
  };

  const handleSetActiveProvider = (prov: AIProviderName) => {
    if (!savedKeys[prov]?.trim()) {
      showToast(`No saved API key for ${prov.toUpperCase()}`);
      return;
    }
    setActiveProvider(prov);
    const caps = PROVIDER_CAPABILITIES[prov];
    const autoModel = caps?.defaultTextModel || 'gemini-2.5-flash';

    const updatedSettings: AISettings = {
      ...settings,
      provider: prov,
      apiKey: savedKeys[prov],
      apiKeys: savedKeys,
      model: autoModel,
    };
    onUpdateSettings(updatedSettings);
    showToast(`✓ Activated ${prov.toUpperCase()} as primary engine`);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setGlobalTheme(newTheme);
    onUpdateSettings({ ...settings, theme: newTheme });
  };

  const toggleShowKey = (prov: string) => {
    setShowKeys(prev => ({ ...prev, [prov]: !prev[prov] }));
  };

  // Helper to mask key preview: AIzaSy...9xL2
  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 10) return '••••••••';
    return key.slice(0, 6) + '••••••••' + key.slice(-4);
  };

  // Count configured keys
  const configuredKeysList = (Object.keys(savedKeys) as AIProviderName[]).filter(
    p => Boolean(savedKeys[p] && savedKeys[p].trim())
  );
  const configuredCount = configuredKeysList.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#272D30]">
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-[#8C8A86] uppercase mb-1">
            API CONFIGURATION & MANAGER
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl text-[#F3EDE2] font-normal tracking-tight">
            AI Provider Keys
          </h1>
          <p className="text-xs text-[#8C8A86] mt-1 font-normal">
            Enter any provider API key. Click <strong>TEST & SAVE</strong> to test connection, auto-assign model, and activate across website.
          </p>
        </div>

        {/* Active Engine Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-[6px] bg-[#11161A] border border-[#272D30] text-xs self-start sm:self-auto">
          <span className={`w-2.5 h-2.5 rounded-full ${configuredCount > 0 ? 'bg-[#4E8793] animate-pulse' : 'bg-[#C74A43]'}`} />
          <span className="text-[#8C8A86]">Active Engine:</span>
          <span className="font-semibold text-[#F3EDE2] uppercase font-mono">
            {configuredCount > 0 ? activeProvider : 'None Saved'}
          </span>
        </div>
      </div>

      {/* Prominent Green Section: API Keys Count & Status */}
      <div className={`p-4 rounded-[8px] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        configuredCount > 0 
          ? 'bg-[#10232D]/90 border-[#21434B] text-[#F3EDE2]' 
          : 'bg-[#1C1516]/80 border-[#C74A43]/40 text-[#F3EDE2]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${configuredCount > 0 ? 'bg-[#21434B] text-[#4E8793]' : 'bg-[#C74A43]/20 text-[#C74A43]'}`}>
            {configuredCount > 0 ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {configuredCount > 0 ? `${configuredCount} API Key(s) Configured & Active` : 'No API Keys Configured'}
              </span>
              {configuredCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21434B] text-[#4E8793] font-bold border border-[#21434B]">
                  READY FOR USE
                </span>
              )}
            </div>
            <p className="text-xs text-[#8C8A86] mt-0.5">
              {configuredCount > 0 
                ? `Active API Provider: ${activeProvider.toUpperCase()} (${PROVIDER_CAPABILITIES[activeProvider]?.defaultTextModel})`
                : 'Enter an API key below to activate all prompt creators, vision scanners, and metadata generators.'
              }
            </p>
          </div>
        </div>

        {configuredCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#4E8793] bg-[#090B0D]/50 px-3 py-1.5 rounded-[6px] border border-[#21434B]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Full Site Ready</span>
          </div>
        )}
      </div>

      {/* Provider List */}
      <div className="bg-[#11161A] border border-[#272D30] rounded-[8px] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F272B]">
          <h3 className="font-medium text-[#F3EDE2] text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#8C8A86]" />
            <span>AI Providers</span>
          </h3>
          <span className="text-[11px] text-[#8C8A86] font-mono">
            {configuredCount} of {PROVIDERS.length} keys set
          </span>
        </div>

        <div className="space-y-4">
          {PROVIDERS.map((p, idx) => {
            const hasSavedKey = Boolean(savedKeys[p.id] && savedKeys[p.id].trim());
            const currentTypedVal = inputValues[p.id] || '';
            const isActive = activeProvider === p.id && hasSavedKey;
            const isTesting = testingProvider === p.id;
            const testResult = testResults[p.id];
            const isVisible = showKeys[p.id] || false;
            const assignedModel = PROVIDER_CAPABILITIES[p.id]?.defaultTextModel || 'gemini-2.5-flash';

            return (
              <div 
                key={p.id}
                className={`p-4 rounded-[8px] border transition-all space-y-3 ${
                  isActive 
                    ? 'border-[#C74A43]/60 bg-[#090B0D]' 
                    : hasSavedKey 
                      ? 'border-[#272D30] bg-[#090B0D]/60' 
                      : 'border-[#1F272B] bg-[#090B0D]/30'
                }`}
              >
                {/* Header Row: Provider Name, Badges, Get Key link & Clear Key */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-xs text-[#F3EDE2]">{p.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#171E24] text-[#8C8A86] border border-[#272D30]">
                      {p.badge}
                    </span>

                    {/* Status Badge */}
                    {isActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#C74A43]/15 text-[#C74A43] border border-[#C74A43]/30 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        ACTIVE
                      </span>
                    ) : hasSavedKey ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#21434B]/30 text-[#4E8793] border border-[#21434B] flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        READY
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href={p.getKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#8C8A86] hover:text-[#F3EDE2] flex items-center gap-1 hover:underline transition-colors font-medium"
                    >
                      <span>Get Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* Clear Key Button */}
                    {(hasSavedKey || currentTypedVal) && (
                      <button
                        type="button"
                        onClick={() => handleClearKey(p.id)}
                        className="text-[11px] px-2.5 py-1 bg-[#1A1818] hover:bg-[#281E1E] text-[#C74A43] border border-[#422222] rounded-[4px] transition-colors cursor-pointer flex items-center gap-1"
                        title="Remove saved API key for this provider"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear Key</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Input & TEST & SAVE Button Row */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-3.5 w-3.5 text-[#8C8A86]" />
                    </div>
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={currentTypedVal}
                      onChange={(e) => handleInputChange(p.id, e.target.value)}
                      placeholder={hasSavedKey ? 'Enter new API key to replace saved key...' : p.keyPlaceholder}
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
                    onClick={() => handleTestSaveAndActivate(p.id)}
                    disabled={isTesting || (!currentTypedVal.trim() && !hasSavedKey)}
                    className="px-4 py-2 bg-[#C74A43] hover:bg-[#B53F39] text-[#F3EDE2] rounded-[6px] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isTesting ? 'Testing...' : 'TEST & SAVE'}</span>
                  </button>
                </div>

                {/* Serial Saved Key Card (Appears under input box when key is saved) */}
                {hasSavedKey && (
                  <div className="p-3 rounded-[6px] bg-[#0D1216] border border-[#21434B]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[#8C8A86] font-sans font-semibold text-[11px]">Key #{idx + 1}:</span>
                      <span className="text-[#F3EDE2] font-semibold bg-[#11161A] px-2 py-0.5 rounded border border-[#272D30]">
                        {maskKey(savedKeys[p.id])}
                      </span>
                      
                      {/* Valid Tag */}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#21434B] text-[#4E8793] font-bold border border-[#21434B] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#4E8793]" />
                        Valid
                      </span>

                      {/* Auto-selected Model Name */}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#171E24] text-[#E8E4DC] border border-[#272D30] flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-[#8C8A86]" />
                        Model: <strong className="text-[#F3EDE2]">{assignedModel}</strong>
                      </span>
                    </div>

                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => handleSetActiveProvider(p.id)}
                        className="text-[11px] font-sans px-2.5 py-1 bg-[#171E24] hover:bg-[#212A30] text-[#E8E4DC] hover:text-[#F3EDE2] border border-[#272D30] rounded-[4px] transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        Use as Primary
                      </button>
                    )}
                  </div>
                )}

                {/* Live Connection Test Feedback */}
                {testResult && (
                  <div className={`p-2 rounded-[6px] border text-xs flex items-center gap-2 ${
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
      </div>

      {/* Minimal Appearance Preferences */}
      <div className="bg-[#11161A] border border-[#272D30] rounded-[8px] p-5 space-y-4">
        <div className="pb-3 border-b border-[#1F272B]">
          <h3 className="font-medium text-[#F3EDE2] text-sm">
            Theme Preferences
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8C8A86]">Theme Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-2 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                  theme === 'light'
                    ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#F3EDE2] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86]'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-[#C74A43]" />
                <span className="text-xs">Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-2 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                  theme === 'dark'
                    ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#F3EDE2] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-[#8C8A86]" />
                <span className="text-xs">Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`p-2 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                  theme === 'system'
                    ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#F3EDE2] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-[#8C8A86]" />
                <span className="text-xs">System</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8C8A86]">Accent Style</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setThemeStyle('sweet');
                  onUpdateSettings({ ...settings, themeStyle: 'sweet' });
                }}
                className={`p-2 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                  themeStyle === 'sweet'
                    ? 'border-[#C74A43] bg-[#C74A43]/10 text-[#F3EDE2] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#C74A43]" />
                <span className="text-xs">Coral</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setThemeStyle('simple');
                  onUpdateSettings({ ...settings, themeStyle: 'simple' });
                }}
                className={`p-2 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                  themeStyle === 'simple'
                    ? 'border-[#383E41] bg-[#171E24] text-[#F3EDE2] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#8C8A86]" />
                <span className="text-xs">Mono</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setThemeStyle('futuristic');
                  onUpdateSettings({ ...settings, themeStyle: 'futuristic' });
                }}
                className={`p-2 rounded-[6px] border text-center transition-colors cursor-pointer flex flex-col items-center gap-1 ${
                  themeStyle === 'futuristic'
                    ? 'border-[#21434B] bg-[#21434B]/20 text-[#4E8793] font-semibold'
                    : 'border-[#272D30] bg-[#090B0D] text-[#8C8A86]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#21434B]" />
                <span className="text-xs">Teal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { AISettings, AIProviderName } from '../../types';
import { getStoredSettings } from '../storage/localStorage';
import { providerRegistry } from './providerRegistry';
import { ModelRouter } from './modelRouter';
import { 
  AITaskType, 
  GenerateTextRequest, 
  GenerateVisionRequest, 
  GenerateStructuredRequest, 
  TestConnectionResult, 
  AIModelInfo, 
  ProviderConfig,
  ProviderCapabilities
} from './providerTypes';
import { PROVIDER_CAPABILITIES } from './capabilities';

export interface AIOptions {
  systemInstruction?: string;
  model?: string;
  taskType?: AITaskType;
  temperature?: number;
  maxTokens?: number;
  providerOverride?: AIProviderName;
  apiKeyOverride?: string;
}

const PROVIDER_ORDER: AIProviderName[] = [
  'gemini',
  'groq',
  'mistral',
  'openrouter',
  'cerebras',
  'huggingface'
];

export class AIManagerClass {
  /**
   * Retrieves current stored settings
   */
  getSettings(): AISettings {
    return getStoredSettings();
  }

  /**
   * Gets the active provider identifier
   */
  getActiveProvider(): AIProviderName {
    const settings = this.getSettings();
    return settings.provider || 'gemini';
  }

  /**
   * Helper to resolve all configured provider keys
   */
  getAllConfiguredProviders(requireVision: boolean = false): Array<{ provider: AIProviderName; apiKey: string }> {
    const settings = this.getSettings();
    const keysMap = settings.apiKeys || {};
    const result: Array<{ provider: AIProviderName; apiKey: string }> = [];

    const activeProv = settings.provider || 'gemini';
    const activeKey = keysMap[activeProv] || (settings.apiKey ? settings.apiKey : '');

    // Place active provider first if configured
    if (activeKey && activeKey.trim()) {
      if (!requireVision || PROVIDER_CAPABILITIES[activeProv]?.supportsVision) {
        result.push({ provider: activeProv, apiKey: activeKey.trim() });
      }
    }

    // Add remaining configured providers
    for (const prov of PROVIDER_ORDER) {
      if (prov === activeProv) continue;
      const k = keysMap[prov];
      if (k && k.trim()) {
        if (!requireVision || PROVIDER_CAPABILITIES[prov]?.supportsVision) {
          result.push({ provider: prov, apiKey: k.trim() });
        }
      }
    }

    return result;
  }

  /**
   * Resolves effective provider and API key with auto-fallback.
   */
  getEffectiveProviderAndKey(
    requestedProvider?: AIProviderName,
    requestedKey?: string,
    requireVision: boolean = false
  ): { provider: AIProviderName; apiKey: string } {
    const settings = this.getSettings();
    const keysMap = settings.apiKeys || {};

    const getKeyForProvider = (prov: AIProviderName): string => {
      const k = keysMap[prov];
      if (k && k.trim()) return k.trim();
      if ((settings.provider === prov || !settings.provider) && settings.apiKey && settings.apiKey.trim()) {
        return settings.apiKey.trim();
      }
      return '';
    };

    if (requestedKey && requestedKey.trim()) {
      const prov = requestedProvider || settings.provider || 'gemini';
      return { provider: prov, apiKey: requestedKey.trim() };
    }

    if (requestedProvider) {
      const key = getKeyForProvider(requestedProvider);
      if (key) {
        if (!requireVision || PROVIDER_CAPABILITIES[requestedProvider]?.supportsVision) {
          return { provider: requestedProvider, apiKey: key };
        }
      }
    }

    const currentProv = settings.provider || 'gemini';
    const currentKey = getKeyForProvider(currentProv);
    if (currentKey) {
      if (!requireVision || PROVIDER_CAPABILITIES[currentProv]?.supportsVision) {
        return { provider: currentProv, apiKey: currentKey };
      }
    }

    for (const prov of PROVIDER_ORDER) {
      const key = getKeyForProvider(prov);
      if (key) {
        if (!requireVision || PROVIDER_CAPABILITIES[prov]?.supportsVision) {
          return { provider: prov, apiKey: key };
        }
      }
    }

    return { provider: currentProv, apiKey: currentKey };
  }

  getCapabilities(provider?: AIProviderName): ProviderCapabilities {
    const targetProvider = provider || this.getActiveProvider();
    return PROVIDER_CAPABILITIES[targetProvider] || PROVIDER_CAPABILITIES.gemini;
  }

  detectProviderFromKey(key: string): AIProviderName | null {
    return providerRegistry.detectProviderFromKey(key);
  }

  getAvailableModels(provider?: AIProviderName): string[] {
    const target = provider || this.getActiveProvider();
    const caps = PROVIDER_CAPABILITIES[target];
    return caps ? caps.supportedModels : PROVIDER_CAPABILITIES.gemini.supportedModels;
  }

  async listModelInfo(provider?: AIProviderName): Promise<AIModelInfo[]> {
    const target = provider || this.getActiveProvider();
    const adapter = providerRegistry.get(target);
    const { apiKey } = this.getEffectiveProviderAndKey(target);
    const settings = this.getSettings();
    return adapter.listModels({ apiKey, model: settings.model });
  }

  async testConnection(
    provider?: AIProviderName, 
    apiKey?: string, 
    model?: string
  ): Promise<TestConnectionResult> {
    const targetProvider = provider || this.getActiveProvider();
    const adapter = providerRegistry.get(targetProvider);
    const settings = this.getSettings();

    const effectiveKey = apiKey !== undefined && apiKey !== '' 
      ? apiKey 
      : (settings.apiKeys?.[targetProvider] || settings.apiKey || '');

    const config: ProviderConfig = {
      apiKey: effectiveKey,
      model: model || settings.model,
    };

    return adapter.testConnection(config);
  }

  /**
   * Helper to check if an error is a Rate Limit / Quota Exceeded error (HTTP 429)
   */
  private isRateLimitError(err: any): boolean {
    const msg = String(err?.message || err?.error || err || '').toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('quota') ||
      msg.includes('rate limit') ||
      msg.includes('too many requests') ||
      msg.includes('resource_exhausted')
    );
  }

  /**
   * Generates text with automatic provider fallback if Rate-Limited (429)
   */
  async generateText(prompt: string, options: AIOptions = {}): Promise<string> {
    const settings = this.getSettings();
    const configuredList = this.getAllConfiguredProviders(false);

    if (configuredList.length === 0) {
      throw new Error(
        'No AI API Key configured. Please go to Settings and add your API key (Google Gemini, Groq, Mistral, OpenRouter, Cerebras, or Hugging Face) to generate stock prompts.'
      );
    }

    let lastError: any = null;

    for (const item of configuredList) {
      try {
        const adapter = providerRegistry.get(item.provider);
        const model = ModelRouter.resolveModel({
          provider: item.provider,
          taskType: options.taskType || 'general-text',
          preferredModel: options.model || (item.provider === settings.provider ? settings.model : undefined),
          autoModel: settings.autoModel ?? true,
        });

        const req: GenerateTextRequest = {
          prompt,
          systemInstruction: options.systemInstruction,
          model,
          taskType: options.taskType,
          temperature: options.temperature ?? settings.temperature,
          maxTokens: options.maxTokens ?? settings.maxTokens,
        };

        const config: ProviderConfig = {
          apiKey: item.apiKey,
          model,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        };

        return await adapter.generateText(req, config);
      } catch (err: any) {
        lastError = err;
        if (this.isRateLimitError(err) && configuredList.length > 1) {
          console.warn(`[AIManager] ${item.provider} rate limited/quota reached. Retrying with secondary provider...`);
          continue; // Try next configured provider
        }
        throw err;
      }
    }

    throw lastError || new Error('Failed to generate text.');
  }

  /**
   * Generates vision with automatic provider fallback if Rate-Limited (429)
   */
  async generateVision(
    imageBase64: string, 
    mimeType: string, 
    prompt: string, 
    options: AIOptions = {}
  ): Promise<string> {
    const settings = this.getSettings();
    const configuredList = this.getAllConfiguredProviders(true); // require vision

    if (configuredList.length === 0) {
      throw new Error(
        'No API Key found for vision analysis. Please add a Google Gemini, Groq, Mistral, or OpenRouter API key in Settings.'
      );
    }

    let lastError: any = null;

    for (const item of configuredList) {
      try {
        const adapter = providerRegistry.get(item.provider);
        if (!adapter.capabilities.supportsVision) continue;

        const model = ModelRouter.resolveModel({
          provider: item.provider,
          taskType: 'vision-analysis',
          preferredModel: options.model || (item.provider === settings.provider ? settings.model : undefined),
          autoModel: settings.autoModel ?? true,
        });

        const req: GenerateVisionRequest = {
          imageBase64,
          mimeType,
          prompt,
          model,
          taskType: 'vision-analysis',
        };

        const config: ProviderConfig = {
          apiKey: item.apiKey,
          model,
        };

        return await adapter.generateVision(req, config);
      } catch (err: any) {
        lastError = err;
        if (this.isRateLimitError(err) && configuredList.length > 1) {
          console.warn(`[AIManager] ${item.provider} vision rate limited. Retrying with secondary vision provider...`);
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('Failed to generate vision analysis.');
  }

  /**
   * Generates structured JSON output with automatic fallback on Rate-Limit (429)
   */
  async generateStructured<T = any>(
    prompt: string, 
    options: AIOptions = {}
  ): Promise<T> {
    const settings = this.getSettings();
    const configuredList = this.getAllConfiguredProviders(false);

    if (configuredList.length === 0) {
      throw new Error(
        'No AI API Key configured. Please go to Settings and add your API key to generate metadata.'
      );
    }

    let lastError: any = null;

    for (const item of configuredList) {
      try {
        const adapter = providerRegistry.get(item.provider);
        const model = ModelRouter.resolveModel({
          provider: item.provider,
          taskType: options.taskType || 'metadata-generation',
          preferredModel: options.model || (item.provider === settings.provider ? settings.model : undefined),
          autoModel: settings.autoModel ?? true,
        });

        const req: GenerateStructuredRequest = {
          prompt,
          systemInstruction: options.systemInstruction,
          model,
          taskType: options.taskType || 'metadata-generation',
        };

        const config: ProviderConfig = {
          apiKey: item.apiKey,
          model,
        };

        return await adapter.generateStructured<T>(req, config);
      } catch (err: any) {
        lastError = err;
        if (this.isRateLimitError(err) && configuredList.length > 1) {
          console.warn(`[AIManager] ${item.provider} rate limited during structured generation. Retrying fallback...`);
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('Failed to generate structured data.');
  }
}

export const AIManager = new AIManagerClass();

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
   * Resolves effective provider and API key with auto-fallback.
   * Prioritizes vision-capable providers (Gemini, Groq, Mistral, OpenRouter) so any 1 key enables the entire website.
   */
  getEffectiveProviderAndKey(
    requestedProvider?: AIProviderName,
    requestedKey?: string,
    requireVision: boolean = false
  ): { provider: AIProviderName; apiKey: string } {
    const settings = this.getSettings();
    const keysMap = settings.apiKeys || {};

    // Helper to safely resolve a key for any provider
    const getKeyForProvider = (prov: AIProviderName): string => {
      const k = keysMap[prov];
      if (k && k.trim()) return k.trim();
      if ((settings.provider === prov || !settings.provider) && settings.apiKey && settings.apiKey.trim()) {
        return settings.apiKey.trim();
      }
      return '';
    };

    // 1. If explicit key override provided
    if (requestedKey && requestedKey.trim()) {
      const prov = requestedProvider || settings.provider || 'gemini';
      return { provider: prov, apiKey: requestedKey.trim() };
    }

    // 2. Check if requested provider has a key
    if (requestedProvider) {
      const key = getKeyForProvider(requestedProvider);
      if (key) {
        if (!requireVision || PROVIDER_CAPABILITIES[requestedProvider]?.supportsVision) {
          return { provider: requestedProvider, apiKey: key };
        }
      }
    }

    // 3. Check if active settings.provider has a key
    const currentProv = settings.provider || 'gemini';
    const currentKey = getKeyForProvider(currentProv);
    if (currentKey) {
      if (!requireVision || PROVIDER_CAPABILITIES[currentProv]?.supportsVision) {
        return { provider: currentProv, apiKey: currentKey };
      }
    }

    // 4. Fallback: Scan vision-capable providers first (Gemini, Groq, Mistral, OpenRouter)
    for (const prov of PROVIDER_ORDER) {
      const key = getKeyForProvider(prov);
      if (key) {
        if (!requireVision || PROVIDER_CAPABILITIES[prov]?.supportsVision) {
          return { provider: prov, apiKey: key };
        }
      }
    }

    // 5. General fallback if no exact capability match
    for (const prov of PROVIDER_ORDER) {
      const key = getKeyForProvider(prov);
      if (key) {
        return { provider: prov, apiKey: key };
      }
    }

    return { provider: currentProv, apiKey: currentKey };
  }

  /**
   * Gets capability matrix for a provider (or the currently active provider)
   */
  getCapabilities(provider?: AIProviderName): ProviderCapabilities {
    const targetProvider = provider || this.getActiveProvider();
    return PROVIDER_CAPABILITIES[targetProvider] || PROVIDER_CAPABILITIES.gemini;
  }

  /**
   * Auto-detects provider based on the pasted API key format
   */
  detectProviderFromKey(key: string): AIProviderName | null {
    return providerRegistry.detectProviderFromKey(key);
  }

  /**
   * Gets available models for the given provider (or active provider)
   */
  getAvailableModels(provider?: AIProviderName): string[] {
    const target = provider || this.getActiveProvider();
    const caps = PROVIDER_CAPABILITIES[target];
    return caps ? caps.supportedModels : PROVIDER_CAPABILITIES.gemini.supportedModels;
  }

  /**
   * Gets full model information list for a provider
   */
  async listModelInfo(provider?: AIProviderName): Promise<AIModelInfo[]> {
    const target = provider || this.getActiveProvider();
    const adapter = providerRegistry.get(target);
    const { apiKey } = this.getEffectiveProviderAndKey(target);
    const settings = this.getSettings();
    return adapter.listModels({ apiKey, model: settings.model });
  }

  /**
   * Tests the connection with real lightweight ping to the provider
   */
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
   * Generates text via the centralized provider adapter and router.
   * Seamlessly resolves any configured API key across all providers.
   */
  async generateText(prompt: string, options: AIOptions = {}): Promise<string> {
    const settings = this.getSettings();
    const { provider, apiKey } = this.getEffectiveProviderAndKey(
      options.providerOverride,
      options.apiKeyOverride,
      false
    );

    if (!apiKey) {
      throw new Error(
        'No AI API Key configured. Please go to Settings and add your API key (Google Gemini, Groq, Mistral, OpenRouter, Cerebras, or Hugging Face) to generate stock prompts.'
      );
    }

    const adapter = providerRegistry.get(provider);

    // Resolve optimal model via capability router
    const model = ModelRouter.resolveModel({
      provider,
      taskType: options.taskType || 'general-text',
      preferredModel: options.model || (provider === settings.provider ? settings.model : undefined),
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
      apiKey,
      model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    };

    return adapter.generateText(req, config);
  }

  /**
   * Generates vision analysis for image inputs.
   * Auto-routes to a vision-capable configured provider if current one doesn't support vision.
   */
  async generateVision(
    imageBase64: string, 
    mimeType: string, 
    prompt: string, 
    options: AIOptions = {}
  ): Promise<string> {
    const settings = this.getSettings();
    const { provider, apiKey } = this.getEffectiveProviderAndKey(
      options.providerOverride,
      options.apiKeyOverride,
      true // require vision
    );

    if (!apiKey) {
      throw new Error(
        'No API Key found for vision analysis. Please add a Google Gemini, Groq, Mistral, or OpenRouter API key in Settings.'
      );
    }

    const adapter = providerRegistry.get(provider);

    // Check capability
    if (!adapter.capabilities.supportsVision) {
      throw new Error(
        `Vision analysis is not supported by ${adapter.displayName}. Please configure Google Gemini, Groq, or OpenRouter in Settings to analyze images.`
      );
    }

    const model = ModelRouter.resolveModel({
      provider,
      taskType: 'vision-analysis',
      preferredModel: options.model || (provider === settings.provider ? settings.model : undefined),
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
      apiKey,
      model,
    };

    return adapter.generateVision(req, config);
  }

  /**
   * Generates structured JSON output using schema enforcement
   */
  async generateStructured<T = any>(
    prompt: string, 
    options: AIOptions = {}
  ): Promise<T> {
    const settings = this.getSettings();
    const { provider, apiKey } = this.getEffectiveProviderAndKey(
      options.providerOverride,
      options.apiKeyOverride,
      false
    );

    if (!apiKey) {
      throw new Error(
        'No AI API Key configured. Please go to Settings and add your API key to generate metadata.'
      );
    }

    const adapter = providerRegistry.get(provider);

    const model = ModelRouter.resolveModel({
      provider,
      taskType: options.taskType || 'metadata-generation',
      preferredModel: options.model || (provider === settings.provider ? settings.model : undefined),
      autoModel: settings.autoModel ?? true,
    });

    const req: GenerateStructuredRequest = {
      prompt,
      systemInstruction: options.systemInstruction,
      model,
      taskType: options.taskType || 'metadata-generation',
    };

    const config: ProviderConfig = {
      apiKey,
      model,
    };

    return adapter.generateStructured<T>(req, config);
  }
}

export const AIManager = new AIManagerClass();

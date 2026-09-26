import { AIProviderName } from '../../types';
import { ProviderCapabilities, CAPABILITY_NOT_SUPPORTED } from './providerTypes';

export { CAPABILITY_NOT_SUPPORTED };

export const PROVIDER_CAPABILITIES: Record<AIProviderName, ProviderCapabilities> = {
  gemini: {
    supportsText: true,
    supportsVision: true,
    supportsStructuredJson: true,
    speedTier: 'fast',
    freeOrLowCostTier: true,
    defaultTextModel: 'gemini-2.5-flash',
    defaultVisionModel: 'gemini-2.5-flash',
    defaultStructuredModel: 'gemini-2.5-flash',
    supportedModels: [
      'gemini-2.5-flash',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-3.1-pro-preview'
    ]
  },
  groq: {
    supportsText: true,
    supportsVision: true, // Supported via llama-3.2-11b-vision-preview
    supportsStructuredJson: true,
    speedTier: 'ultra-fast',
    freeOrLowCostTier: true,
    defaultTextModel: 'llama-3.3-70b-versatile',
    defaultVisionModel: 'llama-3.2-11b-vision-preview',
    defaultStructuredModel: 'llama-3.3-70b-versatile',
    supportedModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
      'llama-3.2-11b-vision-preview'
    ]
  },
  mistral: {
    supportsText: true,
    supportsVision: true, // Supported via pixtral-12b-2409
    supportsStructuredJson: true,
    speedTier: 'fast',
    freeOrLowCostTier: true,
    defaultTextModel: 'mistral-large-latest',
    defaultVisionModel: 'pixtral-12b-2409',
    defaultStructuredModel: 'mistral-large-latest',
    supportedModels: [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
      'codestral-latest',
      'pixtral-12b-2409'
    ]
  },
  openrouter: {
    supportsText: true,
    supportsVision: true,
    supportsStructuredJson: true,
    speedTier: 'fast',
    freeOrLowCostTier: false,
    defaultTextModel: 'anthropic/claude-3.5-sonnet',
    defaultVisionModel: 'anthropic/claude-3.5-sonnet',
    defaultStructuredModel: 'anthropic/claude-3.5-sonnet',
    supportedModels: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'deepseek/deepseek-chat',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-001'
    ]
  },
  huggingface: {
    supportsText: true,
    supportsVision: false,
    supportsStructuredJson: true,
    speedTier: 'fast',
    freeOrLowCostTier: true,
    defaultTextModel: 'meta-llama/Llama-3.3-70B-Instruct',
    defaultStructuredModel: 'meta-llama/Llama-3.3-70B-Instruct',
    supportedModels: [
      'meta-llama/Llama-3.3-70B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3',
      'Qwen/Qwen2.5-72B-Instruct',
      'microsoft/Phi-3.5-mini-instruct'
    ]
  },
  cerebras: {
    supportsText: true,
    supportsVision: false,
    supportsStructuredJson: true,
    speedTier: 'ultra-fast',
    freeOrLowCostTier: true,
    defaultTextModel: 'llama3.3-70b',
    defaultStructuredModel: 'llama3.3-70b',
    supportedModels: [
      'llama3.3-70b',
      'llama3.1-8b'
    ]
  }
};

export function getProviderCapabilities(provider: AIProviderName): ProviderCapabilities {
  return PROVIDER_CAPABILITIES[provider] || PROVIDER_CAPABILITIES.gemini;
}

export function validateProviderCapability(
  provider: AIProviderName, 
  capability: 'text' | 'vision' | 'structured'
): boolean {
  const caps = getProviderCapabilities(provider);
  switch (capability) {
    case 'text':
      return caps.supportsText;
    case 'vision':
      return caps.supportsVision;
    case 'structured':
      return caps.supportsStructuredJson;
    default:
      return false;
  }
}

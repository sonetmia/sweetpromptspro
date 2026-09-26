import { AIProviderName } from '../../types';
import { AITaskType, CAPABILITY_NOT_SUPPORTED } from './providerTypes';
import { PROVIDER_CAPABILITIES } from './capabilities';

export interface RouteModelOptions {
  provider: AIProviderName;
  taskType?: AITaskType;
  preferredModel?: string;
  autoModel?: boolean;
}

export class ModelRouter {
  /**
   * Resolves the most appropriate model for a given provider and task type.
   * If autoModel is true or preferredModel is empty/auto, routes intelligently based on capabilities.
   */
  static resolveModel(options: RouteModelOptions): string {
    const { provider, taskType = 'general-text', preferredModel, autoModel = true } = options;
    const caps = PROVIDER_CAPABILITIES[provider] || PROVIDER_CAPABILITIES.gemini;

    // If user has chosen a specific model and autoModel is disabled (or not set to 'auto'), respect their choice
    if (preferredModel && preferredModel !== 'auto' && !autoModel) {
      return preferredModel;
    }

    // Task-based routing
    switch (taskType) {
      case 'vision-analysis':
        if (!caps.supportsVision) {
          throw new Error(
            `Selected provider (${provider.toUpperCase()}) does not support vision analysis. Please switch to Gemini, Groq, or OpenRouter for image-to-prompt analysis.`
          );
        }
        return caps.defaultVisionModel || caps.defaultTextModel;

      case 'bulk-generation':
      case 'prompt-variations':
      case 'prompt-expander':
        // Favor ultra-fast high-throughput models when available
        if (provider === 'gemini') return 'gemini-2.5-flash';
        if (provider === 'groq') return 'llama-3.1-8b-instant';
        if (provider === 'mistral') return 'mistral-small-latest';
        if (provider === 'cerebras') return 'llama3.1-8b';
        return caps.defaultTextModel;

      case 'metadata-generation':
      case 'compliance-audit':
        // Favor high precision structured models
        if (provider === 'gemini') return 'gemini-2.5-flash';
        if (provider === 'groq') return 'llama-3.3-70b-versatile';
        if (provider === 'mistral') return 'mistral-large-latest';
        if (provider === 'cerebras') return 'llama3.3-70b';
        return caps.defaultStructuredModel;

      case 'idea-generation':
      case 'prompt-generation':
      case 'prompt-improver':
      case 'silhouette-finder':
      case 'general-text':
      default:
        return caps.defaultTextModel;
    }
  }

  /**
   * Checks if the provider can fulfill the task type
   */
  static canHandleTask(provider: AIProviderName, taskType: AITaskType): boolean {
    const caps = PROVIDER_CAPABILITIES[provider] || PROVIDER_CAPABILITIES.gemini;
    if (taskType === 'vision-analysis') {
      return caps.supportsVision;
    }
    return true;
  }
}

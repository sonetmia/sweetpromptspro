import { AIProviderName } from '../../types';
import { AIManager } from './AIManager';
import { PROVIDER_CAPABILITIES } from './capabilities';

export { AIManager };
export * from './providerTypes';
export * from './capabilities';
export * from './modelRouter';
export * from './providerRegistry';

/**
 * Universal wrapper for text generation across all modules
 */
export async function callAI(
  prompt: string,
  systemInstruction?: string,
  jsonMode: boolean = false
): Promise<string> {
  if (jsonMode) {
    const structured = await AIManager.generateStructured(prompt, {
      systemInstruction,
      taskType: 'metadata-generation'
    });
    return typeof structured === 'string' ? structured : JSON.stringify(structured);
  }

  return AIManager.generateText(prompt, {
    systemInstruction,
    taskType: 'prompt-generation'
  });
}

/**
 * Universal wrapper for vision analysis across all modules
 */
export async function analyzeImageWithAI(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  return AIManager.generateVision(imageBase64, mimeType, prompt, {
    taskType: 'vision-analysis'
  });
}

/**
 * Universal wrapper for testing connection
 */
export async function testAIConnection(
  provider: AIProviderName,
  apiKey: string,
  model: string
): Promise<{ success: boolean; message: string; data?: any }> {
  const result = await AIManager.testConnection(provider, apiKey, model);
  return {
    success: result.success,
    message: result.message,
    data: result
  };
}

/**
 * Gets default text model for a provider
 */
export function getDefaultModel(provider: AIProviderName): string {
  const caps = PROVIDER_CAPABILITIES[provider];
  return caps ? caps.defaultTextModel : 'gemini-2.5-flash';
}

/**
 * Gets available model list for a provider
 */
export function getAvailableModels(provider: AIProviderName): string[] {
  return AIManager.getAvailableModels(provider);
}

import { 
  AIProviderAdapter, 
  GenerateTextRequest, 
  GenerateVisionRequest, 
  GenerateStructuredRequest, 
  TestConnectionResult, 
  AIModelInfo, 
  ProviderConfig 
} from '../providerTypes';
import { PROVIDER_CAPABILITIES } from '../capabilities';
import { executeApiGenerate, executeApiVision, executeApiTestConnection } from '../proxyClient';

export class GeminiProvider implements AIProviderAdapter {
  id = 'gemini' as const;
  name = 'gemini';
  displayName = 'Google Gemini';
  description = 'Industry-leading multimodal model with superior prompt engineering and vision analysis capabilities.';
  capabilities = PROVIDER_CAPABILITIES.gemini;

  detectKey(apiKey: string): boolean {
    const trimmed = apiKey.trim();
    return trimmed.startsWith('AIza') && trimmed.length >= 35 && trimmed.length <= 45;
  }

  async testConnection(config?: ProviderConfig): Promise<TestConnectionResult> {
    const startTime = performance.now();
    try {
      const data = await executeApiTestConnection({
        provider: this.id,
        apiKey: config?.apiKey,
        model: config?.model || this.capabilities.defaultTextModel,
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!data.success) {
        return {
          success: false,
          provider: this.id,
          message: data.error || data.message || 'Gemini connection failed',
          error: data.error,
          hasText: false,
          hasVision: false,
          modelsCount: this.capabilities.supportedModels.length,
          availableModels: this.capabilities.supportedModels,
          latencyMs,
        };
      }

      return {
        success: true,
        provider: this.id,
        message: data.message || 'Connected to Google Gemini API successfully',
        hasText: true,
        hasVision: true,
        modelsCount: this.capabilities.supportedModels.length,
        availableModels: this.capabilities.supportedModels,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.id,
        message: err.message || 'Network error during connection test',
        error: err.message,
        hasText: false,
        hasVision: false,
        modelsCount: this.capabilities.supportedModels.length,
        availableModels: this.capabilities.supportedModels,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }
  }

  async listModels(_config?: ProviderConfig): Promise<AIModelInfo[]> {
    return this.capabilities.supportedModels.map(m => ({
      id: m,
      name: m,
      description: m.includes('flash') ? 'Ultra-fast low-latency inference' : 'Deep reasoning and complex generation',
      supportsVision: true,
      supportsStructured: true,
      isDefault: m === this.capabilities.defaultTextModel
    }));
  }

  async generateText(req: GenerateTextRequest, config?: ProviderConfig): Promise<string> {
    return executeApiGenerate({
      provider: this.id,
      apiKey: config?.apiKey,
      model: req.model || config?.model || this.capabilities.defaultTextModel,
      prompt: req.prompt,
      systemInstruction: req.systemInstruction,
      jsonMode: false,
      temperature: req.temperature ?? config?.temperature ?? 0.7,
      maxTokens: req.maxTokens ?? config?.maxTokens,
    });
  }

  async generateVision(req: GenerateVisionRequest, config?: ProviderConfig): Promise<string> {
    return executeApiVision({
      provider: this.id,
      apiKey: config?.apiKey,
      model: req.model || config?.model || this.capabilities.defaultVisionModel,
      imageBase64: req.imageBase64,
      mimeType: req.mimeType,
      prompt: req.prompt,
    });
  }

  async generateStructured<T = any>(req: GenerateStructuredRequest, config?: ProviderConfig): Promise<T> {
    const rawResult = await executeApiGenerate({
      provider: this.id,
      apiKey: config?.apiKey,
      model: req.model || config?.model || this.capabilities.defaultStructuredModel,
      prompt: req.prompt,
      systemInstruction: req.systemInstruction,
      jsonMode: true,
    });

    try {
      const cleaned = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as T;
    } catch (e: any) {
      throw new Error(`Failed to parse structured response from Gemini: ${rawResult.slice(0, 100)}`);
    }
  }
}

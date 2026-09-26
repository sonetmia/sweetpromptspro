import { 
  AIProviderAdapter, 
  GenerateTextRequest, 
  GenerateVisionRequest, 
  GenerateStructuredRequest, 
  TestConnectionResult, 
  AIModelInfo, 
  ProviderConfig,
  CAPABILITY_NOT_SUPPORTED
} from '../providerTypes';
import { PROVIDER_CAPABILITIES } from '../capabilities';
import { executeApiGenerate, executeApiTestConnection } from '../proxyClient';

export class HuggingFaceProvider implements AIProviderAdapter {
  id = 'huggingface' as const;
  name = 'huggingface';
  displayName = 'Hugging Face Inference';
  description = 'Open-source frontier models running on Hugging Face Serverless / Dedicated Inference Endpoints.';
  capabilities = PROVIDER_CAPABILITIES.huggingface;

  detectKey(apiKey: string): boolean {
    const trimmed = apiKey.trim();
    return trimmed.startsWith('hf_') && trimmed.length >= 20;
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
          message: data.error || data.message || 'Hugging Face connection failed',
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
        message: data.message || 'Connected to Hugging Face Inference API successfully',
        hasText: true,
        hasVision: false,
        modelsCount: this.capabilities.supportedModels.length,
        availableModels: this.capabilities.supportedModels,
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.id,
        message: err.message || 'Network error during Hugging Face connection test',
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
      description: 'Open-weights instruction model hosted on Hugging Face',
      supportsVision: false,
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

  async generateVision(_req: GenerateVisionRequest, _config?: ProviderConfig): Promise<string> {
    throw new Error(CAPABILITY_NOT_SUPPORTED);
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
      throw new Error(`Failed to parse structured response from Hugging Face: ${rawResult.slice(0, 100)}`);
    }
  }
}

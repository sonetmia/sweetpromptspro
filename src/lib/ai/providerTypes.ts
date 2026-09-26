import { AIProviderName } from '../../types';

export const CAPABILITY_NOT_SUPPORTED = 'CAPABILITY_NOT_SUPPORTED';

export type AITaskType = 
  | 'prompt-generation'
  | 'idea-generation'
  | 'bulk-generation'
  | 'vision-analysis'
  | 'metadata-generation'
  | 'compliance-audit'
  | 'prompt-improver'
  | 'prompt-variations'
  | 'prompt-expander'
  | 'prompt-fixer'
  | 'prompt-translator'
  | 'silhouette-finder'
  | 'general-text';

export interface ProviderCapabilities {
  supportsText: boolean;
  supportsVision: boolean;
  supportsStructuredJson: boolean;
  speedTier: 'ultra-fast' | 'fast' | 'standard';
  freeOrLowCostTier: boolean;
  supportedModels: string[];
  defaultTextModel: string;
  defaultVisionModel?: string;
  defaultStructuredModel: string;
}

export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateTextRequest {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  taskType?: AITaskType;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateVisionRequest {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  model?: string;
  taskType?: AITaskType;
}

export interface GenerateStructuredRequest {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  taskType?: AITaskType;
  schemaDescription?: string;
}

export interface TestConnectionResult {
  success: boolean;
  provider: AIProviderName;
  message: string;
  error?: string;
  hasText: boolean;
  hasVision: boolean;
  modelsCount: number;
  availableModels: string[];
  latencyMs?: number;
}

export interface AIModelInfo {
  id: string;
  name: string;
  description?: string;
  supportsVision?: boolean;
  supportsStructured?: boolean;
  isDefault?: boolean;
}

export interface AIProviderAdapter {
  id: AIProviderName;
  name: string;
  displayName: string;
  description: string;
  capabilities: ProviderCapabilities;
  detectKey(apiKey: string): boolean;
  testConnection(config?: ProviderConfig): Promise<TestConnectionResult>;
  listModels(config?: ProviderConfig): Promise<AIModelInfo[]>;
  generateText(req: GenerateTextRequest, config?: ProviderConfig): Promise<string>;
  generateVision(req: GenerateVisionRequest, config?: ProviderConfig): Promise<string>;
  generateStructured<T = any>(req: GenerateStructuredRequest, config?: ProviderConfig): Promise<T>;
}

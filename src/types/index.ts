export type ThemeStyle = 'sweet' | 'simple' | 'futuristic';

export type ModuleType = 
  | 'home'
  | 'prompt-studio'
  // Creators
  | 'bulk-gen'
  | 'idea-gen'
  | 'jpg-creator'
  | 'png-creator'
  | 'vector-studio'
  // AI Tools
  | 'prompt-improver'
  | 'prompt-variations'
  | 'prompt-expander'
  | 'prompt-fixer'
  | 'prompt-translator'
  | 'brainstormer'
  | 'silhouette-finder'
  // Stock Tools
  | 'image-scan'
  | 'metadata-studio'
  | 'risk-checker'
  | 'commercial-optimizer'
  | 'similarity-checker'
  | 'pre-submission-check'
  // Legacy / Direct Modules
  | 'image-to-prompt'
  | 'microstock-gen'
  | 'stock-intelligence'
  | 'metadata'
  | 'bulk-hub'
  | 'history'
  | 'library'
  | 'settings';

export type AIProviderName = 
  | 'gemini' 
  | 'groq' 
  | 'mistral' 
  | 'openrouter' 
  | 'huggingface' 
  | 'cerebras';

export interface AISettings {
  provider: AIProviderName;
  apiKey: string;
  apiKeys?: Partial<Record<AIProviderName, string>>;
  model: string;
  autoModel?: boolean;
  temperature: number;
  maxTokens: number;
  defaultPromptCount: number;
  commercialMode: boolean;
  theme: 'light' | 'dark' | 'system';
  themeStyle: ThemeStyle;
  defaultCopySpace?: string;
  defaultContentType?: string;
}

export interface PromptRequest {
  topic: string;
  category: string;
  visualType: string;
  aspectRatio: string;
  commercialIntent: string;
  negativeRequirements: string;
  advanced?: {
    composition?: string;
    lighting?: string;
    cameraLens?: string;
    colorPalette?: string;
    background?: string;
    perspective?: string;
    depthOfField?: string;
    negativeSpace?: string;
    subjectPlacement?: string;
    style?: string;
    detailLevel?: string;
  };
}

export interface GeneratedPromptResult {
  id: string;
  createdAt: number;
  title: string;
  prompt: string;
  subject: string;
  environment: string;
  composition: string;
  visualStyle: string;
  lighting: string;
  camera: string;
  color: string;
  commercialIntent: string;
  negativeRequirements: string;
  category: string;
  provider: AIProviderName;
  model: string;
}

export interface ImageAnalysisResult {
  subject: string;
  environment: string;
  composition: string;
  lighting: string;
  colors: string;
  perspective: string;
  style: string;
  background: string;
  negativeSpace: string;
  commercialUse: string;
  targetAudience: string;
  stockCategory: string;
  generatedPrompt: string;
  riskSignals: {
    term: string;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
  }[];
}

export interface MetadataResult {
  title: string;
  keywords: string[];
  category: string;
  contentType: string;
  riskTerms: string[];
}

export interface RiskCheckResult {
  overall: 'LOW' | 'MEDIUM' | 'HIGH' | 'SAFE';
  summary: string;
  findings: {
    term: string;
    category: 'Human Face' | 'Brand' | 'Entertainment' | 'Technology' | 'Celebrity' | 'Property' | 'Text' | 'Artist Style' | 'Prohibited Content';
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
    recommendation: string;
  }[];
}

export interface HistoryItem {
  id: string;
  createdAt: number;
  type: 'prompt' | 'vision' | 'microstock' | 'metadata' | 'risk';
  title: string;
  summary: string;
  data: any;
  provider: AIProviderName;
  model: string;
}

export interface SeasonalConcept {
  title: string;
  promptIdea: string;
  category: string;
  commercialUse: string;
  copySpace: string;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  season: string;
  description: string;
  concepts: SeasonalConcept[];
}

export interface LibraryItem {
  id: string;
  createdAt: number;
  title: string;
  prompt: string;
  category: string;
  contentType: 'Photo' | 'Illustration' | 'Vector';
  aspectRatio: string;
  copySpace?: string;
  keywords?: string[];
  notes?: string;
  tags?: string[];
  status?: 'draft' | 'ready' | 'submitted';
}

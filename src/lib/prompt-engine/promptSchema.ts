export type PromptCount = 1 | 5 | 10 | 15 | 20 | 25 | 30;

export const PROMPT_COUNT_OPTIONS: PromptCount[] = [1, 5, 10, 15, 20, 25, 30];

export type CommercialIntentType =
  | 'Advertising'
  | 'Website Hero'
  | 'Social Media'
  | 'E-commerce'
  | 'Packaging'
  | 'Presentation'
  | 'Editorial'
  | 'Education'
  | 'Business'
  | 'Background'
  | 'Banner'
  | 'Print'
  | 'Marketing';

export type NegativeSpaceType = 'None' | 'Left' | 'Right' | 'Top' | 'Bottom' | 'Center';

export type ContentType = 'Photo' | 'Illustration' | 'Vector' | '3D Render' | 'Silhouette' | string;

export type VariationStrength = 'Low' | 'Medium' | 'High';

export interface UniversalPromptRequest {
  subject: string;
  instructions?: string;
  count: PromptCount;
  contentType?: ContentType;
  category?: string;
  subcategory?: string;
  commercialIntent?: CommercialIntentType | string;
  aspectRatio?: string;
  negativeSpace?: NegativeSpaceType | string;
  copySpace?: string;
  lighting?: string;
  composition?: string;
  viewpoint?: string;
  colorDirection?: string;
  variationStrength?: VariationStrength;
  sectionContext?: string; // 'Bulk Generator' | 'Idea Generator' | 'JPG Creator' | 'PNG Creator' | 'Silhouette Finder' | etc.
  extraParameters?: Record<string, any>;
}

export interface GeneratedStockPrompt {
  id: string;
  number: number;
  subject: string;
  instructions: string;
  prompt: string;
  category: string;
  subcategory?: string;
  contentType: string;
  commercialUse: string;
  aspectRatio?: string;
  negativeSpace?: string;
  copySpace?: string;
  ipRisk: 'LOW RISK' | 'REVIEW' | 'HIGH RISK';
  similarityStatus: 'DISTINCT' | 'OPTIMAL' | 'REFINED';
  sanitizedNotice?: string;
  technicalNotes?: string;
  createdAt: number;
}

export interface BatchGenerationResult {
  prompts: GeneratedStockPrompt[];
  requestedCount: number;
  generatedCount: number;
  diversityScore: number;
  subject: string;
  instructions: string;
  section: string;
  sanitizedCount: number;
  timestamp: number;
}

export interface GenerationProgress {
  current: number;
  total: number;
  step: 'Analyze' | 'Generate' | 'Check' | 'Refine';
  message: string;
}

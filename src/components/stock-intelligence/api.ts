// ── Stock Intelligence AI services ─────────────────────────────────────────────
// All calls go through the central AI engine (src/lib/ai) and are validated
// against Zod schemas — no direct provider calls, no fragile JSON.parse.

import { generateStructured } from "@/lib/ai/engine";
import {
  opportunitySchema,
  commercialAnalysisSchema,
  searchSimulationSchema,
  workflowSchema,
  type OpportunityAnalysis,
  type CommercialAnalysis,
  type SearchSimulation,
  type WorkflowAnalysis,
} from "@/lib/ai/schemas/analysis";
import { keywordSetSchema, type KeywordSet } from "@/lib/ai/schemas/keywords";
import { metadataAnalysisSchema, type MetadataAnalysis } from "@/lib/ai/schemas/metadata";
import { complianceSchema, type ComplianceResult } from "@/lib/ai/schemas/compliance";
import { productionPackSchema, type ProductionPackResult } from "@/lib/ai/schemas/production";

export async function analyzeTopic(topic: string, count = 20): Promise<OpportunityAnalysis> {
  const system = `You are a professional stock-content intelligence assistant. Analyze the given topic and return a structured JSON response containing valuable stock photography/illustration opportunities. All estimates (saturation, demand) are AI estimates — keep them labelled as estimates, never as measured marketplace data.`;
  const user = `Topic: "${topic}"

Generate ${count} specific microstock content opportunities for this topic.

Respond ONLY with a valid JSON object matching this schema:
{
  "niche": "String summarizing the broad niche",
  "subNiches": ["Array of 3-5 sub-niches"],
  "relatedSearchTerms": ["Array of 5-10 related stock search keywords"],
  "saturationEstimate": "Low, Medium, or High (AI estimate)",
  "seasonalRelevance": "Any seasonal notes or 'Evergreen'",
  "opportunities": [
    {
      "title": "Short descriptive title of the shot/concept",
      "concept": "Detailed description of the visual concept",
      "contentType": "Photo, Vector, Illustration, or Background",
      "buyerUseCase": "Who would buy this and what for",
      "composition": "Recommended composition (e.g., 'Wide shot, subject on left')",
      "copySpace": "Where to leave copy space (e.g., 'Right third')",
      "promptReadyConcept": "A clean descriptive string ready to be used as an AI prompt base",
      "metadataReadyConcept": "A short, clear title suitable for the final asset metadata"
    }
  ]
}`;
  return generateStructured(system, user, opportunitySchema, { maxTokens: 4000 });
}

export async function generateKeywords(topic: string, contentType: string): Promise<KeywordSet> {
  const system = `You are an expert microstock contributor specializing in keyword optimization. Use realistic stock terminology and avoid irrelevant keyword stuffing.`;
  const user = `Generate a comprehensive keyword list for a microstock asset.
Topic/Description: "${topic}"
Content Type: "${contentType}"

Return ONLY valid JSON matching this schema:
{
  "primary": ["Top 10 most relevant keywords"],
  "secondary": ["10-15 descriptive, supporting keywords"],
  "longTail": ["5-10 specific multi-word phrases"],
  "concepts": ["5 abstract conceptual keywords (e.g., 'success', 'freedom')"]
}`;
  return generateStructured(system, user, keywordSetSchema, { maxTokens: 1500 });
}

export async function analyzeImageMetadata(imageDataUrl: string): Promise<MetadataAnalysis> {
  const system = `You are a professional microstock keyworder and metadata specialist. Analyze the image and provide optimal metadata for stock marketplaces. Titles must be descriptive and searchable; keywords must be relevant — no stuffing, no brand names.`;
  const user = `Analyze this image and return ONLY valid JSON matching this schema:
{
  "title": "A strong, descriptive, and searchable title (7-15 words)",
  "keywords": ["Array of exactly 30 highly relevant keywords, ordered by importance"],
  "category": "Suggested stock category (e.g., 'Business', 'Nature', 'Lifestyle')",
  "contentType": "Photo, Vector, or Illustration",
  "aiGuidance": "Brief note if it looks AI generated and needs the 'Generative AI' tag",
  "observations": "Brief notes on potential property/people/text that might need releases or removal"
}`;
  return generateStructured(system, user, metadataAnalysisSchema, {
    imageDataUrl,
    maxTokens: 1500,
  });
}

export async function generateWorkflowData(imageDataUrl: string): Promise<WorkflowAnalysis> {
  const system = `You are an expert AI image generation engineer and microstock metadata specialist.`;
  const user = `Analyze this image and return ONLY valid JSON matching this schema:
{
  "prompt": "A detailed, high-quality reconstruction prompt that would generate a similar image. Include style, lighting, composition, and subject details.",
  "metadata": {
    "title": "Descriptive stock title",
    "keywords": ["Array of 25-30 keywords"],
    "category": "Stock category"
  },
  "qualityAnalysis": {
    "composition": "Analysis of the composition",
    "copySpace": "Analysis of copy space availability",
    "commercialUsefulness": "Why a buyer would want this",
    "potentialProblems": "Any AI artifacts, text, or trademark issues detected"
  }
}`;
  return generateStructured(system, user, workflowSchema, { imageDataUrl, maxTokens: 2500 });
}

export async function checkCompliance(imageDataUrl: string): Promise<ComplianceResult> {
  const system = `You are a stock marketplace compliance inspector performing an AI-assisted pre-check. Flag potential rejection risks. This is a pre-check only — not legal advice and not a guarantee of acceptance or rejection.`;
  const user = `Examine this image for stock photography compliance. Look for:
1. Visible logos, trademarks, or branded products
2. Recognizable people (need model releases)
3. Identifiable private property/buildings (need property releases)
4. Suspicious or garbled text (common in AI images)
5. Visual defects or obvious AI generation artifacts (extra fingers, melting geometry, weird physics)
6. Overall composition issues.

Return ONLY valid JSON matching this schema:
{
  "score": "Pass, Review, or Potential Risk",
  "warnings": ["Array of specific observations/warnings. If none, leave empty."],
  "aiArtifacts": "Notes specifically about potential AI artifacts detected",
  "overallNote": "A short summary of the readiness of this image."
}`;
  return generateStructured(system, user, complianceSchema, { imageDataUrl, maxTokens: 1500 });
}

export async function analyzeCommercialValue(input: string): Promise<CommercialAnalysis> {
  const system = `You are a microstock market analyst. All scores are AI estimates of commercial suitability — never present them as measured marketplace data.`;
  const user = `Evaluate the commercial suitability of this image concept/description for stock marketplaces.
Concept: "${input}"

Return ONLY valid JSON matching this schema:
{
  "overallScore": "A number from 1 to 100 representing the Commercial Suitability Estimate (AI estimate)",
  "clarity": "Score 1-10 and brief reason",
  "versatility": "Score 1-10 and brief reason",
  "copySpace": "Score 1-10 and brief reason",
  "seasonalValue": "Notes on seasonal timing",
  "commercialApplicability": "Which industries/buyers would use this",
  "nicheUsefulness": "How useful is it within its specific niche"
}`;
  return generateStructured(system, user, commercialAnalysisSchema, { maxTokens: 1500 });
}

export async function simulateSearch(
  topic: string,
  title: string,
  keywords: string,
): Promise<SearchSimulation> {
  const system = `You are a stock search relevance analyst. Estimate how well provided metadata matches a target search intent. Results are AI estimates, not real marketplace ranking data.`;
  const user = `Target Topic/Search Intent: "${topic}"
Provided Title: "${title}"
Provided Keywords: "${keywords}"

Return ONLY valid JSON matching this schema:
{
  "strongMatches": ["List of terms that perfectly hit the search intent"],
  "missingConcepts": ["List of important related concepts missing from the title/keywords"],
  "weakTerms": ["List of provided keywords that are irrelevant or too generic"],
  "suggestedImprovements": "A paragraph explaining how to improve the metadata for this search intent"
}`;
  return generateStructured(system, user, searchSimulationSchema, { maxTokens: 1500 });
}

export async function generateProductionPack(
  topic: string,
  count: number,
): Promise<ProductionPackResult> {
  const system = `You are a professional AI stock asset producer. Avoid copyrighted references and trademarked subjects in all prompts and metadata.`;
  const user = `Topic: "${topic}"
Generate ${count} complete production packs for AI image generation and microstock submission.

Return ONLY valid JSON matching this schema:
{
  "packs": [
    {
      "concept": "Short description of the idea",
      "aiPrompt": "Highly detailed AI image generation prompt",
      "negativePrompt": "Recommended negative prompt",
      "composition": "Recommended framing/composition",
      "aspectRatio": "Recommended aspect ratio (e.g., 16:9, 1:1)",
      "copySpace": "Where to leave space for text",
      "title": "Final stock title",
      "keywords": ["Array of 30 keywords"],
      "category": "Stock category",
      "complianceNotes": "Things to watch out for during generation (e.g., 'ensure hands are correct')"
    }
  ]
}`;
  return generateStructured(system, user, productionPackSchema, {
    maxTokens: count > 5 ? 4000 : 2500,
  });
}

import { z } from "zod";

const strArray = z
  .union([z.array(z.union([z.string(), z.number()])), z.string()])
  .catch([] as (string | number)[])
  .transform((v) => {
    const arr = Array.isArray(v) ? v.map(String) : String(v).split(/[,;\n]/);
    return arr.map((s) => s.trim()).filter(Boolean);
  });

const looseString = (def = "") =>
  z
    .union([z.string(), z.number()])
    .catch(def)
    .transform((v) => String(v));

// Opportunity Finder ("analyzeTopic")
export const opportunitySchema = z.object({
  niche: looseString(""),
  subNiches: strArray,
  relatedSearchTerms: strArray,
  saturationEstimate: looseString("Unknown"),
  seasonalRelevance: looseString("Evergreen"),
  opportunities: z
    .array(
      z.object({
        title: looseString(""),
        concept: looseString(""),
        contentType: looseString("Photo"),
        buyerUseCase: looseString(""),
        composition: looseString(""),
        copySpace: looseString(""),
        promptReadyConcept: looseString(""),
        metadataReadyConcept: looseString(""),
      }),
    )
    .catch([]),
});
export type OpportunityAnalysis = z.infer<typeof opportunitySchema>;

// Commercial Value Analyzer
export const commercialAnalysisSchema = z.object({
  overallScore: z
    .union([z.number(), z.string()])
    .transform((v) => {
      const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.]/g, ""));
      return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
    })
    .catch(0),
  clarity: looseString(""),
  versatility: looseString(""),
  copySpace: looseString(""),
  seasonalValue: looseString(""),
  commercialApplicability: looseString(""),
  nicheUsefulness: looseString(""),
});
export type CommercialAnalysis = z.infer<typeof commercialAnalysisSchema>;

// Search Simulator
export const searchSimulationSchema = z.object({
  strongMatches: strArray,
  missingConcepts: strArray,
  weakTerms: strArray,
  suggestedImprovements: looseString(""),
});
export type SearchSimulation = z.infer<typeof searchSimulationSchema>;

// Image → Prompt + Metadata Workflow
export const workflowSchema = z.object({
  prompt: looseString(""),
  metadata: z
    .object({
      title: looseString(""),
      keywords: strArray,
      category: looseString("General"),
    })
    .catch({ title: "", keywords: [], category: "General" }),
  qualityAnalysis: z
    .object({
      composition: looseString(""),
      copySpace: looseString(""),
      commercialUsefulness: looseString(""),
      potentialProblems: looseString(""),
    })
    .catch({ composition: "", copySpace: "", commercialUsefulness: "", potentialProblems: "" }),
});
export type WorkflowAnalysis = z.infer<typeof workflowSchema>;

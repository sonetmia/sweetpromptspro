import { z } from "zod";

/** Coerce single string or array into trimmed string array. */
const keywordArray = z
  .union([z.array(z.union([z.string(), z.number()])), z.string()])
  .catch([] as (string | number)[])
  .transform((v) => {
    const arr = Array.isArray(v) ? v.map(String) : String(v).split(/[,;\n]/);
    return arr.map((s) => s.trim()).filter(Boolean);
  });

export const imageMetadataSchema = z.object({
  title: z.string().min(1).catch("Untitled asset"),
  description: z.string().catch(""),
  category: z.string().catch("Graphic Resources"),
  keywords: keywordArray,
});
export type ImageMetadata = z.infer<typeof imageMetadataSchema>;

export const metadataAnalysisSchema = z.object({
  title: z.string().min(1),
  keywords: keywordArray,
  category: z.string().catch("General"),
  contentType: z.string().catch("Photo"),
  aiGuidance: z.string().catch(""),
  observations: z.string().catch(""),
});
export type MetadataAnalysis = z.infer<typeof metadataAnalysisSchema>;

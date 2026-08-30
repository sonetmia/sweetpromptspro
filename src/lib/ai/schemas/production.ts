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

export const productionPackSchema = z.object({
  packs: z
    .array(
      z.object({
        concept: looseString(""),
        aiPrompt: looseString(""),
        negativePrompt: looseString(""),
        composition: looseString(""),
        aspectRatio: looseString("16:9"),
        copySpace: looseString(""),
        title: looseString(""),
        keywords: strArray,
        category: looseString("General"),
        complianceNotes: looseString(""),
      }),
    )
    .min(1),
});
export type ProductionPackResult = z.infer<typeof productionPackSchema>;

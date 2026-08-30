import { z } from "zod";

const strArray = z
  .union([z.array(z.union([z.string(), z.number()])), z.string()])
  .catch([] as (string | number)[])
  .transform((v) => {
    const arr = Array.isArray(v) ? v.map(String) : String(v).split(/[;\n]/);
    return arr.map((s) => s.trim()).filter(Boolean);
  });

const looseString = (def = "") =>
  z
    .union([z.string(), z.number()])
    .catch(def)
    .transform((v) => String(v));

export const complianceSchema = z.object({
  score: looseString("Review"),
  warnings: strArray,
  aiArtifacts: looseString(""),
  overallNote: looseString(""),
});
export type ComplianceResult = z.infer<typeof complianceSchema>;

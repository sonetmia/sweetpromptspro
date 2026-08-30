import { z } from "zod";

const strArray = z
  .union([z.array(z.union([z.string(), z.number()])), z.string()])
  .catch([] as (string | number)[])
  .transform((v) => {
    const arr = Array.isArray(v) ? v.map(String) : String(v).split(/[,;\n]/);
    return arr.map((s) => s.trim()).filter(Boolean);
  });

export const keywordSetSchema = z.object({
  primary: strArray,
  secondary: strArray,
  longTail: strArray,
  concepts: strArray,
});
export type KeywordSet = z.infer<typeof keywordSetSchema>;

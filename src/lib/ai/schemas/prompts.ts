import { z } from "zod";

/** A plain list of generated prompt strings (bulk tools use numbered text, not JSON). */
export const promptListSchema = z
  .union([
    z.array(z.string()),
    z.object({ prompts: z.array(z.string()) }).transform((v) => v.prompts),
  ])
  .transform((arr) => arr.map((s) => s.trim()).filter(Boolean));
export type PromptList = z.infer<typeof promptListSchema>;

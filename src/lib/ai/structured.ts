// ── Robust structured output pipeline ─────────────────────────────────────────
// AI Response → normalize → parse → Zod validate → (repair retry) → data

import { AIError } from "./errors";

/** Minimal structural schema type — lets Zod transform/catch schemas infer T. */
export type SchemaLike<T> = {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: unknown };
};

/**
 * Strip markdown fences, leading prose and trailing junk, then extract the
 * first JSON object/array in the text.
 */
export function normalizeJsonText(raw: string): string {
  let t = (raw ?? "").trim();
  // Remove markdown code fences
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  t = t.trim();
  // If the text already starts with { or [, keep as-is; otherwise find first JSON block
  if (!t.startsWith("{") && !t.startsWith("[")) {
    const objStart = t.indexOf("{");
    const arrStart = t.indexOf("[");
    const start =
      objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
    if (start >= 0) t = t.slice(start);
  }
  // Trim trailing non-JSON (best effort: cut after last closing brace/bracket)
  const lastObj = t.lastIndexOf("}");
  const lastArr = t.lastIndexOf("]");
  const end = Math.max(lastObj, lastArr);
  if (end >= 0) t = t.slice(0, end + 1);
  return t.trim();
}

/** Fix trailing commas — the most common small formatting slip from LLMs. */
function repairCommonJsonIssues(text: string): string {
  return text
    .replace(/,\s*([}\]])/g, "$1") // trailing commas
    .replace(/[\u201C\u201D]/g, '"') // smart quotes
    .replace(/[\u2018\u2019]/g, "'");
}

export function tryParseJson(raw: string): unknown | undefined {
  const normalized = normalizeJsonText(raw);
  try {
    return JSON.parse(normalized);
  } catch {
    /* try repair */
  }
  try {
    return JSON.parse(repairCommonJsonIssues(normalized));
  } catch {
    return undefined;
  }
}

/**
 * Parse and validate an AI text response against a Zod schema.
 * Throws AIError("invalid_output") when the response cannot be recovered.
 */
export function parseStructured<T>(raw: string, schema: SchemaLike<T>): T {
  const parsed = tryParseJson(raw);
  if (parsed === undefined) {
    throw new AIError(
      "invalid_output",
      "The AI returned an unexpected response format. Please try again.",
    );
  }
  const result = schema.safeParse(parsed);
  if (result.success) return result.data;

  // Loose repair pass: some models wrap the payload, e.g. { "result": {...} }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const values = Object.values(parsed as Record<string, unknown>);
    if (values.length === 1) {
      const inner = schema.safeParse(values[0]);
      if (inner.success) return inner.data;
    }
  }
  throw new AIError(
    "invalid_output",
    "The AI response did not match the expected structure. Please try again.",
  );
}

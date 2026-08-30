// ── Bulk generation with batching, progress, partial results & cancellation ────

import { generateText } from "./engine";
import { aiErrorMessage } from "./errors";
import { LIMITS } from "./validation";

export const COUNT_OPTIONS = [5, 10, 20, 30, 50, 100, 200] as const;

const BATCH_SIZE = 20;
const MAX_BATCH_RETRIES = 1;

export type BulkProgress = {
  done: number;
  total: number;
  percent: number;
};

export type BulkResult = {
  items: string[];
  /** Errors from failed batches (completed batches are preserved). */
  errors: string[];
  cancelled: boolean;
};

export function parseNumbered(text: string): string[] {
  const lines = text.split("\n").filter((l) => /^\d+[.)]/.test(l.trim()));
  return lines.length
    ? lines.map((l) => l.replace(/^\d+[.)]\s*/, "").trim()).filter(Boolean)
    : text.trim()
      ? [text.trim()]
      : [];
}

/**
 * Generate `totalCount` numbered items in batches through the central engine.
 * - progress callback fires after every batch
 * - failed batches are retried once, then recorded; completed work is kept
 * - AbortSignal cancels between batches
 */
export async function generateBulk(
  systemTemplate: string,
  user: string,
  totalCount: number,
  onProgress?: (p: BulkProgress) => void,
  signal?: AbortSignal,
): Promise<BulkResult> {
  const total = Math.min(Math.max(1, Math.floor(totalCount)), LIMITS.maxBatchCount);
  const all: string[] = [];
  const errors: string[] = [];
  let cancelled = false;

  const batches = Math.ceil(total / BATCH_SIZE);
  for (let i = 0; i < batches; i++) {
    if (signal?.aborted) {
      cancelled = true;
      break;
    }
    const need = Math.min(BATCH_SIZE, total - all.length);
    if (need <= 0) break;
    const system = systemTemplate.replace(/\{\{COUNT\}\}/g, String(need));
    const maxTokens = Math.min(4000, Math.max(600, need * 140));

    let batchOk = false;
    for (let attempt = 0; attempt <= MAX_BATCH_RETRIES && !batchOk; attempt++) {
      try {
        const text = await generateText(system, user, { maxTokens, signal });
        const parsed = parseNumbered(text);
        if (!parsed.length) throw new Error("Empty batch response");
        all.push(...parsed.slice(0, need));
        batchOk = true;
      } catch (e) {
        if (signal?.aborted) {
          cancelled = true;
          break;
        }
        if (attempt === MAX_BATCH_RETRIES) {
          errors.push(`Batch ${i + 1}/${batches} failed: ${aiErrorMessage(e)}`);
        }
      }
    }
    if (cancelled) break;

    onProgress?.({
      done: Math.min(all.length, total),
      total,
      percent: Math.round((Math.min(all.length, (i + 1) * BATCH_SIZE) / total) * 100),
    });
    if (all.length >= total) break;
  }

  return { items: all.slice(0, total), errors, cancelled };
}

// ── Central AI Engine ──────────────────────────────────────────────────────────
// Every AI feature in the app goes through this module.
//
//   Application Feature → Central AI Engine → Selected Provider Adapter → API
//
// The engine always uses the provider selected in Settings. There is NO silent
// fallback: if the selected provider fails, the error is surfaced with the
// provider's name so the user can act.

import { loadAIConfig } from "./config";
import { getAdapter } from "./providers";
import type { ProviderAdapter, ProviderId } from "./types";
import { AIError, notConfiguredError, visionUnsupportedError, isAIError } from "./errors";
import { checkVision, resolveVisionModel } from "./capabilities";
import { parseStructured, type SchemaLike } from "./structured";
import { LIMITS } from "./validation";

export type ActiveProvider = {
  adapter: ProviderAdapter;
  apiKey: string;
  model: string;
};

/** Resolve the active provider from Settings, or throw a clear error. */
export function getActiveProvider(): ActiveProvider {
  const cfg = loadAIConfig();
  if (!cfg.provider) throw notConfiguredError();
  const state = cfg.providers[cfg.provider];
  if (!state?.apiKey || !state.validated) throw notConfiguredError();
  const adapter = getAdapter(cfg.provider as ProviderId);
  return { adapter, apiKey: state.apiKey, model: state.model || adapter.defaultModel };
}

/** Non-throwing peek at the active provider for status indicators. */
export function peekActiveProvider(): ActiveProvider | null {
  try {
    return getActiveProvider();
  } catch {
    return null;
  }
}

// Simple client-side throttle so rapid duplicate clicks can't hammer providers.
let lastRequestAt = 0;
async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = lastRequestAt + LIMITS.minRequestGapMs - now;
  lastRequestAt = Math.max(now, lastRequestAt + LIMITS.minRequestGapMs);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

export type GenerateOptions = {
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  signal?: AbortSignal;
};

/** Text generation via the selected provider. */
export async function generateText(
  system: string,
  user: string,
  opts: GenerateOptions = {},
): Promise<string> {
  const { adapter, apiKey, model } = getActiveProvider();
  await throttle();
  return adapter.chat(
    {
      system,
      user,
      maxTokens: opts.maxTokens,
      temperature: opts.temperature,
      jsonMode: opts.jsonMode,
      signal: opts.signal,
    },
    { apiKey, model },
  );
}

/** Vision (image) analysis via the selected provider — no provider switching. */
export async function analyzeImage(
  system: string,
  user: string,
  imageDataUrl: string,
  opts: GenerateOptions = {},
): Promise<string> {
  const { adapter, apiKey, model } = getActiveProvider();
  const check = checkVision(adapter, model);
  if (!check.ok) throw visionUnsupportedError(adapter.name);
  const visionModel = resolveVisionModel(adapter, model);
  await throttle();
  return adapter.chat(
    {
      system,
      user,
      imageDataUrl,
      maxTokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.5,
      jsonMode: opts.jsonMode,
      signal: opts.signal,
    },
    { apiKey, model: visionModel },
  );
}

/**
 * Structured generation with Zod validation and one controlled repair retry.
 * The retry re-asks the SAME selected provider with a stricter instruction —
 * never another provider.
 */
export async function generateStructured<T>(
  system: string,
  user: string,
  schema: SchemaLike<T>,
  opts: GenerateOptions & { imageDataUrl?: string } = {},
): Promise<T> {
  const call = (extraSystem = "") =>
    opts.imageDataUrl
      ? analyzeImage(system + extraSystem, user, opts.imageDataUrl, { ...opts, jsonMode: true })
      : generateText(system + extraSystem, user, { ...opts, jsonMode: true });

  const first = await call();
  try {
    return parseStructured(first, schema);
  } catch (e) {
    if (!(isAIError(e) && e.kind === "invalid_output")) throw e;
  }
  // One structured-output repair retry.
  const second = await call(
    "\n\nIMPORTANT: Respond with ONLY a single valid JSON value matching the requested schema. No markdown fences, no commentary, no trailing commas.",
  );
  return parseStructured(second, schema);
}

/** True when the current provider/model supports image analysis. */
export function visionAvailable(): { ok: boolean; reason?: string } {
  try {
    const { adapter, model } = getActiveProvider();
    const check = checkVision(adapter, model);
    return check.ok ? { ok: true } : { ok: false, reason: check.reason };
  } catch (e) {
    return { ok: false, reason: e instanceof AIError ? e.message : "No provider connected." };
  }
}

export { isAIError, AIError };

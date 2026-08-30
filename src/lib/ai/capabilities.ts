// ── Central AI engine — capability checks ─────────────────────────────────────

import type { ProviderAdapter } from "./types";

export type CapabilityCheck = { ok: true } | { ok: false; reason: string };

/** Can the given adapter + selected model handle a vision request? */
export function checkVision(adapter: ProviderAdapter, model: string): CapabilityCheck {
  if (!adapter.capabilities.vision) {
    return {
      ok: false,
      reason: `${adapter.name} does not offer image analysis. Choose a vision-capable provider (e.g. Gemini or Mistral) in Settings.`,
    };
  }
  const m = model || adapter.defaultModel;
  if (!adapter.modelSupportsVision(m) && !adapter.defaultVisionModel) {
    return {
      ok: false,
      reason: `The selected ${adapter.name} model does not support image analysis. Select a vision-capable model in Settings.`,
    };
  }
  return { ok: true };
}

/** Resolve which model to use for a vision request without switching providers. */
export function resolveVisionModel(adapter: ProviderAdapter, model: string): string {
  const m = model || adapter.defaultModel;
  if (adapter.modelSupportsVision(m)) return m;
  return adapter.defaultVisionModel || m;
}

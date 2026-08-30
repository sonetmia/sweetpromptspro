// ── Provider registry ──────────────────────────────────────────────────────────

import type { ProviderAdapter, ProviderId } from "../types";
import { gemini } from "./gemini";
import { mistral } from "./mistral";
import { groq } from "./groq";
import { openrouter } from "./openrouter";
import { cerebras } from "./cerebras";
import { together } from "./together";
import { huggingface } from "./huggingface";
import { cohere } from "./cohere";

export const PROVIDERS: ProviderAdapter[] = [
  gemini,
  mistral,
  groq,
  openrouter,
  cerebras,
  together,
  huggingface,
  cohere,
];

export const PROVIDER_BY_ID: Record<ProviderId, ProviderAdapter> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p]),
) as Record<ProviderId, ProviderAdapter>;

export function getAdapter(id: ProviderId): ProviderAdapter {
  return PROVIDER_BY_ID[id];
}

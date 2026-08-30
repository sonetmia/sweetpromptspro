// ── OpenRouter adapter ─────────────────────────────────────────────────────────
// Freemium gateway — many ":free" models (rate-limited), including vision-capable
// ones. Text + vision + JSON mode (model-dependent). CORS: allowed.

import { LIMITS } from "../validation";
import type { ProviderAdapter } from "../types";
import { makeBearerModelLister, makeBearerValidator, makeCompatChat } from "./openaiCompat";

const NAME = "OpenRouter";
// Common vision-capable model families routed through OpenRouter.
const VISION_MODELS =
  /gemini|gpt-4o|gpt-4\.1|claude|pixtral|llama-4|llama-3\.2-\d+b-vision|qwen.*vl|internvl|gemma-3/i;

export const openrouter: ProviderAdapter = {
  id: "openrouter",
  name: "OpenRouter",
  icon: "🛰",
  accessLabel: "Freemium (:free models)",
  description: "One key for many labs. Free-tier models are rate-limited by OpenRouter.",
  docsUrl: "https://openrouter.ai/keys",
  keyPlaceholder: "sk-or-v1-...",
  keyPattern: /^sk-or-/,
  capabilities: {
    text: true,
    vision: true,
    structuredOutput: true,
    maxOutputTokens: 8000,
    maxInputChars: LIMITS.maxUserChars,
    maxImageBytes: LIMITS.maxImageBytes,
  },
  models: [
    {
      id: "google/gemini-2.0-flash-exp:free",
      label: "Gemini 2.0 Flash (free, vision)",
      vision: true,
      note: "recommended",
    },
    {
      id: "meta-llama/llama-4-scout:free",
      label: "Llama 4 Scout (free, vision)",
      vision: true,
    },
    {
      id: "meta-llama/llama-3.3-70b-instruct:free",
      label: "Llama 3.3 70B (free)",
      vision: false,
    },
    {
      id: "mistralai/mistral-small-3.2-24b-instruct:free",
      label: "Mistral Small 3.2 (free, vision)",
      vision: true,
    },
  ],
  defaultModel: "google/gemini-2.0-flash-exp:free",
  defaultVisionModel: "google/gemini-2.0-flash-exp:free",
  modelSupportsVision: (model) => VISION_MODELS.test(model || ""),
  chat: makeCompatChat({
    providerName: NAME,
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "google/gemini-2.0-flash-exp:free",
    maxOutputTokens: 8000,
    supportsJsonMode: true,
    extraHeaders: { "X-Title": "Sweet AI Metadata Lab" },
  }),
  validateKey: makeBearerValidator(NAME, "https://openrouter.ai/api/v1/key"),
  listModels: makeBearerModelLister(NAME, "https://openrouter.ai/api/v1/models", (j) =>
    ((j as { data?: { id?: string }[] })?.data ?? []).map((m) => m.id || ""),
  ),
};

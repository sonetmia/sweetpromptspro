// ── Groq adapter ───────────────────────────────────────────────────────────────
// Free tier available at console.groq.com. Text + vision (Llama 4 Scout/Maverick)
// + JSON mode. CORS: allowed.

import { LIMITS } from "../validation";
import type { ProviderAdapter } from "../types";
import { makeBearerModelLister, makeBearerValidator, makeCompatChat } from "./openaiCompat";

const NAME = "Groq";
const VISION_MODELS = /llama-4|llama-3\.2-\d+b-vision/i;

export const groq: ProviderAdapter = {
  id: "groq",
  name: "Groq",
  icon: "⚡",
  accessLabel: "Free tier (rate-limited)",
  description: "Ultra-fast LPU inference for Llama models. Llama 4 models support vision.",
  docsUrl: "https://console.groq.com/keys",
  keyPlaceholder: "gsk_...",
  keyPattern: /^gsk_/,
  capabilities: {
    text: true,
    vision: true,
    structuredOutput: true,
    maxOutputTokens: 8000,
    maxInputChars: LIMITS.maxUserChars,
    maxImageBytes: 4 * 1024 * 1024,
  },
  models: [
    {
      id: "llama-3.3-70b-versatile",
      label: "Llama 3.3 70B Versatile",
      vision: false,
      note: "recommended",
    },
    {
      id: "meta-llama/llama-4-scout-17b-16e-instruct",
      label: "Llama 4 Scout (vision)",
      vision: true,
    },
    {
      id: "meta-llama/llama-4-maverick-17b-128e-instruct",
      label: "Llama 4 Maverick (vision)",
      vision: true,
    },
    { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", vision: false, note: "fastest" },
  ],
  defaultModel: "llama-3.3-70b-versatile",
  defaultVisionModel: "meta-llama/llama-4-scout-17b-16e-instruct",
  modelSupportsVision: (model) => VISION_MODELS.test(model || ""),
  chat: makeCompatChat({
    providerName: NAME,
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    maxOutputTokens: 8000,
    supportsJsonMode: true,
  }),
  validateKey: makeBearerValidator(NAME, "https://api.groq.com/openai/v1/models"),
  listModels: makeBearerModelLister(NAME, "https://api.groq.com/openai/v1/models", (j) =>
    ((j as { data?: { id?: string }[] })?.data ?? []).map((m) => m.id || ""),
  ),
};

// ── Together AI adapter ────────────────────────────────────────────────────────
// Freemium: trial credits + some free-endpoint models. Text + vision (Llama
// Vision) + JSON mode. CORS: allowed.

import { LIMITS } from "../validation";
import type { ProviderAdapter } from "../types";
import { makeBearerModelLister, makeBearerValidator, makeCompatChat } from "./openaiCompat";

const NAME = "Together AI";
const VISION_MODELS = /vision|llama-4|qwen.*vl/i;

export const together: ProviderAdapter = {
  id: "together",
  name: "Together AI",
  icon: "🤝",
  accessLabel: "Freemium (trial credits)",
  description: "Hundreds of open models. Free endpoints for select Llama models.",
  docsUrl: "https://api.together.xyz/settings/api-keys",
  keyPlaceholder: "Together API key",
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
      id: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      label: "Llama 3.3 70B (free endpoint)",
      vision: false,
      note: "recommended",
    },
    {
      id: "meta-llama/Llama-Vision-Free",
      label: "Llama 3.2 11B Vision (free endpoint)",
      vision: true,
    },
    {
      id: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
      label: "Llama 4 Scout (vision)",
      vision: true,
    },
  ],
  defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
  defaultVisionModel: "meta-llama/Llama-Vision-Free",
  modelSupportsVision: (model) => VISION_MODELS.test(model || ""),
  chat: makeCompatChat({
    providerName: NAME,
    endpoint: "https://api.together.xyz/v1/chat/completions",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    maxOutputTokens: 8000,
    supportsJsonMode: true,
  }),
  validateKey: makeBearerValidator(NAME, "https://api.together.xyz/v1/models"),
  listModels: makeBearerModelLister(NAME, "https://api.together.xyz/v1/models", (j) => {
    const arr = Array.isArray(j) ? j : ((j as { data?: unknown[] })?.data ?? []);
    return (arr as { id?: string }[]).map((m) => m.id || "");
  }),
};

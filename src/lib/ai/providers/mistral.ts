// ── Mistral AI adapter ─────────────────────────────────────────────────────────
// Free API tier ("Experiment" plan) available at console.mistral.ai.
// Text + vision (Pixtral / Mistral Small 3.x) + JSON mode. CORS: allowed.

import { LIMITS } from "../validation";
import type { ProviderAdapter } from "../types";
import { makeBearerModelLister, makeBearerValidator, makeCompatChat } from "./openaiCompat";

const NAME = "Mistral";
const VISION_MODELS = /pixtral|mistral-small-(2503|2506|latest)|mistral-medium/i;

export const mistral: ProviderAdapter = {
  id: "mistral",
  name: "Mistral AI",
  icon: "🌀",
  accessLabel: "Free API tier",
  description: "Mistral Small/Large plus Pixtral vision models with JSON output support.",
  docsUrl: "https://console.mistral.ai/api-keys",
  keyPlaceholder: "Mistral API key",
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
      id: "mistral-small-latest",
      label: "Mistral Small (vision)",
      vision: true,
      note: "recommended",
    },
    { id: "mistral-large-latest", label: "Mistral Large", vision: false },
    { id: "pixtral-12b-2409", label: "Pixtral 12B (vision)", vision: true },
    { id: "open-mistral-nemo", label: "Mistral Nemo", vision: false, note: "fast" },
  ],
  defaultModel: "mistral-small-latest",
  defaultVisionModel: "pixtral-12b-2409",
  modelSupportsVision: (model) => VISION_MODELS.test(model || ""),
  chat: makeCompatChat({
    providerName: NAME,
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "mistral-small-latest",
    maxOutputTokens: 8000,
    supportsJsonMode: true,
  }),
  validateKey: makeBearerValidator(NAME, "https://api.mistral.ai/v1/models"),
  listModels: makeBearerModelLister(NAME, "https://api.mistral.ai/v1/models", (j) =>
    ((j as { data?: { id?: string }[] })?.data ?? []).map((m) => m.id || ""),
  ),
};

// ── Cerebras adapter ───────────────────────────────────────────────────────────
// Free tier with daily quota at cloud.cerebras.ai. Text + JSON mode.
// No vision models — vision requests are rejected with a clear error.

import { LIMITS } from "../validation";
import type { ProviderAdapter } from "../types";
import { makeBearerModelLister, makeBearerValidator, makeCompatChat } from "./openaiCompat";

const NAME = "Cerebras";

export const cerebras: ProviderAdapter = {
  id: "cerebras",
  name: "Cerebras",
  icon: "🧠",
  accessLabel: "Free tier (daily quota)",
  description: "Extremely fast Llama/Qwen inference. Text only — no image analysis.",
  docsUrl: "https://cloud.cerebras.ai",
  keyPlaceholder: "csk-...",
  keyPattern: /^csk-/,
  capabilities: {
    text: true,
    vision: false,
    structuredOutput: true,
    maxOutputTokens: 8000,
    maxInputChars: LIMITS.maxUserChars,
    maxImageBytes: 0,
  },
  models: [
    { id: "llama-3.3-70b", label: "Llama 3.3 70B", vision: false, note: "recommended" },
    { id: "llama3.1-8b", label: "Llama 3.1 8B", vision: false, note: "fastest" },
    { id: "qwen-3-32b", label: "Qwen 3 32B", vision: false },
  ],
  defaultModel: "llama-3.3-70b",
  modelSupportsVision: () => false,
  chat: makeCompatChat({
    providerName: NAME,
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    defaultModel: "llama-3.3-70b",
    maxOutputTokens: 8000,
    supportsJsonMode: true,
  }),
  validateKey: makeBearerValidator(NAME, "https://api.cerebras.ai/v1/models"),
  listModels: makeBearerModelLister(NAME, "https://api.cerebras.ai/v1/models", (j) =>
    ((j as { data?: { id?: string }[] })?.data ?? []).map((m) => m.id || ""),
  ),
};

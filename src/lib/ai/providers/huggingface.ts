// ── Hugging Face adapter (Inference Providers router) ──────────────────────────
// Freemium: monthly free inference credits for registered accounts.
// OpenAI-compatible router at router.huggingface.co/v1. Text + vision
// (model-dependent). CORS: allowed.

import { LIMITS } from "../validation";
import type { ProviderAdapter } from "../types";
import { makeBearerValidator, makeCompatChat } from "./openaiCompat";

const NAME = "Hugging Face";
const VISION_MODELS = /vl|vision|llama-4|gemma-3|idefics|smolvlm/i;

export const huggingface: ProviderAdapter = {
  id: "huggingface",
  name: "Hugging Face",
  icon: "🤗",
  accessLabel: "Freemium (monthly credits)",
  description: "Open models via HF Inference Providers. Free credits are limited per month.",
  docsUrl: "https://huggingface.co/settings/tokens",
  keyPlaceholder: "hf_...",
  keyPattern: /^hf_/,
  capabilities: {
    text: true,
    vision: true,
    structuredOutput: true,
    maxOutputTokens: 4000,
    maxInputChars: LIMITS.maxUserChars,
    maxImageBytes: 4 * 1024 * 1024,
  },
  models: [
    {
      id: "meta-llama/Llama-3.3-70B-Instruct",
      label: "Llama 3.3 70B Instruct",
      vision: false,
      note: "recommended",
    },
    { id: "Qwen/Qwen2.5-VL-7B-Instruct", label: "Qwen 2.5 VL 7B (vision)", vision: true },
    { id: "Qwen/Qwen2.5-72B-Instruct", label: "Qwen 2.5 72B Instruct", vision: false },
    { id: "google/gemma-3-27b-it", label: "Gemma 3 27B (vision)", vision: true },
  ],
  defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
  defaultVisionModel: "Qwen/Qwen2.5-VL-7B-Instruct",
  modelSupportsVision: (model) => VISION_MODELS.test(model || ""),
  chat: makeCompatChat({
    providerName: NAME,
    endpoint: "https://router.huggingface.co/v1/chat/completions",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    maxOutputTokens: 4000,
    supportsJsonMode: false, // router JSON mode support varies by underlying provider
  }),
  validateKey: makeBearerValidator(NAME, "https://huggingface.co/api/whoami-v2"),
};

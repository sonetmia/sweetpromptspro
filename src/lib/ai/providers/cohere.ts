// ── Cohere adapter (v2 Chat API) ───────────────────────────────────────────────
// Freemium: free trial keys with monthly request limits. Text + vision
// (Command A Vision) + JSON mode. CORS: allowed on api.cohere.com.

import { fromUnknown, httpError } from "../errors";
import { LIMITS, clampMaxTokens, validateImageDataUrl, validateTextRequest } from "../validation";
import type { ChatRequest, ProviderAdapter, ProviderRuntimeConfig } from "../types";

const NAME = "Cohere";
const VISION_MODELS = /vision/i;

async function chat(req: ChatRequest, cfg: ProviderRuntimeConfig): Promise<string> {
  const model = cfg.model || cohere.defaultModel;
  const maxTokens = clampMaxTokens(req.maxTokens, cohere.capabilities.maxOutputTokens);
  validateTextRequest(req.system, req.user, maxTokens);

  let userContent: unknown = req.user;
  if (req.imageDataUrl) {
    validateImageDataUrl(req.imageDataUrl);
    userContent = [
      { type: "text", text: req.user },
      { type: "image_url", image_url: { url: req.imageDataUrl } },
    ];
  }

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    temperature: req.temperature ?? 0.7,
    messages: [
      { role: "system", content: req.system },
      { role: "user", content: userContent },
    ],
  };
  if (req.jsonMode) body.response_format = { type: "json_object" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.requestTimeoutMs);
  const onAbort = () => controller.abort();
  req.signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = "";
      try {
        const j = await res.json();
        detail = j?.message || "";
      } catch {
        /* ignore */
      }
      throw httpError(NAME, res.status, detail);
    }
    const j = await res.json();
    const content = j?.message?.content;
    if (Array.isArray(content)) {
      return content.map((c: { text?: string }) => c?.text ?? "").join("");
    }
    return typeof content === "string" ? content : "";
  } catch (e) {
    throw fromUnknown(NAME, e);
  } finally {
    clearTimeout(timer);
    req.signal?.removeEventListener("abort", onAbort);
  }
}

async function validateKey(key: string): Promise<void> {
  try {
    const res = await fetch("https://api.cohere.com/v1/models?page_size=1", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw httpError(NAME, res.status);
  } catch (e) {
    throw fromUnknown(NAME, e);
  }
}

async function listModels(key: string): Promise<string[]> {
  try {
    const res = await fetch("https://api.cohere.com/v1/models?page_size=100", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw httpError(NAME, res.status);
    const j = await res.json();
    return (j?.models ?? []).map((m: { name?: string }) => m.name || "").filter(Boolean);
  } catch (e) {
    throw fromUnknown(NAME, e);
  }
}

export const cohere: ProviderAdapter = {
  id: "cohere",
  name: "Cohere",
  icon: "🔗",
  accessLabel: "Free trial keys (monthly limits)",
  description: "Command models with JSON output. Command A Vision adds image analysis.",
  docsUrl: "https://dashboard.cohere.com/api-keys",
  keyPlaceholder: "Cohere API key",
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
      id: "command-r-plus-08-2024",
      label: "Command R+ (08-2024)",
      vision: false,
      note: "recommended",
    },
    { id: "command-a-03-2025", label: "Command A", vision: false },
    { id: "command-a-vision-07-2025", label: "Command A Vision", vision: true },
    { id: "command-r7b-12-2024", label: "Command R7B", vision: false, note: "fastest" },
  ],
  defaultModel: "command-r-plus-08-2024",
  defaultVisionModel: "command-a-vision-07-2025",
  modelSupportsVision: (model) => VISION_MODELS.test(model || ""),
  chat,
  validateKey,
  listModels,
};

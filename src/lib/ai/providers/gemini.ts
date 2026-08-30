// ── Google Gemini adapter (Google AI Studio API) ──────────────────────────────
// Free tier available via aistudio.google.com. Text + vision + JSON mode.
// Browser CORS: supported by generativelanguage.googleapis.com.

import { fromUnknown, httpError } from "../errors";
import { LIMITS, clampMaxTokens, validateImageDataUrl, validateTextRequest } from "../validation";
import type { ChatRequest, ProviderAdapter, ProviderRuntimeConfig } from "../types";

const NAME = "Gemini";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

async function chat(req: ChatRequest, cfg: ProviderRuntimeConfig): Promise<string> {
  const model = cfg.model || gemini.defaultModel;
  const maxTokens = clampMaxTokens(req.maxTokens, gemini.capabilities.maxOutputTokens);
  validateTextRequest(req.system, req.user, maxTokens);

  const parts: unknown[] = [{ text: req.user }];
  if (req.imageDataUrl) {
    const img = validateImageDataUrl(req.imageDataUrl);
    parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
  }

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: maxTokens,
    temperature: req.temperature ?? 0.7,
  };
  if (req.jsonMode) generationConfig.responseMimeType = "application/json";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.requestTimeoutMs);
  const onAbort = () => controller.abort();
  req.signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(
      `${BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.system }] },
          contents: [{ role: "user", parts }],
          generationConfig,
        }),
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      let detail = "";
      try {
        const j = await res.json();
        detail = j?.error?.message || "";
      } catch {
        /* ignore */
      }
      throw httpError(NAME, res.status, detail);
    }
    const j = await res.json();
    const text =
      j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
      "";
    return text;
  } catch (e) {
    throw fromUnknown(NAME, e);
  } finally {
    clearTimeout(timer);
    req.signal?.removeEventListener("abort", onAbort);
  }
}

async function validateKey(key: string): Promise<void> {
  try {
    const res = await fetch(`${BASE}/models?key=${encodeURIComponent(key)}&pageSize=1`);
    if (!res.ok) throw httpError(NAME, res.status);
  } catch (e) {
    throw fromUnknown(NAME, e);
  }
}

async function listModels(key: string): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/models?key=${encodeURIComponent(key)}&pageSize=100`);
    if (!res.ok) throw httpError(NAME, res.status);
    const j = await res.json();
    return (j?.models ?? [])
      .map((m: { name?: string }) => String(m.name || "").replace(/^models\//, ""))
      .filter((id: string) => id.includes("gemini"));
  } catch (e) {
    throw fromUnknown(NAME, e);
  }
}

export const gemini: ProviderAdapter = {
  id: "gemini",
  name: "Google Gemini",
  icon: "✨",
  accessLabel: "Free tier (AI Studio)",
  description: "Gemini Flash models — strong all-rounder with text, vision and native JSON output.",
  docsUrl: "https://aistudio.google.com/apikey",
  keyPlaceholder: "AIza...",
  keyPattern: /^AIza/,
  capabilities: {
    text: true,
    vision: true,
    structuredOutput: true,
    maxOutputTokens: 8000,
    maxInputChars: LIMITS.maxUserChars,
    maxImageBytes: LIMITS.maxImageBytes,
  },
  models: [
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", vision: true, note: "recommended" },
    { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", vision: true, note: "fastest" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", vision: true },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", vision: true, note: "highest quality" },
  ],
  defaultModel: "gemini-2.5-flash",
  defaultVisionModel: "gemini-2.5-flash",
  // All current Gemini generateContent models are multimodal.
  modelSupportsVision: (model) => /gemini/i.test(model || "gemini"),
  chat,
  validateKey,
  listModels,
};

// ── Shared OpenAI-compatible chat-completions transport ───────────────────────
// Used by Mistral, Groq, OpenRouter, Cerebras, Together and Hugging Face —
// they all expose the same /chat/completions contract.

import { fromUnknown, httpError } from "../errors";
import { LIMITS, validateImageDataUrl, validateTextRequest, clampMaxTokens } from "../validation";
import type { ChatRequest, ProviderRuntimeConfig } from "../types";

type CompatOpts = {
  providerName: string;
  endpoint: string;
  defaultModel: string;
  maxOutputTokens: number;
  /** Whether to send response_format json_object when jsonMode is requested. */
  supportsJsonMode: boolean;
  extraHeaders?: Record<string, string>;
};

export function makeCompatChat(opts: CompatOpts) {
  return async function chat(req: ChatRequest, cfg: ProviderRuntimeConfig): Promise<string> {
    const model = cfg.model || opts.defaultModel;
    const maxTokens = clampMaxTokens(req.maxTokens, opts.maxOutputTokens);
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
    if (req.jsonMode && opts.supportsJsonMode) {
      body.response_format = { type: "json_object" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LIMITS.requestTimeoutMs);
    const onAbort = () => controller.abort();
    req.signal?.addEventListener("abort", onAbort);

    try {
      const res = await fetch(opts.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
          ...opts.extraHeaders,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        let detail = "";
        try {
          const j = await res.json();
          detail = j?.error?.message || j?.message || "";
        } catch {
          /* ignore body */
        }
        throw httpError(opts.providerName, res.status, detail);
      }
      const j = await res.json();
      return j?.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      throw fromUnknown(opts.providerName, e);
    } finally {
      clearTimeout(timer);
      req.signal?.removeEventListener("abort", onAbort);
    }
  };
}

export function makeBearerValidator(providerName: string, url: string) {
  return async function validateKey(key: string): Promise<void> {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      if (!res.ok) throw httpError(providerName, res.status);
    } catch (e) {
      throw fromUnknown(providerName, e);
    }
  };
}

export function makeBearerModelLister(
  providerName: string,
  url: string,
  extract: (json: unknown) => string[],
) {
  return async function listModels(key: string): Promise<string[]> {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      if (!res.ok) throw httpError(providerName, res.status);
      return extract(await res.json()).filter(Boolean);
    } catch (e) {
      throw fromUnknown(providerName, e);
    }
  };
}

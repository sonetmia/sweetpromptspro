// ── Central AI engine — error taxonomy ────────────────────────────────────────
// All provider failures are normalized here so the UI can show consistent,
// human-readable messages. API keys are NEVER included in error messages.

export type AIErrorKind =
  | "not_configured"
  | "invalid_key"
  | "rate_limited"
  | "quota_exceeded"
  | "vision_unsupported"
  | "input_too_large"
  | "image_invalid"
  | "network"
  | "timeout"
  | "aborted"
  | "server"
  | "invalid_output"
  | "unknown";

export class AIError extends Error {
  kind: AIErrorKind;
  providerName?: string;
  status?: number;

  constructor(
    kind: AIErrorKind,
    message: string,
    opts?: { providerName?: string; status?: number },
  ) {
    super(message);
    this.name = "AIError";
    this.kind = kind;
    this.providerName = opts?.providerName;
    this.status = opts?.status;
  }
}

export function notConfiguredError(): AIError {
  return new AIError(
    "not_configured",
    "No AI provider connected. Open Settings → AI Provider, add an API key and validate it.",
  );
}

export function visionUnsupportedError(providerName: string): AIError {
  return new AIError(
    "vision_unsupported",
    `Image analysis is unavailable with the currently selected ${providerName} model. Please select a vision-capable provider/model in Settings.`,
    { providerName },
  );
}

/** Map an HTTP status from a provider into a consistent AIError. Never leaks response bodies with secrets. */
export function httpError(providerName: string, status: number, detail?: string): AIError {
  const safeDetail = sanitizeDetail(detail);
  if (status === 401 || status === 403) {
    return new AIError(
      "invalid_key",
      `${providerName} rejected the API key. Check the key in Settings and try again.`,
      { providerName, status },
    );
  }
  if (status === 429) {
    return new AIError(
      "rate_limited",
      `${providerName} rate limit reached. Please wait a moment and try again.`,
      { providerName, status },
    );
  }
  if (status === 402) {
    return new AIError(
      "quota_exceeded",
      `${providerName} quota or credits exhausted. Check your provider account.`,
      { providerName, status },
    );
  }
  if (status === 400 || status === 404 || status === 422) {
    return new AIError(
      "server",
      `${providerName} could not process the request (${status}).${safeDetail ? ` ${safeDetail}` : " Check the selected model in Settings."}`,
      { providerName, status },
    );
  }
  if (status >= 500) {
    return new AIError(
      "server",
      `${providerName} is having trouble right now (${status}). Please try again shortly.`,
      { providerName, status },
    );
  }
  return new AIError("unknown", `${providerName} request failed (${status}).`, {
    providerName,
    status,
  });
}

/** Wrap fetch/network layer failures. */
export function fromUnknown(providerName: string, e: unknown): AIError {
  if (e instanceof AIError) return e;
  if (e instanceof DOMException && e.name === "AbortError") {
    return new AIError("aborted", "Request cancelled.", { providerName });
  }
  const msg = e instanceof Error ? e.message : String(e);
  if (/timeout|timed out/i.test(msg)) {
    return new AIError("timeout", `${providerName} request timed out. Please try again.`, {
      providerName,
    });
  }
  if (/failed to fetch|network|load failed|cors/i.test(msg)) {
    return new AIError(
      "network",
      `Could not reach ${providerName}. Check your connection (or the provider may be blocking browser requests).`,
      { providerName },
    );
  }
  return new AIError("unknown", `${providerName} request failed: ${sanitizeDetail(msg)}`, {
    providerName,
  });
}

/** Strip anything that could resemble a credential and cap length. */
function sanitizeDetail(detail?: string): string {
  if (!detail) return "";
  return detail
    .replace(/(sk-or-v1-|gsk_|AIza|hf_|csk-|Bearer\s+)[A-Za-z0-9_.-]+/g, "$1[redacted]")
    .replace(/key=[^&\s"]+/gi, "key=[redacted]")
    .slice(0, 160);
}

export function isAIError(e: unknown): e is AIError {
  return e instanceof AIError;
}

/** Human-readable message for any thrown value. */
export function aiErrorMessage(e: unknown): string {
  if (e instanceof AIError) return e.message;
  if (e instanceof Error) return sanitizeDetail(e.message) || "Unexpected error.";
  return "Unexpected error.";
}

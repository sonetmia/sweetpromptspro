// ── Central AI engine — input validation & safety limits ──────────────────────
// Hard limits applied before any request leaves the app. These protect both
// the user (accidental huge payloads) and the providers (abuse).

import { AIError } from "./errors";

export const LIMITS = {
  maxSystemChars: 12_000,
  maxUserChars: 24_000,
  maxOutputTokens: 8_000,
  minOutputTokens: 1,
  maxImageBytes: 8 * 1024 * 1024, // 8 MB decoded
  maxImageDimension: 4096, // px after downscale
  supportedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  maxBatchCount: 200,
  requestTimeoutMs: 90_000,
  /** Minimum gap between consecutive AI requests (basic client throttle). */
  minRequestGapMs: 250,
} as const;

export function validateTextRequest(system: string, user: string, maxTokens: number): void {
  if (typeof system !== "string" || typeof user !== "string") {
    throw new AIError("input_too_large", "Malformed request.");
  }
  if (system.length > LIMITS.maxSystemChars) {
    throw new AIError(
      "input_too_large",
      `System instruction is too long (${system.length} chars, max ${LIMITS.maxSystemChars}).`,
    );
  }
  if (user.length > LIMITS.maxUserChars) {
    throw new AIError(
      "input_too_large",
      `Input is too long (${user.length} chars, max ${LIMITS.maxUserChars}). Shorten the text and try again.`,
    );
  }
  if (!Number.isFinite(maxTokens) || maxTokens < LIMITS.minOutputTokens) {
    throw new AIError("input_too_large", "Invalid output token limit.");
  }
}

export function clampMaxTokens(requested: number | undefined, providerMax: number): number {
  const v = requested ?? 2000;
  return Math.max(LIMITS.minOutputTokens, Math.min(v, providerMax, LIMITS.maxOutputTokens));
}

const DATA_URL_RE = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i;

export type ParsedImage = { mimeType: string; base64: string; bytes: number };

/** Parse and validate a data: URL image payload. Throws AIError on problems. */
export function validateImageDataUrl(dataUrl: string): ParsedImage {
  const m = DATA_URL_RE.exec(dataUrl || "");
  if (!m) {
    throw new AIError("image_invalid", "Invalid image data. Please re-upload the image.");
  }
  const mimeType = m[1].toLowerCase();
  const base64 = m[2];
  if (!(LIMITS.supportedImageTypes as readonly string[]).includes(mimeType)) {
    throw new AIError(
      "image_invalid",
      `Unsupported image type "${mimeType}". Use JPG, PNG, WEBP or GIF.`,
    );
  }
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > LIMITS.maxImageBytes) {
    throw new AIError(
      "image_invalid",
      `Image is too large (${(bytes / 1024 / 1024).toFixed(1)} MB, max ${LIMITS.maxImageBytes / 1024 / 1024} MB). Resize it and try again.`,
    );
  }
  return { mimeType, base64, bytes };
}

/**
 * Read a File into a validated data URL, downscaling oversized images so we
 * never blindly ship enormous payloads to a provider.
 */
export async function fileToValidatedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new AIError("image_invalid", `"${file.name}" is not an image file.`);
  }
  if (!(LIMITS.supportedImageTypes as readonly string[]).includes(file.type.toLowerCase())) {
    throw new AIError(
      "image_invalid",
      `"${file.name}" has unsupported type ${file.type}. Use JPG, PNG, WEBP or GIF.`,
    );
  }

  const rawUrl = await readAsDataUrl(file);
  // Fast path: small file, no resize needed
  if (file.size <= LIMITS.maxImageBytes / 2) {
    const dims = await imageDimensions(rawUrl);
    if (dims.width <= LIMITS.maxImageDimension && dims.height <= LIMITS.maxImageDimension) {
      validateImageDataUrl(rawUrl);
      return rawUrl;
    }
  }
  // Downscale via canvas
  const scaled = await downscaleImage(rawUrl, LIMITS.maxImageDimension);
  validateImageDataUrl(scaled);
  return scaled;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new AIError("image_invalid", `Could not read "${file.name}".`));
    r.readAsDataURL(file);
  });
}

function imageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new AIError("image_invalid", "Could not decode image."));
    img.src = dataUrl;
  });
}

async function downscaleImage(dataUrl: string, maxDim: number): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new AIError("image_invalid", "Could not decode image."));
    el.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.9);
}

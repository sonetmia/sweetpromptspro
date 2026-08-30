// ── Central AI engine — configuration store ───────────────────────────────────
// Keys live in browser localStorage only (documented architecture: the app is a
// client-side workspace and calls providers directly from the browser over
// CORS-enabled official endpoints). Keys are never logged, never sent anywhere
// except the selected provider, and are cleared on disconnect.

import type { AIConfig, ProviderId } from "./types";

export const AI_CONFIG_KEY = "saml_ai_config_v2";

/** Legacy storage keys migrated once, then removed. */
const LEGACY_SP_API_CFG = "sp_api_cfg";
const LEGACY_FREE_API = "sp_free_api_connected";

const KNOWN_PROVIDERS: ProviderId[] = [
  "gemini",
  "mistral",
  "groq",
  "openrouter",
  "cerebras",
  "together",
  "huggingface",
  "cohere",
];

function emptyConfig(): AIConfig {
  return { version: 2, provider: "", providers: {} };
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isProviderId(v: unknown): v is ProviderId {
  return typeof v === "string" && (KNOWN_PROVIDERS as string[]).includes(v);
}

/** One-time migration from the two legacy localStorage schemas. */
function migrateLegacy(): AIConfig | null {
  if (typeof localStorage === "undefined") return null;
  const cfg = emptyConfig();
  let migrated = false;

  const legacyFree = safeParse(localStorage.getItem(LEGACY_FREE_API)) as Record<
    string,
    { key?: string; connectedAt?: number }
  > | null;
  if (legacyFree && typeof legacyFree === "object") {
    for (const [id, v] of Object.entries(legacyFree)) {
      if (isProviderId(id) && v?.key) {
        cfg.providers[id] = {
          apiKey: v.key,
          model: "",
          connectedAt: v.connectedAt ?? Date.now(),
          validated: true, // old flow only persisted after a successful validation call
        };
        migrated = true;
      }
    }
  }

  const legacyCfg = safeParse(localStorage.getItem(LEGACY_SP_API_CFG)) as {
    provider?: string;
    key?: string;
    model?: string;
  } | null;
  if (legacyCfg && typeof legacyCfg === "object") {
    if (isProviderId(legacyCfg.provider) && legacyCfg.key) {
      cfg.providers[legacyCfg.provider] = {
        apiKey: legacyCfg.key,
        model: legacyCfg.model || "",
        connectedAt: Date.now(),
        validated: false, // legacy config never guaranteed validation
      };
      cfg.provider = legacyCfg.provider;
      migrated = true;
    }
  }

  if (!cfg.provider) {
    const first = KNOWN_PROVIDERS.find((p) => cfg.providers[p]?.validated);
    if (first) cfg.provider = first;
  }

  if (!migrated) return null;
  try {
    localStorage.removeItem(LEGACY_SP_API_CFG);
    localStorage.removeItem(LEGACY_FREE_API);
  } catch {
    /* ignore */
  }
  return cfg;
}

export function loadAIConfig(): AIConfig {
  if (typeof localStorage === "undefined") return emptyConfig();
  const parsed = safeParse(localStorage.getItem(AI_CONFIG_KEY)) as AIConfig | null;
  if (parsed && parsed.version === 2 && typeof parsed.providers === "object") {
    const cfg = emptyConfig();
    cfg.provider = isProviderId(parsed.provider) ? parsed.provider : "";
    for (const id of KNOWN_PROVIDERS) {
      const p = parsed.providers?.[id];
      if (p && typeof p.apiKey === "string" && p.apiKey) {
        cfg.providers[id] = {
          apiKey: p.apiKey,
          model: typeof p.model === "string" ? p.model : "",
          connectedAt: typeof p.connectedAt === "number" ? p.connectedAt : Date.now(),
          validated: !!p.validated,
        };
      }
    }
    if (cfg.provider && !cfg.providers[cfg.provider]) cfg.provider = "";
    return cfg;
  }
  const migrated = migrateLegacy();
  if (migrated) {
    saveAIConfig(migrated);
    return migrated;
  }
  return emptyConfig();
}

export function saveAIConfig(cfg: AIConfig): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    /* storage full / private mode — ignore */
  }
  notifyConfigChange();
}

export function connectProvider(id: ProviderId, apiKey: string, model: string): AIConfig {
  const cfg = loadAIConfig();
  cfg.providers[id] = { apiKey, model, connectedAt: Date.now(), validated: true };
  cfg.provider = id;
  saveAIConfig(cfg);
  return cfg;
}

export function disconnectProvider(id: ProviderId): AIConfig {
  const cfg = loadAIConfig();
  delete cfg.providers[id]; // fully clear stored credential
  if (cfg.provider === id) {
    cfg.provider = "";
  }
  saveAIConfig(cfg);
  return cfg;
}

export function setActiveProvider(id: ProviderId | ""): AIConfig {
  const cfg = loadAIConfig();
  if (id === "" || cfg.providers[id]) cfg.provider = id;
  saveAIConfig(cfg);
  return cfg;
}

export function setProviderModel(id: ProviderId, model: string): AIConfig {
  const cfg = loadAIConfig();
  const p = cfg.providers[id];
  if (p) {
    p.model = model;
    saveAIConfig(cfg);
  }
  return cfg;
}

// ── Change notification (lets the header status badge update live) ────────────
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeAIConfig(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyConfigChange() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

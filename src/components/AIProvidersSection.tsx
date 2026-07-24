import { useEffect, useMemo, useRef, useState } from "react";

/**
 * AI API Providers — Multi-provider management panel.
 *
 * This is a self-contained settings section. It does NOT touch or replace
 * the existing prompt/metadata generation logic in SweetPrompts.tsx.
 * Keys and config are stored in localStorage only, per browser.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types & Registry
// ─────────────────────────────────────────────────────────────────────────────
export type ProviderId =
  | "openrouter"
  | "google"
  | "groq"
  | "cloudflare"
  | "huggingface"
  | "github"
  | "cerebras"
  | "sambanova"
  | "together"
  | "deepinfra"
  | "mistral"
  | "cohere";

type ProviderState = {
  enabled: boolean;
  apiKey: string;
  extra: string; // e.g. Cloudflare account ID
  model: string;
  models: string[]; // cached model list
  lastTest: "" | "ok" | "invalid" | "network" | "ratelimit" | "unknown";
  lastTestMsg: string;
  lastTestedAt: number; // epoch ms
};

type ConfigShape = {
  version: 1;
  defaultProvider: ProviderId | "";
  fallbackEnabled: boolean;
  providers: Record<ProviderId, ProviderState>;
};

type ProviderMeta = {
  id: ProviderId;
  name: string;
  logo: string; // emoji fallback
  description: string;
  keyPlaceholder: string;
  keyPattern?: RegExp;
  defaultModel: string;
  extraLabel?: string; // e.g. "Account ID" for Cloudflare
  extraPlaceholder?: string;
  extraRequired?: boolean;
  docsUrl: string;
  // Return list of model IDs (throws on failure)
  listModels: (key: string, extra: string) => Promise<string[]>;
  // Quick lightweight auth check
  testConnection: (key: string, extra: string) => Promise<void>;
};

const bearer = (key: string): HeadersInit => ({ Authorization: `Bearer ${key}` });

async function jsonOrThrow(res: Response): Promise<any> {
  if (res.status === 401 || res.status === 403) throw new Error("invalid");
  if (res.status === 429) throw new Error("ratelimit");
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.json();
}

const REGISTRY: ProviderMeta[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    logo: "🌐",
    description: "Unified gateway to 100+ models from major labs.",
    keyPlaceholder: "sk-or-v1-...",
    keyPattern: /^sk-or-/,
    defaultModel: "openai/gpt-4o-mini",
    docsUrl: "https://openrouter.ai/keys",
    async listModels(key) {
      const r = await fetch("https://openrouter.ai/api/v1/models", { headers: bearer(key) });
      const j = await jsonOrThrow(r);
      return (j.data ?? []).map((m: any) => m.id).filter(Boolean);
    },
    async testConnection(key) {
      const r = await fetch("https://openrouter.ai/api/v1/auth/key", { headers: bearer(key) });
      await jsonOrThrow(r);
    },
  },
  {
    id: "google",
    name: "Google AI Studio",
    logo: "🔷",
    description: "Gemini family via Google AI Studio.",
    keyPlaceholder: "AIza...",
    keyPattern: /^AIza/,
    defaultModel: "gemini-2.0-flash",
    docsUrl: "https://aistudio.google.com/apikey",
    async listModels(key) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
      const j = await jsonOrThrow(r);
      return (j.models ?? []).map((m: any) => String(m.name || "").replace(/^models\//, "")).filter(Boolean);
    },
    async testConnection(key) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
      await jsonOrThrow(r);
    },
  },
  {
    id: "groq",
    name: "Groq",
    logo: "⚡",
    description: "Ultra-fast LPU inference for open models.",
    keyPlaceholder: "gsk_...",
    keyPattern: /^gsk_/,
    defaultModel: "llama-3.3-70b-versatile",
    docsUrl: "https://console.groq.com/keys",
    async listModels(key) {
      const r = await fetch("https://api.groq.com/openai/v1/models", { headers: bearer(key) });
      const j = await jsonOrThrow(r);
      return (j.data ?? []).map((m: any) => m.id).filter(Boolean);
    },
    async testConnection(key) {
      const r = await fetch("https://api.groq.com/openai/v1/models", { headers: bearer(key) });
      await jsonOrThrow(r);
    },
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    logo: "☁️",
    description: "Serverless inference on Cloudflare's edge network.",
    keyPlaceholder: "Cloudflare API Token",
    defaultModel: "@cf/meta/llama-3.1-8b-instruct",
    extraLabel: "Account ID",
    extraPlaceholder: "cloudflare account id",
    extraRequired: true,
    docsUrl: "https://dash.cloudflare.com/profile/api-tokens",
    async listModels(key, extra) {
      if (!extra) throw new Error("missing_account_id");
      const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(extra)}/ai/models/search?per_page=100`, { headers: bearer(key) });
      const j = await jsonOrThrow(r);
      return (j.result ?? []).map((m: any) => m.name).filter(Boolean);
    },
    async testConnection(key) {
      const r = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", { headers: bearer(key) });
      await jsonOrThrow(r);
    },
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    logo: "🤗",
    description: "Inference API for open-source models on the Hub.",
    keyPlaceholder: "hf_...",
    keyPattern: /^hf_/,
    defaultModel: "meta-llama/Llama-3.1-8B-Instruct",
    docsUrl: "https://huggingface.co/settings/tokens",
    async listModels() {
      // HF's models endpoint is enormous; return a curated shortlist and let users type any ID.
      return [
        "meta-llama/Llama-3.1-8B-Instruct",
        "meta-llama/Llama-3.3-70B-Instruct",
        "mistralai/Mistral-7B-Instruct-v0.3",
        "Qwen/Qwen2.5-72B-Instruct",
        "google/gemma-2-9b-it",
      ];
    },
    async testConnection(key) {
      const r = await fetch("https://huggingface.co/api/whoami-v2", { headers: bearer(key) });
      await jsonOrThrow(r);
    },
  },
  {
    id: "github",
    name: "GitHub Models",
    logo: "🐙",
    description: "Model catalog available with a GitHub PAT.",
    keyPlaceholder: "github_pat_... or ghp_...",
    defaultModel: "openai/gpt-4o-mini",
    docsUrl: "https://github.com/settings/tokens",
    async listModels(key) {
      const r = await fetch("https://models.github.ai/catalog/models", { headers: { ...bearer(key), Accept: "application/vnd.github+json" } });
      const j = await jsonOrThrow(r);
      const arr = Array.isArray(j) ? j : j.models || [];
      return arr.map((m: any) => m.id || m.name).filter(Boolean);
    },
    async testConnection(key) {
      const r = await fetch("https://models.github.ai/catalog/models", { headers: { ...bearer(key), Accept: "application/vnd.github+json" } });
      await jsonOrThrow(r);
    },
  },
  {
    id: "cerebras",
    name: "Cerebras Inference",
    logo: "🧠",
    description: "World's fastest inference on wafer-scale hardware.",
    keyPlaceholder: "csk-...",
    defaultModel: "llama3.1-8b",
    docsUrl: "https://cloud.cerebras.ai",
    async listModels(key) {
      const r = await fetch("https://api.cerebras.ai/v1/models", { headers: bearer(key) });
      const j = await jsonOrThrow(r);
      return (j.data ?? []).map((m: any) => m.id).filter(Boolean);
    },
    async testConnection(key) {
      const r = await fetch("https://api.cerebras.ai/v1/models", { headers: bearer(key) });
      await jsonOrThrow(r);
    },
  },
  {
    id: "sambanova",
    name: "SambaNova Cloud",
    logo: "💠",
    description: "Fast inference for large open-weight models.",
    keyPlaceholder: "SambaNova API Key",
    defaultModel: "Meta-Llama-3.1-8B-Instruct",
    docsUrl: "https://cloud.sambanova.ai/apis",
    async listModels(key) {
      const r = await fetch("https://api.sambanova.ai/v1/models", { headers: bearer(key) });
      const j = await jsonOrThrow(r);
      return (j.data ?? []).map((m: any) => m.id).filter(Boolean);
    },
    async testConnection(key) {
      const r = await fetch("https://api.sambanova.ai/v1/models", { headers: bearer(key) });
      await jsonOrThrow(r);
    },
  },
  {
    id: "together",
    name: "Together AI",
    logo: "🤝",
    description: "Fast, scalable inference for hundreds of open models.",
    keyPlaceholder: "Together API Key",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    docsUrl: "https://api.together.xyz/settings/api-keys",
    async listModels(key) {
      const r = await fetch("https://api.together.xyz/v1/models", { headers: bearer(key) });
      const j = await jsonOrThrow(r);
      const arr = Array.isArray(j) ? j : j.data || [];
      return arr.map((m: any) => m.id).filter(Boolean);
    },
    async testConnection(key) {
      const r = await fetch("https://api.together.xyz/v1/models", { headers: bearer(key) });
      await jsonOrThrow(r);
    },
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    logo: "🌊",
    description: "Low-cost inference for popular open models.",
    keyPlaceholder: "DeepInfra API Key",
    defaultModel: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    docsUrl: "https://deepinfra.com/dash/api_keys",
    async listModels(key) {
      const r = await fetch("https://api.deepinfra.com/v1/openai/models", { headers: bearer(key) });
      const j = await jsonOrThrow(r);
      return (j.data ?? []).map((m: any) => m.id).filter(Boolean);
    },
    async testConnection(key) {
      const r = await fetch("https://api.deepinfra.com/v1/openai/models", { headers: bearer(key) });
      await jsonOrThrow(r);
    },
  },
  {
    id: "mistral",
    name: "Mistral AI",
    logo: "🌪️",
    description: "Mistral Large, Small, Codestral, Pixtral (vision).",
    keyPlaceholder: "Mistral API Key",
    defaultModel: "mistral-large-latest",
    docsUrl: "https://console.mistral.ai/api-keys",
    async listModels(key) {
      const r = await fetch("https://api.mistral.ai/v1/models", { headers: bearer(key) });
      const j = await jsonOrThrow(r);
      return (j.data ?? []).map((m: any) => m.id).filter(Boolean);
    },
    async testConnection(key) {
      const r = await fetch("https://api.mistral.ai/v1/models", { headers: bearer(key) });
      await jsonOrThrow(r);
    },
  },
  {
    id: "cohere",
    name: "Cohere",
    logo: "🎯",
    description: "Command R+ and enterprise-grade text/embedding models.",
    keyPlaceholder: "Cohere API Key",
    defaultModel: "command-r-plus",
    docsUrl: "https://dashboard.cohere.com/api-keys",
    async listModels(key) {
      const r = await fetch("https://api.cohere.com/v1/models?page_size=100", { headers: bearer(key) });
      const j = await jsonOrThrow(r);
      return (j.models ?? []).map((m: any) => m.name).filter(Boolean);
    },
    async testConnection(key) {
      const r = await fetch("https://api.cohere.com/v1/models?page_size=1", { headers: bearer(key) });
      await jsonOrThrow(r);
    },
  },
];

const META_BY_ID: Record<ProviderId, ProviderMeta> = Object.fromEntries(
  REGISTRY.map((m) => [m.id, m]),
) as Record<ProviderId, ProviderMeta>;

// ─────────────────────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "sp_ai_providers_v1";

function emptyState(): ProviderState {
  return { enabled: false, apiKey: "", extra: "", model: "", models: [], lastTest: "", lastTestMsg: "", lastTestedAt: 0 };
}

function loadConfig(): ConfigShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const providers: Record<string, ProviderState> = {};
      for (const meta of REGISTRY) providers[meta.id] = { ...emptyState(), ...(parsed.providers?.[meta.id] ?? {}) };
      return {
        version: 1,
        defaultProvider: parsed.defaultProvider ?? "",
        fallbackEnabled: !!parsed.fallbackEnabled,
        providers: providers as Record<ProviderId, ProviderState>,
      };
    }
  } catch { /* ignore */ }
  const providers = {} as Record<ProviderId, ProviderState>;
  for (const meta of REGISTRY) providers[meta.id] = emptyState();
  return { version: 1, defaultProvider: "", fallbackEnabled: false, providers };
}

function saveConfig(cfg: ConfigShape) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}

function redactedConfig(cfg: ConfigShape): ConfigShape {
  const providers: Record<ProviderId, ProviderState> = {} as any;
  for (const meta of REGISTRY) {
    const p = cfg.providers[meta.id];
    providers[meta.id] = { ...p, apiKey: p.apiKey ? "__REDACTED__" : "" };
  }
  return { ...cfg, providers };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI
// ─────────────────────────────────────────────────────────────────────────────
type Theme = {
  bg: string; card: string; card2: string; border: string; border2: string;
  text: string; muted: string; dim: string;
  orange: string; orangeSoft: string; orangeGlow: string;
  green: string; red: string; blue: string; gold: string; purple: string;
};

export function AIProvidersSection({ C }: { C: Theme }) {
  const [cfg, setCfg] = useState<ConfigShape>(() => loadConfig());
  const [saved, setSaved] = useState(false);
  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 1400); };
  const persist = (next: ConfigShape) => { setCfg(next); saveConfig(next); flash(); };
  const importRef = useRef<HTMLInputElement>(null);

  const enabledProviders = useMemo(
    () => REGISTRY.filter((m) => cfg.providers[m.id].enabled && cfg.providers[m.id].apiKey.trim()),
    [cfg],
  );

  const updateProvider = (id: ProviderId, patch: Partial<ProviderState>) => {
    persist({ ...cfg, providers: { ...cfg.providers, [id]: { ...cfg.providers[id], ...patch } } });
  };

  const saveAll = () => { saveConfig(cfg); flash(); };

  const resetAll = () => {
    if (!confirm("Reset all AI provider configuration? Keys and cached models will be cleared.")) return;
    const providers = {} as Record<ProviderId, ProviderState>;
    for (const meta of REGISTRY) providers[meta.id] = emptyState();
    persist({ version: 1, defaultProvider: "", fallbackEnabled: false, providers });
  };

  const exportCfg = () => {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sweetprompts-ai-providers.json";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  };

  const importCfg = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || !parsed.providers) throw new Error("bad shape");
      const providers = {} as Record<ProviderId, ProviderState>;
      for (const meta of REGISTRY) providers[meta.id] = { ...emptyState(), ...(parsed.providers[meta.id] ?? {}) };
      persist({
        version: 1,
        defaultProvider: parsed.defaultProvider ?? "",
        fallbackEnabled: !!parsed.fallbackEnabled,
        providers,
      });
    } catch {
      alert("Invalid configuration file.");
    }
  };

  return (
    <div>
      {/* Global controls */}
      <div style={{
        background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 12,
        padding: 14, marginBottom: 16, display: "grid", gap: 12,
        gridTemplateColumns: "minmax(240px, 1fr) minmax(180px, 240px) auto",
        alignItems: "end", flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 10.5, color: C.muted, textTransform: "uppercase", letterSpacing: ".8px", fontWeight: 700, marginBottom: 6 }}>Default Provider</div>
          <select
            value={cfg.defaultProvider}
            onChange={(e) => persist({ ...cfg, defaultProvider: e.target.value as ProviderId | "" })}
            style={{ width: "100%", background: C.card, border: `1px solid ${C.border2}`, color: C.text, borderRadius: 9, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", outline: "none" }}
          >
            <option value="">— none —</option>
            {enabledProviders.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border2}`, borderRadius: 9, padding: "10px 12px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={cfg.fallbackEnabled}
            onChange={(e) => persist({ ...cfg, fallbackEnabled: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: C.orange, cursor: "pointer" }}
          />
          <div>
            <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>Auto-fallback</div>
            <div style={{ fontSize: 10.5, color: C.muted }}>Try next enabled provider on failure</div>
          </div>
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <MiniBtn C={C} onClick={saveAll} tone="orange">💾 Save All</MiniBtn>
          <MiniBtn C={C} onClick={resetAll} tone="red">↺ Reset</MiniBtn>
          <MiniBtn C={C} onClick={exportCfg}>⇩ Export</MiniBtn>
          <MiniBtn C={C} onClick={() => importRef.current?.click()}>⇪ Import</MiniBtn>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importCfg(f); e.currentTarget.value = ""; }}
          />
        </div>
        {saved && (
          <div style={{ gridColumn: "1 / -1", fontSize: 11.5, color: C.green, fontWeight: 600 }}>✓ Saved</div>
        )}
      </div>

      <div style={{
        display: "grid", gap: 14,
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      }}>
        {REGISTRY.map((meta) => (
          <ProviderCard
            key={meta.id}
            C={C}
            meta={meta}
            state={cfg.providers[meta.id]}
            onChange={(patch) => updateProvider(meta.id, patch)}
          />
        ))}
      </div>

      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "13px 15px", marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: "uppercase" }}>🔒 Security</div>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.65, margin: 0 }}>
          API keys are stored locally in your browser only (localStorage). Exported configs include keys — share carefully.
          Test calls go directly from your browser to the provider; some providers may block browser requests via CORS,
          in which case you can still save the key and use manual model entry.
        </p>
      </div>
    </div>
  );
}

function MiniBtn({ C, children, onClick, tone }: { C: Theme; children: React.ReactNode; onClick: () => void; tone?: "orange" | "red" | "neutral" }) {
  const bg = tone === "orange" ? C.orange : tone === "red" ? C.red : "transparent";
  const fg = tone ? "#fff" : C.text;
  const border = tone ? bg : C.border2;
  return (
    <button
      onClick={onClick}
      style={{
        background: tone ? `linear-gradient(180deg, ${bg} 0%, ${bg}dd 100%)` : C.card,
        color: fg,
        border: `1px solid ${border}`,
        borderRadius: 9,
        padding: "8px 14px",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: tone ? `0 4px 14px ${bg}44` : "none",
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Card
// ─────────────────────────────────────────────────────────────────────────────
function ProviderCard({ C, meta, state, onChange }: {
  C: Theme;
  meta: ProviderMeta;
  state: ProviderState;
  onChange: (patch: Partial<ProviderState>) => void;
}) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [modelsOpen, setModelsOpen] = useState(false);

  const keyEmpty = !state.apiKey.trim();
  const keyFormatOk = !state.apiKey.trim() || !meta.keyPattern || meta.keyPattern.test(state.apiKey.trim());
  const extraMissing = !!meta.extraRequired && !state.extra.trim();

  const runTest = async () => {
    if (keyEmpty) { onChange({ lastTest: "invalid", lastTestMsg: "API key is empty", lastTestedAt: Date.now() }); return; }
    if (extraMissing) { onChange({ lastTest: "invalid", lastTestMsg: `${meta.extraLabel} is required`, lastTestedAt: Date.now() }); return; }
    setTesting(true);
    try {
      await meta.testConnection(state.apiKey.trim(), state.extra.trim());
      onChange({ lastTest: "ok", lastTestMsg: "Connected", lastTestedAt: Date.now() });
    } catch (e: any) {
      const kind = classifyError(e);
      onChange({ lastTest: kind, lastTestMsg: labelFor(kind), lastTestedAt: Date.now() });
    } finally { setTesting(false); }
  };

  const loadModels = async () => {
    if (keyEmpty) return;
    setLoadingModels(true);
    try {
      const models = await meta.listModels(state.apiKey.trim(), state.extra.trim());
      onChange({ models });
      setModelsOpen(true);
    } catch (e: any) {
      const kind = classifyError(e);
      onChange({ lastTest: kind, lastTestMsg: "Model load failed: " + labelFor(kind), lastTestedAt: Date.now() });
    } finally { setLoadingModels(false); }
  };

  const copyKey = async () => {
    try { await navigator.clipboard.writeText(state.apiKey); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
  };

  const statusColor =
    state.lastTest === "ok" ? C.green :
    state.lastTest === "" ? C.muted :
    state.lastTest === "ratelimit" ? C.gold : C.red;

  const filteredModels = state.models.filter((m) => m.toLowerCase().includes(modelSearch.toLowerCase())).slice(0, 40);

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${state.enabled ? C.orange + "55" : C.border2}`,
      borderRadius: 14,
      padding: 16,
      display: "flex", flexDirection: "column", gap: 10,
      boxShadow: state.enabled ? `0 8px 30px -18px ${C.orangeGlow}` : "none",
      transition: "border-color .2s, box-shadow .2s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: C.card2, border: `1px solid ${C.border2}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>{meta.logo}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{meta.name}</div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, marginTop: 2 }}>{meta.description}</div>
        </div>
        <Toggle C={C} on={state.enabled} onChange={(v) => onChange({ enabled: v })} />
      </div>

      {/* API Key */}
      <div>
        <FieldLabel C={C}>API Key</FieldLabel>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type={showKey ? "text" : "password"}
            value={state.apiKey}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            placeholder={meta.keyPlaceholder}
            autoComplete="off"
            spellCheck={false}
            style={inputStyle(C, !keyFormatOk)}
          />
          <IconBtn C={C} onClick={() => setShowKey((s) => !s)} title={showKey ? "Hide" : "Show"}>{showKey ? "🙈" : "👁"}</IconBtn>
          <IconBtn C={C} onClick={copyKey} title="Copy" disabled={keyEmpty}>{copied ? "✓" : "⧉"}</IconBtn>
          <IconBtn C={C} onClick={() => onChange({ apiKey: "", lastTest: "", lastTestMsg: "" })} title="Clear" disabled={keyEmpty}>✕</IconBtn>
        </div>
        {!keyFormatOk && <div style={{ fontSize: 10.5, color: C.red, marginTop: 4 }}>Key format looks unusual for {meta.name}.</div>}
        <a href={meta.docsUrl} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: C.blue, textDecoration: "none", marginTop: 4, display: "inline-block" }}>
          Get key ↗
        </a>
      </div>

      {/* Extra field (e.g. Cloudflare account id) */}
      {meta.extraLabel && (
        <div>
          <FieldLabel C={C}>{meta.extraLabel}{meta.extraRequired && <span style={{ color: C.red }}> *</span>}</FieldLabel>
          <input
            type="text"
            value={state.extra}
            onChange={(e) => onChange({ extra: e.target.value })}
            placeholder={meta.extraPlaceholder}
            autoComplete="off"
            spellCheck={false}
            style={inputStyle(C, false)}
          />
        </div>
      )}

      {/* Model */}
      <div>
        <FieldLabel C={C}>Default Model</FieldLabel>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            value={state.model}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder={meta.defaultModel}
            spellCheck={false}
            style={inputStyle(C, false)}
          />
          <IconBtn C={C} onClick={loadModels} title="Refresh model list" disabled={keyEmpty || loadingModels}>
            {loadingModels ? "…" : "↻"}
          </IconBtn>
        </div>
        {state.models.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <button
              onClick={() => setModelsOpen((v) => !v)}
              style={{ background: "transparent", border: "none", color: C.muted, fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit" }}
            >
              {modelsOpen ? "▾" : "▸"} {state.models.length} models loaded
            </button>
            {modelsOpen && (
              <div style={{ marginTop: 6, background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: 8 }}>
                <input
                  type="text"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Search models…"
                  style={{ ...inputStyle(C, false), marginBottom: 6 }}
                />
                <div style={{ maxHeight: 160, overflow: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                  {filteredModels.map((m) => (
                    <button
                      key={m}
                      onClick={() => { onChange({ model: m }); setModelsOpen(false); }}
                      style={{
                        textAlign: "left", background: state.model === m ? C.orangeSoft : "transparent",
                        border: `1px solid ${state.model === m ? C.orange + "55" : "transparent"}`,
                        color: state.model === m ? C.orange : C.text,
                        borderRadius: 6, padding: "5px 8px", fontSize: 11.5, cursor: "pointer", fontFamily: "inherit",
                      }}
                    >{m}</button>
                  ))}
                  {filteredModels.length === 0 && <div style={{ fontSize: 11, color: C.dim, padding: 4 }}>No matches</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 8,
        padding: "6px 10px",
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
        <span style={{ fontSize: 11.5, color: statusColor, fontWeight: 600 }}>
          {state.lastTest === "" ? "Not tested" :
           state.lastTest === "ok" ? "✓ Connected" :
           state.lastTest === "invalid" ? "✗ Invalid API Key" :
           state.lastTest === "network" ? "✗ Network Error" :
           state.lastTest === "ratelimit" ? "✗ Rate Limited" : "✗ Error"}
        </span>
        {state.lastTestMsg && state.lastTest !== "ok" && (
          <span style={{ fontSize: 10.5, color: C.muted }}>· {state.lastTestMsg}</span>
        )}
        {state.lastTestedAt > 0 && (
          <span style={{ fontSize: 10.5, color: C.dim, marginLeft: "auto" }}>{relTime(state.lastTestedAt)}</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          onClick={runTest}
          disabled={testing || keyEmpty}
          style={{
            flex: 1, minWidth: 130,
            background: testing || keyEmpty ? C.card2 : `linear-gradient(180deg, ${C.blue} 0%, ${C.blue}dd 100%)`,
            color: testing || keyEmpty ? C.dim : "#fff",
            border: `1px solid ${testing || keyEmpty ? C.border2 : C.blue}`,
            borderRadius: 9, padding: "9px 12px", fontSize: 12.5, fontWeight: 600,
            cursor: testing || keyEmpty ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}
        >{testing ? "Testing…" : "🔌 Test Connection"}</button>
        <button
          onClick={() => onChange({})}
          style={{
            background: `linear-gradient(180deg, ${C.orange} 0%, ${C.orange}dd 100%)`,
            color: "#fff", border: `1px solid ${C.orange}`,
            borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >💾 Save</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small pieces
// ─────────────────────────────────────────────────────────────────────────────
function FieldLabel({ C, children }: { C: Theme; children: React.ReactNode }) {
  return <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".7px", fontWeight: 700, marginBottom: 4 }}>{children}</div>;
}

function inputStyle(C: Theme, invalid: boolean): React.CSSProperties {
  return {
    flex: 1, width: "100%", boxSizing: "border-box",
    background: C.card2,
    border: `1px solid ${invalid ? C.red + "88" : C.border2}`,
    color: C.text, borderRadius: 8, padding: "8px 10px",
    fontSize: 12, fontFamily: "inherit", outline: "none",
  };
}

function IconBtn({ C, onClick, title, children, disabled }: { C: Theme; onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        background: C.card2, border: `1px solid ${C.border2}`,
        color: disabled ? C.dim : C.text, borderRadius: 8, padding: "0 10px",
        fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", minWidth: 34,
      }}
    >{children}</button>
  );
}

function Toggle({ C, on, onChange }: { C: Theme; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-label={on ? "Disable" : "Enable"}
      style={{
        width: 40, height: 22, borderRadius: 999,
        background: on ? C.orange : C.card2,
        border: `1px solid ${on ? C.orange : C.border2}`,
        position: "relative", cursor: "pointer", padding: 0, transition: "background .2s",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: on ? 20 : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left .18s",
        boxShadow: "0 1px 3px rgba(0,0,0,.3)",
      }} />
    </button>
  );
}

function classifyError(e: any): ProviderState["lastTest"] {
  const msg = String(e?.message || e || "").toLowerCase();
  if (msg.includes("invalid")) return "invalid";
  if (msg.includes("ratelimit")) return "ratelimit";
  if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("cors")) return "network";
  if (msg.startsWith("http_4")) return "invalid";
  if (msg.startsWith("http_5")) return "network";
  return "unknown";
}

function labelFor(k: ProviderState["lastTest"]): string {
  switch (k) {
    case "ok": return "Connected";
    case "invalid": return "Invalid API Key";
    case "network": return "Network Error (or CORS blocked)";
    case "ratelimit": return "Rate Limited";
    case "unknown": return "Unknown Error";
    default: return "";
  }
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Suppress unused warning for redactedConfig (kept for future encrypted-export use)
export const _internal = { redactedConfig };

// Silence unused hook import warning if strict lint mode is on
void useEffect;

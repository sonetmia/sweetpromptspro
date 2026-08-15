import { useEffect, useState } from "react";
import creatorAsset from "@/assets/md-sonet-mia.png.asset.json";

type Theme = Record<string, string>;

type FreeProvider = {
  id: string;
  name: string;
  icon: string;
  note: string;
  placeholder: string;
  docs: string;
  validate: (key: string) => Promise<void>;
};

async function ok(res: Response) {
  if (res.ok) return;
  let detail = "";
  try {
    const t = await res.text();
    detail = t.slice(0, 140);
  } catch {
    /* ignore */
  }
  if (res.status === 401 || res.status === 403) throw new Error("Invalid or unauthorized API key");
  if (res.status === 429) throw new Error("Rate limit reached — try again in a moment");
  throw new Error(`Validation failed (${res.status})${detail ? `: ${detail}` : ""}`);
}

const bearer = (url: string) => async (key: string) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  await ok(res);
};

export const FREE_PROVIDERS: FreeProvider[] = [
  {
    id: "gemini",
    name: "Google Gemini (AI Studio)",
    icon: "✨",
    note: "Generous free tier · vision supported",
    placeholder: "AIza...",
    docs: "https://aistudio.google.com/apikey",
    validate: async (key) => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
      );
      await ok(res);
    },
  },
  {
    id: "groq",
    name: "Groq",
    icon: "⚡",
    note: "Free & extremely fast Llama models",
    placeholder: "gsk_...",
    docs: "https://console.groq.com/keys",
    validate: bearer("https://api.groq.com/openai/v1/models"),
  },
  {
    id: "mistral",
    name: "Mistral AI",
    icon: "🌀",
    note: "Free tier · Pixtral vision models",
    placeholder: "...",
    docs: "https://console.mistral.ai/api-keys",
    validate: bearer("https://api.mistral.ai/v1/models"),
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: "🛰",
    note: "Many :free models in one key",
    placeholder: "sk-or-v1-...",
    docs: "https://openrouter.ai/keys",
    validate: bearer("https://openrouter.ai/api/v1/key"),
  },
  {
    id: "cerebras",
    name: "Cerebras",
    icon: "🧠",
    note: "Free daily quota · ultra low latency",
    placeholder: "csk-...",
    docs: "https://cloud.cerebras.ai",
    validate: bearer("https://api.cerebras.ai/v1/models"),
  },
  {
    id: "together",
    name: "Together AI",
    icon: "🤝",
    note: "Free tier models available",
    placeholder: "...",
    docs: "https://api.together.xyz/settings/api-keys",
    validate: bearer("https://api.together.xyz/v1/models"),
  },
  {
    id: "cohere",
    name: "Cohere",
    icon: "🔗",
    note: "Free trial keys for text tasks",
    placeholder: "...",
    docs: "https://dashboard.cohere.com/api-keys",
    validate: bearer("https://api.cohere.com/v1/models"),
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    icon: "🤗",
    note: "Free inference credits",
    placeholder: "hf_...",
    docs: "https://huggingface.co/settings/tokens",
    validate: bearer("https://huggingface.co/api/whoami-v2"),
  },
];

type Saved = Record<string, { key: string; connectedAt: number }>;
const LS = "sp_free_api_connected";

function load(): Saved {
  try {
    return JSON.parse(localStorage.getItem(LS) || "{}") as Saved;
  } catch {
    return {};
  }
}
function persist(s: Saved) {
  try {
    localStorage.setItem(LS, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const mask = (k: string) => (k.length <= 8 ? "••••" : `${k.slice(0, 4)}••••${k.slice(-4)}`);

export function FreeApiProviders({ C }: { C: Theme }) {
  const [connected, setConnected] = useState<Saved>({});
  const [open, setOpen] = useState<string | null>(null);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, { ok: boolean; msg: string }>>({});

  useEffect(() => {
    setConnected(load());
  }, []);

  async function test(p: FreeProvider) {
    const key = (keys[p.id] || "").trim();
    if (!key) return;
    setBusy(p.id);
    setStatus(s => ({ ...s, [p.id]: { ok: true, msg: "Validating…" } }));
    try {
      await p.validate(key);
      const next = { ...load(), [p.id]: { key, connectedAt: Date.now() } };
      persist(next);
      setConnected(next);
      setStatus(s => ({ ...s, [p.id]: { ok: true, msg: "✓ API Validated Successfully — saved" } }));
    } catch (e: any) {
      const next = load();
      delete next[p.id];
      persist(next);
      setConnected(next);
      setStatus(s => ({
        ...s,
        [p.id]: { ok: false, msg: `✗ ${e?.message || "Could not validate this API key"}` },
      }));
    } finally {
      setBusy(null);
    }
  }

  function disconnect(id: string) {
    const next = load();
    delete next[id];
    persist(next);
    setConnected(next);
    setStatus(s => ({ ...s, [id]: { ok: false, msg: "Disconnected" } }));
    setKeys(k => ({ ...k, [id]: "" }));
  }

  const connectedCount = Object.keys(connected).length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.65, maxWidth: 560 }}>
          Pick a free provider, paste your key and validate it. Keys are stored only in this browser.
        </p>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: connectedCount ? C.green : C.muted,
            background: connectedCount ? "rgba(34,197,94,.12)" : C.card2,
            border: `1px solid ${connectedCount ? "rgba(34,197,94,.35)" : C.border2}`,
            borderRadius: 999,
            padding: "5px 12px",
          }}
        >
          {connectedCount} connected
        </span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {FREE_PROVIDERS.map(p => {
          const isOpen = open === p.id;
          const conn = connected[p.id];
          const st = status[p.id];
          const key = keys[p.id] || "";
          return (
            <div
              key={p.id}
              style={{
                background: C.card,
                border: `1px solid ${conn ? "rgba(34,197,94,.35)" : isOpen ? C.border2 : C.border}`,
                borderRadius: 14,
                overflow: "hidden",
                transition: "border-color .18s",
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : p.id)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "transparent",
                  border: "none",
                  padding: "14px 16px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{p.icon}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.text,
                    }}
                  >
                    {p.name}
                  </span>
                  <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                    {conn ? `Key ${mask(conn.key)}` : p.note}
                  </span>
                </span>
                {conn && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.green,
                      background: "rgba(34,197,94,.12)",
                      border: "1px solid rgba(34,197,94,.35)",
                      borderRadius: 999,
                      padding: "4px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ● Connected
                  </span>
                )}
                <span style={{ color: C.muted, fontSize: 13, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }}>▾</span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.border}` }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: ".5px",
                      margin: "14px 0 6px",
                    }}
                  >
                    API Key
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      type="password"
                      value={key}
                      onChange={e => {
                        setKeys(k => ({ ...k, [p.id]: e.target.value }));
                        setStatus(s => ({ ...s, [p.id]: undefined as any }));
                      }}
                      placeholder={p.placeholder}
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={300}
                      style={{
                        flex: "1 1 240px",
                        background: C.card2,
                        border: `1px solid ${C.border2}`,
                        color: C.text,
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 13,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => test(p)}
                      disabled={!key.trim() || busy === p.id}
                      style={{
                        background: !key.trim() ? C.card2 : `linear-gradient(135deg,${C.orange},${C.purple})`,
                        border: `1px solid ${!key.trim() ? C.border2 : "transparent"}`,
                        color: !key.trim() ? C.muted : "#fff",
                        borderRadius: 10,
                        padding: "10px 18px",
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "inherit",
                        cursor: !key.trim() || busy === p.id ? "not-allowed" : "pointer",
                        opacity: busy === p.id ? 0.7 : 1,
                      }}
                    >
                      {busy === p.id ? "Testing…" : "Test API"}
                    </button>
                    {conn && (
                      <button
                        onClick={() => disconnect(p.id)}
                        style={{
                          background: C.card2,
                          border: `1px solid ${C.border2}`,
                          color: C.red,
                          borderRadius: 10,
                          padding: "10px 14px",
                          fontSize: 12.5,
                          fontWeight: 600,
                          fontFamily: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                    <a
                      href={p.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11.5, color: C.blue, textDecoration: "none" }}
                    >
                      Get a free key ↗
                    </a>
                    {st?.msg && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: st.ok ? C.green : C.red }}>{st.msg}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CreatorCard({ C }: { C: Theme }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: C.card,
        border: `1px solid ${C.border2}`,
        borderRadius: 16,
        padding: "16px 18px",
      }}
    >
      <img
        src={creatorImg}
        alt="Md Sonet Mia"
        loading="lazy"
        width={72}
        height={72}
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          objectFit: "cover",
          border: `2px solid ${C.orange}`,
          background: C.card2,
        }}
      />
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "1.2px",
            marginBottom: 4,
          }}
        >
          Creator
        </div>
        <div
          style={{
            fontFamily: "var(--display)",
            fontSize: 20,
            fontWeight: 800,
            color: C.text,
            letterSpacing: "-.3px",
          }}
        >
          Md Sonet Mia
        </div>
      </div>
    </div>
  );
}

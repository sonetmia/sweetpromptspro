import { useEffect, useState } from "react";
import { PROVIDERS } from "@/lib/ai/providers";
import type { ProviderAdapter, ProviderId } from "@/lib/ai/types";
import {
  loadAIConfig,
  connectProvider,
  disconnectProvider,
  setActiveProvider,
  setProviderModel,
  subscribeAIConfig,
} from "@/lib/ai/config";
import { aiErrorMessage } from "@/lib/ai/errors";
import { generateText, peekActiveProvider } from "@/lib/ai/engine";

type Theme = Record<string, string>;

const mask = (k: string) => (k.length <= 8 ? "••••" : `${k.slice(0, 4)}••••${k.slice(-4)}`);

/** Small "AI Provider: X ● Connected" pill for the navbar. */
export function ProviderStatusBadge({ onClick }: { onClick?: () => void }) {
  const [, force] = useState(0);
  useEffect(() => subscribeAIConfig(() => force((n) => n + 1)), []);
  const active = peekActiveProvider();
  return (
    <button
      onClick={onClick}
      title={
        active ? `AI Provider: ${active.adapter.name} — Connected` : "No AI provider connected"
      }
      aria-label={
        active ? `AI provider ${active.adapter.name} connected` : "No AI provider connected"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? "rgba(34,197,94,.35)" : "rgba(255,255,255,0.12)"}`,
        borderRadius: 999,
        padding: "5px 12px",
        fontSize: 11.5,
        fontWeight: 600,
        color: active ? "#22c55e" : "rgba(255,255,255,0.55)",
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: active ? "#22c55e" : "#71717a",
          boxShadow: active ? "0 0 8px rgba(34,197,94,.8)" : "none",
        }}
      />
      {active ? `${active.adapter.icon} ${active.adapter.name}` : "No AI provider"}
    </button>
  );
}

/** Settings → AI Provider section. One selected provider powers the entire app. */
export function ProviderSettings({ C }: { C: Theme }) {
  const [cfg, setCfg] = useState(() => loadAIConfig());
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, { ok: boolean; msg: string }>>({});

  useEffect(() => subscribeAIConfig(() => setCfg(loadAIConfig())), []);

  async function validateAndConnect(p: ProviderAdapter) {
    const key = (keys[p.id] || cfg.providers[p.id]?.apiKey || "").trim();
    if (!key) return;
    setBusy(p.id);
    setStatus((s) => ({ ...s, [p.id]: { ok: true, msg: "Validating…" } }));
    try {
      await p.validateKey(key);
      const model = cfg.providers[p.id]?.model || p.defaultModel;
      const next = connectProvider(p.id, key, model);
      setCfg(next);
      setKeys((k) => ({ ...k, [p.id]: "" }));
      setStatus((s) => ({ ...s, [p.id]: { ok: true, msg: "✓ Validated & connected" } }));
    } catch (e) {
      setStatus((s) => ({ ...s, [p.id]: { ok: false, msg: `✗ ${aiErrorMessage(e)}` } }));
    } finally {
      setBusy(null);
    }
  }

  async function testActive(p: ProviderAdapter) {
    setBusy(p.id);
    setStatus((s) => ({ ...s, [p.id]: { ok: true, msg: "Testing generation…" } }));
    try {
      const t = await generateText("Reply with exactly: OK", "ping", { maxTokens: 10 });
      setStatus((s) => ({
        ...s,
        [p.id]: { ok: true, msg: `✓ Live response: ${t.trim().slice(0, 30) || "(empty)"}` },
      }));
    } catch (e) {
      setStatus((s) => ({ ...s, [p.id]: { ok: false, msg: `✗ ${aiErrorMessage(e)}` } }));
    } finally {
      setBusy(null);
    }
  }

  function disconnect(id: ProviderId) {
    setCfg(disconnectProvider(id));
    setKeys((k) => ({ ...k, [id]: "" }));
    setStatus((s) => ({ ...s, [id]: { ok: false, msg: "Disconnected — key removed." } }));
  }

  const activeId = cfg.provider;

  return (
    <div>
      <div
        style={{
          background: C.card2,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "13px 16px",
          marginBottom: 14,
        }}
      >
        <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.65, margin: 0 }}>
          Connect <strong style={{ color: C.text }}>one</strong> provider and the entire app —
          prompt tools, Image Studio, Stock Intelligence, metadata, compliance — uses it. Free tiers
          and quotas are controlled by each provider and may change. Keys are stored only in this
          browser, sent only to the selected provider, and removed on disconnect. If the selected
          provider fails, the app shows the error — it never silently switches provider.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        }}
      >
        {PROVIDERS.map((p) => {
          const saved = cfg.providers[p.id];
          const connected = !!saved?.validated;
          const isActive = activeId === p.id && connected;
          const st = status[p.id];
          const keyInput = keys[p.id] ?? "";
          const caps = p.capabilities;
          return (
            <div
              key={p.id}
              style={{
                background: C.card,
                border: `1px solid ${isActive ? C.orange : connected ? "rgba(34,197,94,.4)" : C.border2}`,
                borderRadius: 14,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>
                  {p.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginTop: 2 }}>
                    {p.accessLabel}
                  </div>
                </div>
                {isActive && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#fff",
                      background: C.orange,
                      borderRadius: 999,
                      padding: "3px 9px",
                      textTransform: "uppercase",
                      letterSpacing: ".5px",
                    }}
                  >
                    Active
                  </span>
                )}
              </div>

              <p style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, margin: 0 }}>
                {p.description}
              </p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  ["Text", caps.text],
                  ["Vision", caps.vision],
                  ["JSON", caps.structuredOutput],
                ].map(([label, ok]) => (
                  <span
                    key={String(label)}
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: ok ? C.green : C.dim,
                      background: ok ? "rgba(34,197,94,.10)" : C.card2,
                      border: `1px solid ${ok ? "rgba(34,197,94,.3)" : C.border}`,
                      borderRadius: 6,
                      padding: "2px 8px",
                    }}
                  >
                    {ok ? "✓" : "✗"} {label}
                  </span>
                ))}
              </div>

              <div>
                <label
                  htmlFor={`model-${p.id}`}
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: ".6px",
                    marginBottom: 4,
                  }}
                >
                  Model
                </label>
                <select
                  id={`model-${p.id}`}
                  value={saved?.model || p.defaultModel}
                  onChange={(e) => setCfg(setProviderModel(p.id, e.target.value))}
                  disabled={!connected}
                  style={{
                    width: "100%",
                    background: C.card2,
                    border: `1px solid ${C.border2}`,
                    color: C.text,
                    borderRadius: 9,
                    padding: "9px 11px",
                    fontSize: 12.5,
                    fontFamily: "inherit",
                    outline: "none",
                    opacity: connected ? 1 : 0.6,
                  }}
                >
                  {p.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                      {m.note ? ` — ${m.note}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`key-${p.id}`}
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: ".6px",
                    marginBottom: 4,
                  }}
                >
                  API Key{" "}
                  {connected && <span style={{ color: C.green }}>· {mask(saved!.apiKey)}</span>}
                </label>
                <input
                  id={`key-${p.id}`}
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeys((k) => ({ ...k, [p.id]: e.target.value }))}
                  placeholder={connected ? "Paste a new key to replace" : p.keyPlaceholder}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={300}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: C.card2,
                    border: `1px solid ${C.border2}`,
                    color: C.text,
                    borderRadius: 9,
                    padding: "9px 11px",
                    fontSize: 12.5,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <a
                  href={p.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 10.5,
                    color: C.blue,
                    textDecoration: "none",
                    marginTop: 4,
                    display: "inline-block",
                  }}
                >
                  Get an API key ↗
                </a>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  onClick={() => validateAndConnect(p)}
                  disabled={busy === p.id || (!keyInput.trim() && !connected)}
                  style={{
                    flex: 1,
                    minWidth: 140,
                    background:
                      busy === p.id || (!keyInput.trim() && !connected)
                        ? C.card2
                        : `linear-gradient(135deg,${C.orange},${C.purple})`,
                    color: busy === p.id || (!keyInput.trim() && !connected) ? C.dim : "#fff",
                    border: "1px solid transparent",
                    borderRadius: 9,
                    padding: "9px 12px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: busy === p.id ? "wait" : "pointer",
                  }}
                >
                  {busy === p.id ? "Working…" : "🔌 Validate & Connect"}
                </button>
                {connected && !isActive && (
                  <button
                    onClick={() => setCfg(setActiveProvider(p.id))}
                    style={{
                      background: C.card2,
                      border: `1px solid ${C.orange}66`,
                      color: C.orange,
                      borderRadius: 9,
                      padding: "9px 12px",
                      fontSize: 12.5,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    Use
                  </button>
                )}
                {isActive && (
                  <button
                    onClick={() => testActive(p)}
                    disabled={busy === p.id}
                    style={{
                      background: C.card2,
                      border: `1px solid ${C.blue}66`,
                      color: C.blue,
                      borderRadius: 9,
                      padding: "9px 12px",
                      fontSize: 12.5,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    Test
                  </button>
                )}
                {connected && (
                  <button
                    onClick={() => disconnect(p.id)}
                    style={{
                      background: "none",
                      border: `1px solid ${C.border2}`,
                      color: C.red,
                      borderRadius: 9,
                      padding: "9px 12px",
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

              <div
                role="status"
                style={{ display: "flex", alignItems: "center", gap: 7, minHeight: 18 }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: connected ? C.green : C.dim,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: st ? (st.ok ? C.green : C.red) : connected ? C.green : C.muted,
                  }}
                >
                  {st?.msg || (connected ? "● Connected" : "Not connected")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

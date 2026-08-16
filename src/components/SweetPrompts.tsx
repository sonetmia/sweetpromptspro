import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { callAIFn, callAIVisionFn } from "@/lib/ai.functions";
import { FreeApiProviders, CreatorCard } from "@/components/FreeApiProviders";

// ── User API key config (Gemini / Groq) ───────────────────────────────────────
type Provider = "lovable" | "gemini" | "groq" | "mistral";
function loadApiCfg(): { provider: Provider; key: string; model: string } {
  try {
    const raw = localStorage.getItem("sp_api_cfg");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { provider: "lovable", key: "", model: "" };
}
function saveApiCfg(c: { provider: Provider; key: string; model: string }) {
  try {
    localStorage.setItem("sp_api_cfg", JSON.stringify(c));
  } catch {}
}

async function callGemini(
  system: string,
  user: string,
  key: string,
  model: string,
  maxTokens: number,
) {
  const m = model || "gemini-2.0-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.9 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
}

async function callGroq(
  system: string,
  user: string,
  key: string,
  model: string,
  maxTokens: number,
) {
  const m = model || "llama-3.3-70b-versatile";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: m,
      max_tokens: maxTokens,
      temperature: 0.9,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "";
}

async function callMistral(
  system: string,
  user: string,
  key: string,
  model: string,
  maxTokens: number,
) {
  const m = model || "mistral-large-latest";
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: m,
      max_tokens: maxTokens,
      temperature: 0.9,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "";
}

async function callMistralVision(
  system: string,
  user: string,
  imageDataUrl: string,
  key: string,
  model: string,
  maxTokens: number,
) {
  const m = model || "pixtral-12b-2409";
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: m,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: user },
            { type: "image_url", image_url: imageDataUrl },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Mistral vision ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "";
}

async function callGeminiVision(
  system: string,
  user: string,
  imageDataUrl: string,
  key: string,
  model: string,
  maxTokens: number,
) {
  const m = model || "gemini-2.0-flash";
  const match = imageDataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) throw new Error("Invalid image data");
  const [, mime, b64] = match;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [
          {
            role: "user",
            parts: [{ text: user }, { inline_data: { mime_type: mime, data: b64 } }],
          },
        ],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini vision ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
}

// ── Microstock risk validator ─────────────────────────────────────────────────
const RISK_PATTERNS: { pattern: RegExp; category: string; reason: string }[] = [
  {
    pattern:
      /\b(nike|adidas|puma|reebok|under armour|gucci|prada|louis vuitton|chanel|hermes|rolex|ferrari|lamborghini|porsche|tesla|bmw|mercedes|audi|toyota|honda|ford)\b/gi,
    category: "Brand",
    reason: "Trademarked brand name",
  },
  {
    pattern:
      /\b(coca[- ]?cola|pepsi|starbucks|mcdonald'?s|burger king|kfc|subway|nestle|apple inc|iphone|ipad|macbook|android|samsung|google|microsoft|windows|facebook|instagram|tiktok|twitter|youtube|netflix|amazon|disney|pixar|marvel|dc comics)\b/gi,
    category: "Trademark",
    reason: "Trademarked product / company",
  },
  {
    pattern:
      /\b(mickey mouse|donald duck|spider[- ]?man|batman|superman|iron man|captain america|harry potter|hogwarts|star wars|jedi|yoda|darth vader|pokemon|pikachu|mario|zelda|sonic|barbie|hello kitty|simpsons|minions)\b/gi,
    category: "Character",
    reason: "Copyrighted character",
  },
  {
    pattern:
      /\b(eiffel tower|statue of liberty|hollywood sign|sydney opera house|big ben|burj khalifa|taj mahal|colosseum)\b/gi,
    category: "Landmark",
    reason: "Restricted landmark (editorial only)",
  },
  {
    pattern:
      /\b(face|portrait|close[- ]?up of (a )?(man|woman|person|girl|boy|child|kid)|recognizable (person|face)|celebrity|famous person)\b/gi,
    category: "Person",
    reason: "Identifiable person — needs model release",
  },
  {
    pattern: /\b(logo|brand logo|trademark|copyrighted|signature|tattoo of [a-z]+)\b/gi,
    category: "IP",
    reason: "Possible IP element",
  },
  {
    pattern: /\b(banksy|picasso|van gogh|monet|warhol|dali) style\b/gi,
    category: "Artist",
    reason: "Living/named artist style may be restricted",
  },
];

type RiskHit = { promptIndex: number; category: string; reason: string; match: string };
function validatePrompts(prompts: string[]): RiskHit[] {
  const hits: RiskHit[] = [];
  prompts.forEach((p, i) => {
    RISK_PATTERNS.forEach(({ pattern, category, reason }) => {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(p)) !== null) {
        hits.push({ promptIndex: i, category, reason, match: m[0] });
        if (!pattern.global) break;
      }
    });
  });
  return hits;
}

// ── Themes ────────────────────────────────────────────────────────────────────
const THEMES = {
  simple: {
    bg: "#ffffff",
    bgDeep: "#f7f7fa",
    nav: "#ffffff",
    card: "#f5f5f9",
    card2: "#ecedf2",
    border: "#e2e3ea",
    border2: "#d4d6df",
    orange: "#ea580c",
    orangeB: "#c2410c",
    orangeSoft: "rgba(234,88,12,.10)",
    orangeGlow: "rgba(234,88,12,.25)",
    purple: "#7c3aed",
    purpleB: "#6d28d9",
    purpleSoft: "rgba(124,58,237,.10)",
    text: "#0f172a",
    muted: "#64748b",
    dim: "#94a3b8",
    green: "#16a34a",
    red: "#dc2626",
    blue: "#2563eb",
    teal: "#0d9488",
    gold: "#d97706",
  },
  sweet: {
    bg: "#0a0a0f",
    bgDeep: "#050508",
    nav: "rgba(12,12,20,0.72)",
    card: "rgba(24,24,36,0.72)",
    card2: "rgba(32,32,48,0.85)",
    border: "rgba(255,255,255,0.08)",
    border2: "rgba(255,255,255,0.14)",
    orange: "#f5841f",
    orangeB: "#e06b0a",
    orangeSoft: "rgba(245,132,31,.12)",
    orangeGlow: "rgba(245,132,31,.35)",
    purple: "#a78bfa",
    purpleB: "#8b5cf6",
    purpleSoft: "rgba(167,139,250,.14)",
    text: "#f5f5fa",
    muted: "#a0a0b8",
    dim: "#5a5a72",
    green: "#22c55e",
    red: "#ef4444",
    blue: "#60a5fa",
    teal: "#2dd4bf",
    gold: "#fbbf24",
  },
  futuristic: {
    bg: "#05060f",
    bgDeep: "#020308",
    nav: "#0a0d1f",
    card: "#0f1430",
    card2: "#161c3f",
    border: "#243064",
    border2: "#3a4a8c",
    orange: "#00f0ff",
    orangeB: "#06b6d4",
    orangeSoft: "rgba(0,240,255,.12)",
    orangeGlow: "rgba(0,240,255,.45)",
    purple: "#ff00d4",
    purpleB: "#d100af",
    purpleSoft: "rgba(255,0,212,.14)",
    text: "#e7f0ff",
    muted: "#7c8ec7",
    dim: "#3d4a7a",
    green: "#00ffa3",
    red: "#ff3860",
    blue: "#00b3ff",
    teal: "#00ffe0",
    gold: "#ffd700",
  },
} as const;

type ThemeKey = keyof typeof THEMES;

type Theme = { [K in keyof typeof THEMES.sweet]: string };
let CURRENT: Theme = THEMES.sweet as Theme;
const C = new Proxy({} as Theme, {
  get(_, p: string) {
    return (CURRENT as any)[p];
  },
});

const COUNT_OPTIONS = [5, 10, 20, 30, 50, 100, 200];

const FONTS_LINK =
  "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Orbitron:wght@600;700;800;900&family=Rajdhani:wght@400;500;600;700&display=swap";

// ── API ───────────────────────────────────────────────────────────────────────
async function callAI(system: string, user: string, maxTokens = 1400): Promise<string> {
  const cfg = loadApiCfg();
  if (cfg.provider === "gemini" && cfg.key)
    return callGemini(system, user, cfg.key, cfg.model, maxTokens);
  if (cfg.provider === "groq" && cfg.key)
    return callGroq(system, user, cfg.key, cfg.model, maxTokens);
  if (cfg.provider === "mistral" && cfg.key)
    return callMistral(system, user, cfg.key, cfg.model, maxTokens);
  const r = await callAIFn({ data: { system, user, maxTokens } });
  return r.text;
}

async function callVisionAI(
  system: string,
  user: string,
  imageDataUrl: string,
  maxTokens = 1200,
): Promise<string> {
  const cfg = loadApiCfg();
  if (cfg.provider === "mistral" && cfg.key)
    return callMistralVision(system, user, imageDataUrl, cfg.key, cfg.model, maxTokens);
  if (cfg.provider === "gemini" && cfg.key)
    return callGeminiVision(system, user, imageDataUrl, cfg.key, cfg.model, maxTokens);
  const r = await callAIVisionFn({ data: { system, user, imageDataUrl, maxTokens } });
  return r.text;
}

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseNumbered(text: string): string[] {
  const lines = text.split("\n").filter((l) => /^\d+[\.\)]/.test(l.trim()));
  return lines.length ? lines.map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim()) : [text.trim()];
}
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
function dlTxt(arr: string[]) {
  triggerDownload(
    new Blob([arr.join("\n\n")], { type: "text/plain;charset=utf-8" }),
    "prompts.txt",
  );
}
function dlCsv(arr: string[]) {
  const rows = arr.map((p, i) => `${i + 1},"${p.replace(/"/g, '""')}"`).join("\n");
  triggerDownload(
    new Blob([`Index,Prompt\n${rows}`], { type: "text/csv;charset=utf-8" }),
    "prompts.csv",
  );
}
function copy(t: string) {
  navigator.clipboard?.writeText(t);
}
function tryLoad(k: string, d: string) {
  try {
    return localStorage.getItem(k) ?? d;
  } catch {
    return d;
  }
}
function trySave(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}

// ── Generate prompts in batches (so 200 fits) ─────────────────────────────────
async function generateLargeBatch(
  system: string,
  user: string,
  totalCount: number,
  onProgress?: (p: number) => void,
): Promise<string[]> {
  const BATCH = 20;
  const all: string[] = [];
  const batches = Math.ceil(totalCount / BATCH);
  for (let i = 0; i < batches; i++) {
    const need = Math.min(BATCH, totalCount - all.length);
    const sys = system.replace(/\{\{COUNT\}\}/g, String(need));
    const text = await callAI(sys, user, Math.min(4000, need * 120));
    const parsed = parseNumbered(text);
    all.push(...parsed.slice(0, need));
    if (onProgress) onProgress(Math.round(((i + 1) / batches) * 100));
    if (all.length >= totalCount) break;
  }
  return all.slice(0, totalCount);
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const ss = {
  label: {
    display: "block",
    fontSize: 11,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: ".8px",
    fontWeight: 600,
  },
};

function Spin({ s = 14, c = "#fff" }: { s?: number; c?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: s,
        height: s,
        borderRadius: "50%",
        border: `2px solid ${c}44`,
        borderTopColor: c,
        animation: "sp .65s linear infinite",
      }}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ ...ss.label, color: C.muted }}>{children}</label>;
}

function Sel(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        background: C.card2,
        border: `1px solid ${C.border2}`,
        color: C.text,
        borderRadius: 9,
        padding: "10px 13px",
        fontSize: 13,
        outline: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        width: "100%",
        ...props.style,
      }}
    />
  );
}

function Txt({ label, value, onChange, placeholder, rows = 4 }: any) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <Label>{label}</Label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        style={{
          width: "100%",
          background: C.card2,
          border: `1px solid ${f ? C.orange + "99" : C.border2}`,
          borderRadius: 10,
          padding: "11px 14px",
          color: C.text,
          fontSize: 13.5,
          fontFamily: "inherit",
          resize: "vertical",
          outline: "none",
          lineHeight: 1.7,
          transition: "border-color .18s",
          boxSizing: "border-box",
          boxShadow: f ? `0 0 0 3px ${C.orange}18` : "none",
        }}
      />
    </div>
  );
}

function Inp({ label, value, onChange, placeholder, type = "text" }: any) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <Label>{label}</Label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        style={{
          background: C.card2,
          border: `1px solid ${f ? C.orange + "99" : C.border2}`,
          color: C.text,
          borderRadius: 9,
          padding: "10px 13px",
          fontSize: 13,
          outline: "none",
          fontFamily: "inherit",
          width: "100%",
          boxSizing: "border-box",
          boxShadow: f ? `0 0 0 3px ${C.orange}18` : "none",
        }}
      />
    </div>
  );
}

function Btn({ onClick, loading, disabled, label, color }: any) {
  const bg = color || C.orange;
  const off = loading || disabled;
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={off}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: off
          ? "rgba(255,255,255,0.06)"
          : `linear-gradient(180deg, ${bg} 0%, ${bg}dd 100%)`,
        color: off ? C.dim : "#fff",
        border: off ? `1px solid ${C.border2}` : `1px solid ${bg}`,
        borderRadius: 11,
        padding: "12px 26px",
        fontSize: 14,
        fontWeight: 700,
        cursor: off ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        boxShadow: off ? "none" : `0 6px 22px ${bg}44, inset 0 1px 0 rgba(255,255,255,0.22)`,
        letterSpacing: ".2px",
        transform: hover && !off ? "translateY(-1px)" : "none",
      }}
    >
      {loading ? (
        <>
          <Spin /> Processing…
        </>
      ) : (
        label
      )}
    </button>
  );
}

function Card({
  text,
  index,
  total,
  badge,
}: {
  text: string;
  index: number;
  total: number;
  badge?: string;
}) {
  const [c, setC] = useState(false);
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.card,
        border: `1px solid ${hover ? C.orange + "55" : C.border2}`,
        borderRadius: 14,
        padding: "16px 18px",
        marginBottom: 10,
        position: "relative",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: hover
          ? `0 8px 30px -12px ${C.orangeGlow}`
          : "0 1px 0 rgba(255,255,255,0.03) inset",
      }}
    >
      {(total > 1 || badge) && (
        <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
          {total > 1 && (
            <span
              style={{
                fontSize: 10,
                color: C.orange,
                fontWeight: 700,
                background: C.orangeSoft,
                border: `1px solid ${C.orange}33`,
                borderRadius: 6,
                padding: "1px 8px",
              }}
            >
              #{index + 1}
            </span>
          )}
          {badge && (
            <span
              style={{
                fontSize: 10,
                color: C.teal,
                fontWeight: 700,
                background: "rgba(45,212,191,.12)",
                border: "1px solid rgba(45,212,191,.25)",
                borderRadius: 6,
                padding: "1px 8px",
                textTransform: "uppercase",
              }}
            >
              {badge}
            </span>
          )}
        </div>
      )}
      <p
        style={{
          fontSize: 13.5,
          lineHeight: 1.75,
          color: C.text,
          paddingRight: 82,
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </p>
      <button
        onClick={() => {
          copy(text);
          setC(true);
          setTimeout(() => setC(false), 1500);
        }}
        style={{
          position: "absolute",
          top: 13,
          right: 13,
          background: c ? "rgba(34,197,94,.15)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${c ? "rgba(34,197,94,.4)" : C.border2}`,
          color: c ? C.green : C.muted,
          borderRadius: 8,
          padding: "4px 11px",
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "inherit",
          backdropFilter: "blur(6px)",
        }}
      >
        {c ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}

function ExportBar({ prompts }: { prompts: string[] }) {
  const [modal, setModal] = useState<{ hits: RiskHit[]; format: "txt" | "csv" } | null>(null);
  if (!prompts.length) return null;
  const hits = validatePrompts(prompts);
  const risky = hits.length > 0;
  const doDownload = (fmt: "txt" | "csv") => {
    if (risky) {
      setModal({ hits, format: fmt });
      return;
    }
    fmt === "txt" ? dlTxt(prompts) : dlCsv(prompts);
  };
  const confirmDl = () => {
    if (modal) {
      modal.format === "txt" ? dlTxt(prompts) : dlCsv(prompts);
      setModal(null);
    }
  };
  const riskySet = new Set(hits.map((h) => h.promptIndex));
  const cleaned = prompts.filter((_, i) => !riskySet.has(i));
  const downloadCleaned = (fmt: "txt" | "csv") => {
    fmt === "txt" ? dlTxt(cleaned) : dlCsv(cleaned);
    setModal(null);
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "12px 0 8px",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: C.muted,
          background: C.card2,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: "2px 10px",
        }}
      >
        {prompts.length} result{prompts.length !== 1 ? "s" : ""}
      </span>
      {risky && (
        <span
          style={{
            fontSize: 11,
            color: C.red,
            background: "rgba(239,68,68,.1)",
            border: "1px solid rgba(239,68,68,.35)",
            borderRadius: 20,
            padding: "2px 10px",
            fontWeight: 600,
          }}
        >
          ⚠ {hits.length} risk{hits.length !== 1 ? "s" : ""}
        </span>
      )}
      <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
        <button
          onClick={() => doDownload("txt")}
          style={{
            background: "none",
            border: `1px solid ${C.border2}`,
            color: C.muted,
            borderRadius: 7,
            padding: "5px 12px",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ↓ TXT
        </button>
        <button
          onClick={() => doDownload("csv")}
          style={{
            background: "none",
            border: `1px solid ${C.border2}`,
            color: C.muted,
            borderRadius: 7,
            padding: "5px 12px",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ↓ CSV
        </button>
        <button
          onClick={() => copy(prompts.join("\n\n---\n\n"))}
          style={{
            background: "none",
            border: `1px solid ${C.border2}`,
            color: C.muted,
            borderRadius: 7,
            padding: "5px 12px",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ⧉ Copy All
        </button>
      </div>
      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.7)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card,
              border: `1px solid ${C.border2}`,
              borderRadius: 16,
              padding: 24,
              maxWidth: 600,
              width: "100%",
              maxHeight: "85vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: C.red,
                marginBottom: 6,
                fontFamily: "var(--display)",
              }}
            >
              ⚠ Microstock Risk Check
            </div>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>
              {modal.hits.length} potential rejection risk{modal.hits.length !== 1 ? "s" : ""} found
              in {new Set(modal.hits.map((h) => h.promptIndex)).size} prompt
              {new Set(modal.hits.map((h) => h.promptIndex)).size !== 1 ? "s" : ""}. Review before
              submitting to Adobe Stock / Shutterstock.
            </p>
            <div
              style={{
                maxHeight: 320,
                overflow: "auto",
                marginBottom: 16,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
              }}
            >
              {modal.hits.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    borderBottom: i < modal.hits.length - 1 ? `1px solid ${C.border}` : "none",
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.red,
                        background: "rgba(239,68,68,.12)",
                        borderRadius: 5,
                        padding: "1px 7px",
                      }}
                    >
                      #{h.promptIndex + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.orange,
                        background: C.orangeSoft,
                        borderRadius: 5,
                        padding: "1px 7px",
                      }}
                    >
                      {h.category}
                    </span>
                    <span style={{ fontSize: 11, color: C.muted }}>"{h.match}"</span>
                  </div>
                  <div style={{ color: C.muted, fontSize: 11.5 }}>{h.reason}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                onClick={() => setModal(null)}
                style={{
                  background: "none",
                  border: `1px solid ${C.border2}`,
                  color: C.muted,
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              {cleaned.length > 0 && cleaned.length < prompts.length && (
                <button
                  onClick={() => downloadCleaned(modal.format)}
                  style={{
                    background: C.green,
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  ✓ Download {cleaned.length} Safe Only
                </button>
              )}
              <button
                onClick={confirmDl}
                style={{
                  background: C.red,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ↓ Download All Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div
      style={{
        background: "rgba(239,68,68,.1)",
        border: "1px solid rgba(239,68,68,.3)",
        borderRadius: 9,
        padding: "10px 14px",
        marginTop: 12,
      }}
    >
      <p style={{ color: C.red, fontSize: 12.5, lineHeight: 1.55 }}>⚠ {msg}</p>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px" }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span
        style={{
          fontSize: 10,
          color: C.muted,
          letterSpacing: "1px",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function Chip({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? C.orangeSoft : C.card2,
        border: `1px solid ${active ? C.orange + "66" : C.border}`,
        color: active ? C.orange : C.muted,
        borderRadius: 20,
        padding: "5px 14px",
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit",
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.muted }}>Generating…</span>
        <span style={{ fontSize: 12, color: C.orange, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: C.card2, borderRadius: 6 }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: `linear-gradient(to right,${C.orange},${C.purple})`,
            borderRadius: 6,
            transition: "width .4s",
          }}
        />
      </div>
    </div>
  );
}

// ── Generic single-input generator ────────────────────────────────────────────
function makeGenerator(opts: {
  buildSystem: (count: number, extra: Record<string, string>) => string;
  fields?: { key: string; label: string; opts: string[] }[];
  inputLabel: string;
  inputPlaceholder: string;
  rows?: number;
  defaultExtra?: Record<string, string>;
  badge?: string;
  intro?: { title: string; desc: string; color?: string };
  buttonLabel: string;
  color?: string;
}) {
  return function GenericGen() {
    const [input, setInput] = useState("");
    const [count, setCount] = useState(10);
    const [extra, setExtra] = useState<Record<string, string>>(opts.defaultExtra || {});
    const [results, setResults] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [progress, setProgress] = useState(0);

    async function run() {
      if (!input.trim()) return;
      setLoading(true);
      setErr("");
      setResults([]);
      setProgress(0);
      try {
        const out = await generateLargeBatch(
          opts.buildSystem(count, extra),
          input,
          count,
          setProgress,
        );
        setResults(out);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }

    return (
      <div>
        {opts.intro && (
          <div
            style={{
              background: `${opts.intro.color || C.orange}12`,
              border: `1px solid ${opts.intro.color || C.orange}33`,
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: opts.intro.color || C.orange,
                marginBottom: 4,
              }}
            >
              {opts.intro.title}
            </div>
            <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>{opts.intro.desc}</p>
          </div>
        )}
        <Txt
          label={opts.inputLabel}
          value={input}
          onChange={setInput}
          placeholder={opts.inputPlaceholder}
          rows={opts.rows || 3}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div>
            <Label>Count</Label>
            <Sel value={count} onChange={(e) => setCount(+e.target.value)}>
              {COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Sel>
          </div>
          {(opts.fields || []).map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <Sel
                value={extra[f.key] || f.opts[0]}
                onChange={(e) => setExtra((p) => ({ ...p, [f.key]: e.target.value }))}
              >
                {f.opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Sel>
            </div>
          ))}
        </div>
        <Btn
          onClick={run}
          loading={loading}
          disabled={!input.trim()}
          label={opts.buttonLabel}
          color={opts.color}
        />
        {loading && <ProgressBar value={progress} />}
        <Err msg={err} />
        {results.length > 0 && (
          <>
            <ExportBar prompts={results} />
            {results.map((r, i) => (
              <Card key={i} text={r} index={i} total={results.length} badge={opts.badge} />
            ))}
          </>
        )}
      </div>
    );
  };
}

// ── Tools ─────────────────────────────────────────────────────────────────────
const BulkGenerator = function () {
  const [batchInput, setBatchInput] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [platform, setPlatform] = useState("Midjourney");
  const [count, setCount] = useState(5);
  const [results, setResults] = useState<{ subject: string; prompts: string[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState(0);

  const subjects = batchInput
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  async function run() {
    if (!subjects.length) return;
    setLoading(true);
    setErr("");
    setResults([]);
    setProgress(0);
    const all: { subject: string; prompts: string[] }[] = [];
    try {
      for (let i = 0; i < subjects.length; i++) {
        const prompts = await generateLargeBatch(
          `Expert AI image prompt generator for ${platform}. Generate exactly {{COUNT}} distinct, commercially viable, microstock-ready prompts. Style: ${style}. Adobe Stock compliant — no copyrighted content, no identifiable people. Return ONLY numbered prompts.`,
          subjects[i],
          count,
          (p) => setProgress(Math.round(((i + p / 100) / subjects.length) * 100)),
        );
        all.push({ subject: subjects[i], prompts });
      }
      setResults(all);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const all = results.flatMap((r) => r.prompts);
  return (
    <div>
      <div
        style={{
          background: `linear-gradient(135deg,${C.orange}18,${C.purple}18)`,
          border: `1px solid ${C.orange}33`,
          borderRadius: 14,
          padding: "20px 22px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontFamily: "var(--display)",
            fontSize: 15,
            fontWeight: 700,
            color: C.text,
            marginBottom: 6,
          }}
        >
          ⚡ Bulk Image Prompt Generator
        </div>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>
          Enter subjects (one per line) and generate multiple AI prompts for each.
        </p>
      </div>
      <Txt
        label="Enter Subjects (one per line)"
        value={batchInput}
        onChange={setBatchInput}
        placeholder="business team meeting&#10;sunset beach&#10;coffee shop interior"
        rows={8}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div>
          <Label>Art Style</Label>
          <Sel value={style} onChange={(e) => setStyle(e.target.value)}>
            {[
              "photorealistic",
              "cinematic",
              "illustration",
              "digital art",
              "oil painting",
              "watercolor",
              "3D render",
              "concept art",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Sel>
        </div>
        <div>
          <Label>Platform</Label>
          <Sel value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {["Midjourney", "DALL-E 3", "Stable Diffusion", "Firefly", "Leonardo AI"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Sel>
        </div>
        <div>
          <Label>Prompts per Subject</Label>
          <Sel value={count} onChange={(e) => setCount(+e.target.value)}>
            {COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Sel>
        </div>
      </div>
      {subjects.length > 0 && (
        <div
          style={{
            background: C.card2,
            border: `1px solid ${C.border}`,
            borderRadius: 9,
            padding: "9px 14px",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} queued
          </div>
          <div style={{ fontSize: 11.5, color: C.muted }}>
            Will generate ~{subjects.length * count} prompts
          </div>
        </div>
      )}
      <Btn
        onClick={run}
        loading={loading}
        disabled={!subjects.length}
        label={`⚡ Generate ${subjects.length * count || ""} Prompts`}
      />
      {loading && <ProgressBar value={progress} />}
      <Err msg={err} />
      {results.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <ExportBar prompts={all} />
          {results.map((r, gi) => (
            <div key={gi} style={{ marginBottom: 20 }}>
              <Divider label={`Subject: ${r.subject}`} />
              {r.prompts.map((p, i) => (
                <Card key={i} text={p} index={i} total={r.prompts.length} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const IdeaGenerator = makeGenerator({
  inputLabel: "Your Concept or Idea",
  inputPlaceholder: "e.g. A futuristic city at sunset, cozy magical library…",
  buttonLabel: "💡 Generate From Ideas",
  color: undefined,
  defaultExtra: { style: "photorealistic", mood: "any" },
  fields: [
    {
      key: "style",
      label: "Art Style",
      opts: [
        "photorealistic",
        "cinematic",
        "digital art",
        "oil painting",
        "watercolor",
        "3D render",
        "anime",
        "illustration",
        "concept art",
        "sketch",
      ],
    },
    {
      key: "mood",
      label: "Mood",
      opts: [
        "any",
        "dramatic",
        "serene",
        "melancholic",
        "joyful",
        "mysterious",
        "epic",
        "romantic",
        "eerie",
        "playful",
      ],
    },
  ],
  buildSystem: (count, extra) =>
    `Expert AI image prompt generator for Adobe Stock. Generate exactly {{COUNT}} distinct microstock prompts. Style: ${extra.style}. Mood: ${extra.mood === "any" ? "varied" : extra.mood}. Each 2-4 sentences with visual detail, lighting, composition. No copyrighted content. Return ONLY numbered prompts.`,
});

const JPGCreator = makeGenerator({
  intro: {
    title: "📷 JPG Creator (Microstock)",
    desc: "Optimized JPG photo prompts: real-world scenes, commercial appeal, royalty-free.",
    color: undefined,
  },
  inputLabel: "Topic / Subject",
  inputPlaceholder: "lifestyle, business, food, travel, fitness…",
  buttonLabel: "📷 Generate JPG Prompts",
  defaultExtra: { orientation: "landscape", lighting: "natural daylight", market: "Adobe Stock" },
  fields: [
    { key: "orientation", label: "Orientation", opts: ["landscape", "portrait", "square 1:1"] },
    {
      key: "lighting",
      label: "Lighting",
      opts: [
        "natural daylight",
        "golden hour",
        "studio softbox",
        "overcast",
        "blue hour",
        "indoor window light",
      ],
    },
    {
      key: "market",
      label: "Marketplace",
      opts: ["Adobe Stock", "Shutterstock", "Getty", "iStock", "Alamy"],
    },
  ],
  buildSystem: (count, extra) =>
    `Expert microstock photographer for ${extra.market}. Generate exactly {{COUNT}} commercially viable JPG photo prompts. Each prompt must specify: photorealistic high-resolution JPG, ${extra.orientation} orientation, ${extra.lighting}, sharp focus, professional composition, shallow DOF when relevant, lens (35mm/50mm/85mm), color grading. Strictly NO logos, brands, celebrities, watermarks, copyrighted content, recognizable faces. Suitable for ${extra.market} royalty-free licensing. Return ONLY numbered prompts.`,
  badge: "JPG",
});

const PNGCreator = makeGenerator({
  intro: {
    title: "🟦 PNG Creator (Transparent Microstock)",
    desc: "Clean PNG prompts with transparent backgrounds — icons, cutouts, stickers, design assets.",
    color: undefined,
  },
  inputLabel: "Subject / Asset",
  inputPlaceholder: "coffee cup, leaf, abstract shape, business icon…",
  buttonLabel: "🟦 Generate PNG Prompts",
  defaultExtra: { style: "flat vector", usage: "design asset", bg: "transparent" },
  fields: [
    {
      key: "style",
      label: "Style",
      opts: [
        "flat vector",
        "3D render",
        "isometric",
        "watercolor cutout",
        "line art",
        "sticker",
        "clay 3D",
        "paper cut",
      ],
    },
    {
      key: "usage",
      label: "Usage",
      opts: ["design asset", "icon", "sticker", "illustration", "logo element", "UI graphic"],
    },
    {
      key: "bg",
      label: "Background",
      opts: ["transparent", "pure white removable", "alpha channel"],
    },
  ],
  buildSystem: (count, extra) =>
    `Expert microstock illustrator. Generate exactly {{COUNT}} PNG asset prompts. Each must specify: ${extra.style}, ${extra.usage}, isolated on ${extra.bg} background, clean edges suitable for alpha cutout, no shadows touching edges, vector-clean composition, commercial royalty-free quality for Adobe Stock / Shutterstock. NO copyrighted IP, NO faces, NO brands. Output should be PNG-ready with transparency. Return ONLY numbered prompts.`,
  badge: "PNG",
});

const SilhouetteFinder = makeGenerator({
  intro: {
    title: "🎯 Silhouette Finder",
    desc: "Clean silhouette prompts optimized for stock, logos, icons.",
    color: undefined,
  },
  inputLabel: "Subject / Object",
  inputPlaceholder: "flying eagle, running horse, yoga woman…",
  buttonLabel: "🔍 Find Silhouette Prompts",
  defaultExtra: { style: "clean vector", bg: "pure white" },
  fields: [
    {
      key: "bg",
      label: "Background",
      opts: ["pure white", "transparent", "light gray", "cream white"],
    },
    {
      key: "style",
      label: "Style",
      opts: [
        "clean vector",
        "flat design",
        "detailed illustration",
        "minimalist",
        "geometric",
        "bold graphic",
      ],
    },
  ],
  buildSystem: (count, extra) =>
    `Generate exactly {{COUNT}} AI image prompts for isolated silhouette images. Background: ${extra.bg}. Style: ${extra.style}. Each prompt: solid black fill, no shadows, no gradients, clean cutout, "isolated on white background", Adobe Stock royalty-free. Return ONLY numbered prompts.`,
  badge: "silhouette",
});

const PromptVariations = makeGenerator({
  inputLabel: "Base Prompt",
  inputPlaceholder: "Enter the prompt to create variations of…",
  buttonLabel: "🔀 Generate Variations",
  defaultExtra: { mode: "mixed" },
  fields: [
    {
      key: "mode",
      label: "Variation Type",
      opts: ["mixed", "style", "mood", "composition", "era", "color"],
    },
  ],
  buildSystem: (_c, extra) => {
    const modes: any = {
      style: "vary art style/medium dramatically",
      mood: "vary mood/time/atmosphere",
      composition: "vary camera angle/framing",
      era: "vary historical period",
      color: "vary color palette",
      mixed: "vary style, mood, lighting, composition",
    };
    return `Create exactly {{COUNT}} distinct variations. Variation type: ${modes[extra.mode]}. Keep core subject. Return ONLY numbered variations.`;
  },
});

// Improver / Expander / Fixer / Translator / Brainstormer (single output)
function PromptImprover() {
  const [prompt, setPrompt] = useState("");
  const [focus, setFocus] = useState("all");
  const [result, setResult] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  async function run() {
    if (!prompt.trim()) return;
    setLoading(true);
    setErr("");
    setResult("");
    setAnalysis("");
    try {
      const text = await callAI(
        `Expert AI prompt engineer. Improve the prompt, focus: ${focus === "all" ? "lighting, composition, style, mood, technical details" : focus}. Respond EXACTLY:\nANALYSIS: [2-3 sentences on weaknesses]\nIMPROVED: [full improved prompt]`,
        prompt,
      );
      const a = text.match(/ANALYSIS:\s*(.*?)(?=IMPROVED:|$)/s);
      const b = text.match(/IMPROVED:\s*(.*)/s);
      setAnalysis(a?.[1]?.trim() || "");
      setResult(b?.[1]?.trim() || text.trim());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <Txt
        label="Original Prompt"
        value={prompt}
        onChange={setPrompt}
        placeholder="Paste your existing prompt…"
        rows={4}
      />
      <div style={{ marginBottom: 16 }}>
        <Label>Improvement Focus</Label>
        <Sel value={focus} onChange={(e) => setFocus(e.target.value)}>
          {[
            ["all", "All Aspects"],
            ["lighting", "Lighting"],
            ["composition", "Composition"],
            ["style", "Style"],
            ["mood", "Mood"],
            ["technical", "Technical"],
            ["color", "Color"],
          ].map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Sel>
      </div>
      <Btn onClick={run} loading={loading} disabled={!prompt.trim()} label="⚡ Improve Prompt" />
      <Err msg={err} />
      {analysis && (
        <div
          style={{
            background: `${C.blue}12`,
            border: `1px solid ${C.blue}30`,
            borderRadius: 10,
            padding: "12px 15px",
            marginTop: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: C.blue,
              textTransform: "uppercase",
              marginBottom: 5,
              fontWeight: 700,
            }}
          >
            Analysis
          </div>
          <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65 }}>{analysis}</p>
        </div>
      )}
      {result && (
        <>
          <Divider label="Improved Prompt" />
          <Card text={result} index={0} total={1} />
          <ExportBar prompts={[result]} />
        </>
      )}
    </div>
  );
}

function PromptExpander() {
  const [prompt, setPrompt] = useState("");
  const [depth, setDepth] = useState("detailed");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  async function run() {
    if (!prompt.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const depths: any = {
        brief: "2-3 sentences",
        detailed: "4-6 sentences rich with detail",
        cinematic: "full paragraph as movie scene",
        technical: "full technical specs: lens mm, aperture, ISO",
      };
      const text = await callAI(
        `Expand into vivid AI image prompt. Depth: ${depths[depth]}. Return ONLY the expanded prompt.`,
        prompt,
      );
      setResult(text.trim());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <Txt
        label="Short Idea / Prompt"
        value={prompt}
        onChange={setPrompt}
        placeholder="e.g. 'cat in space'"
        rows={2}
      />
      <div style={{ marginBottom: 16 }}>
        <Label>Expansion Depth</Label>
        <Sel value={depth} onChange={(e) => setDepth(e.target.value)}>
          {[
            ["brief", "Brief"],
            ["detailed", "Detailed"],
            ["cinematic", "Cinematic"],
            ["technical", "Technical Specs"],
          ].map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Sel>
      </div>
      <Btn onClick={run} loading={loading} disabled={!prompt.trim()} label="📝 Expand Prompt" />
      <Err msg={err} />
      {result && (
        <>
          <Divider label="Expanded Prompt" />
          <Card text={result} index={0} total={1} />
          <ExportBar prompts={[result]} />
        </>
      )}
    </div>
  );
}

function PromptFixer() {
  const [prompt, setPrompt] = useState("");
  const [issue, setIssue] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  async function run() {
    if (!prompt.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const text = await callAI(
        `Analyze and fix all issues. Respond EXACTLY:\nISSUES FOUND: [bullet list]\nFIXED PROMPT: [repaired prompt]`,
        issue.trim() ? `Prompt: ${prompt}\nIssue: ${issue}` : prompt,
      );
      setResult(text.trim());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <Txt
        label="Prompt to Fix"
        value={prompt}
        onChange={setPrompt}
        placeholder="Paste a problematic prompt…"
        rows={4}
      />
      <Txt
        label="Describe Problem (optional)"
        value={issue}
        onChange={setIssue}
        placeholder="e.g. too generic…"
        rows={2}
      />
      <Btn onClick={run} loading={loading} disabled={!prompt.trim()} label="🛠 Fix Prompt" />
      <Err msg={err} />
      {result && (
        <>
          <Divider label="Diagnosis & Fix" />
          <Card text={result} index={0} total={1} />
        </>
      )}
    </div>
  );
}

function PromptTranslator() {
  const [prompt, setPrompt] = useState("");
  const [lang, setLang] = useState("Spanish");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  async function run() {
    if (!prompt.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const text = await callAI(
        `Translate this AI image prompt into ${lang}. Keep technical terms (bokeh, HDR, f/1.8) in English. Return ONLY the translated prompt.`,
        prompt,
      );
      setResult(text.trim());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <Txt
        label="Prompt to Translate"
        value={prompt}
        onChange={setPrompt}
        placeholder="Enter your English prompt…"
        rows={4}
      />
      <div style={{ marginBottom: 16 }}>
        <Label>Target Language</Label>
        <Sel value={lang} onChange={(e) => setLang(e.target.value)}>
          {[
            "Spanish",
            "French",
            "German",
            "Japanese",
            "Portuguese",
            "Italian",
            "Chinese",
            "Korean",
            "Arabic",
            "Hindi",
            "Russian",
            "Turkish",
            "Bengali",
          ].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </Sel>
      </div>
      <Btn onClick={run} loading={loading} disabled={!prompt.trim()} label="🌐 Translate" />
      <Err msg={err} />
      {result && (
        <>
          <Divider label={`Translated (${lang})`} />
          <Card text={result} index={0} total={1} />
          <ExportBar prompts={[result]} />
        </>
      )}
    </div>
  );
}

function Brainstormer() {
  const [theme, setTheme] = useState("");
  const [angle, setAngle] = useState("unexpected");
  const [count, setCount] = useState(10);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState(0);
  async function run() {
    if (!theme.trim()) return;
    setLoading(true);
    setErr("");
    setProgress(0);
    try {
      const angles: any = {
        unexpected: "go beyond obvious",
        emotional: "focus on emotion",
        abstract: "abstract/symbolic",
        narrative: "imply backstory",
        technical: "technical excellence",
      };
      const out = await generateLargeBatch(
        `Generate exactly {{COUNT}} diverse creative concept directions. Approach: ${angles[angle]}. Each: vivid 2-3 sentence creative concept. Return ONLY numbered ideas.`,
        theme,
        count,
        setProgress,
      );
      setResults(out);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <Txt
        label="Theme or Subject"
        value={theme}
        onChange={setTheme}
        placeholder="'solitude', 'ancient technology'…"
        rows={2}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div>
          <Label>Creative Angle</Label>
          <Sel value={angle} onChange={(e) => setAngle(e.target.value)}>
            {[
              ["unexpected", "🎲 Unexpected"],
              ["emotional", "❤️ Emotional"],
              ["abstract", "🌀 Abstract"],
              ["narrative", "📖 Narrative"],
              ["technical", "🎯 Technical"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Sel>
        </div>
        <div>
          <Label>Count</Label>
          <Sel value={count} onChange={(e) => setCount(+e.target.value)}>
            {COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Sel>
        </div>
      </div>
      <Btn onClick={run} loading={loading} disabled={!theme.trim()} label="🧠 Brainstorm Ideas" />
      {loading && <ProgressBar value={progress} />}
      <Err msg={err} />
      {results.length > 0 && (
        <>
          <ExportBar prompts={results} />
          {results.map((r, i) => (
            <Card key={i} text={r} index={i} total={results.length} />
          ))}
        </>
      )}
    </div>
  );
}

// ── Library ───────────────────────────────────────────────────────────────────
const LIBRARY_GROUPS: Record<string, Record<string, string[]>> = {
  "Trending Now": {
    "Trending Concepts": [
      "Minimal AI data-center aesthetic, glowing server racks, cool blue rim light, ultra clean composition, tech editorial stock photo",
      "Quiet luxury flat lay, beige linen, ceramic mug, dried pampas grass, soft window light, neutral palette, lifestyle stock",
      "Retro-futuristic Y2K chrome shapes floating on gradient backdrop, glossy 3D render, vibrant, design asset",
    ],
    "Trending Business": [
      "Remote freelancer working from sunlit balcony, laptop and coffee, candid lifestyle, natural light, copy space",
      "Small business owner packing eco-friendly parcels in bright studio, warm daylight, authentic commerce stock",
    ],
    "Trending AI & Tech": [
      "Abstract neural network of glowing nodes on deep navy, depth of field, futuristic technology background, copy space",
      "Person using AR glasses in modern loft, soft holographic UI reflections, cinematic teal lighting",
    ],
  },
  Seasonal: {
    Spring: [
      "Cherry blossom branches against pale blue sky, soft bokeh, fresh spring mood, natural light, stock photo",
      "Fresh spring vegetables on rustic wood table, overhead flat lay, airy daylight, food stock",
    ],
    Summer: [
      "Turquoise tropical beach with palm shade, top-down drone view, vivid summer colors, travel stock",
      "Cold lemonade with condensation and mint on sunlit table, shallow depth of field, summer refreshment",
    ],
    Autumn: [
      "Golden maple leaves scattered on wet cobblestone, warm autumn palette, moody overcast light",
      "Pumpkin spice latte on knitted blanket, cozy autumn flat lay, warm tones, copy space",
    ],
    Winter: [
      "Snow-covered pine forest at blue hour, soft falling snow, minimal winter landscape, wide angle",
      "Steaming cocoa mug by frosted window, warm indoor glow, cozy winter still life",
    ],
  },
  "Occasions & Holidays": {
    "Christmas & New Year": [
      "Elegant Christmas table setting, evergreen sprigs, gold candles, warm bokeh lights, festive stock photo",
      "Gold confetti and champagne flutes on dark background, New Year celebration, transparent-ready isolated elements",
    ],
    "Valentine's Day": [
      "Red rose petals and heart-shaped candles on marble, soft romantic light, Valentine flat lay",
      "Isolated 3D glossy red heart on transparent background, clean alpha edges, PNG design asset",
    ],
    "Ramadan & Eid": [
      "Crescent moon and lantern silhouettes on deep indigo night sky, elegant minimal Ramadan design, copy space",
      "Traditional dates and Arabic coffee pot on brass tray, warm lantern light, Eid celebration still life",
    ],
    "Birthdays & Weddings": [
      "Pastel birthday balloons isolated on transparent background, clean vector style, party design asset",
      "Bridal bouquet of white peonies held in soft daylight, shallow depth of field, wedding stock photo",
    ],
    "Halloween & Thanksgiving": [
      "Carved pumpkin silhouettes on dark misty background, moody Halloween atmosphere, cinematic",
      "Thanksgiving harvest table with roasted vegetables, warm candlelight, overhead lifestyle stock",
    ],
  },
  "Microstock Core": {
    "Microstock JPG": [
      "Professional businesswoman in modern glass office, confident posture, laptop open, natural window light, neutral background, photorealistic, 50mm lens, shallow DOF, Adobe Stock",
      "Fresh avocado toast on white ceramic plate, overhead flat lay, natural daylight, marble surface, food photography, sharp focus",
      "Diverse remote team video conference, modern home office, plants, soft daylight, lifestyle stock, candid feel",
    ],
    "Microstock PNG (Transparent)": [
      "Hot coffee cup with rising steam, isolated on transparent background, soft realistic 3D render, clean alpha edges, no shadow, PNG asset",
      "Cluster of fresh basil leaves, transparent background, watercolor cutout style, vibrant green, design asset",
      "Modern flat icon set: rocket, gear, lightbulb, vector style, isolated transparent background, vibrant gradient, royalty-free",
    ],
    "Silhouette & Isolated": [
      "Silhouette of soaring eagle on pure white, flat black fill, clean vector style, no shadows, stock photo quality",
      "Black silhouette of running wolf in profile, white background, minimalist, professional stock illustration",
      "City skyline silhouette, dark fill, isolated on pure white, clean vector graphic",
    ],
    "Landscapes & Nature": [
      "Bioluminescent cave with glowing blue underground pool, stalactites reflected in still water, 14mm ultra-wide, long exposure",
      "Ancient autumn forest path carpeted with golden leaves, low fog between oaks, impressionist",
      "Aerial Bolivian salt flats at sunset, mirror reflection of clouds, vivid orange purple palette",
    ],
    "Sci-Fi & Fantasy": [
      "Ancient library inside hollowed Sequoia, warm amber lantern light, thousands of leather books, floating dust motes",
      "Cyberpunk night market Neo-Tokyo 2099, neon reflections on wet cobblestones, hovercars, holographic menus",
    ],
  },
  "Business & Marketing": {
    Corporate: [
      "Diverse leadership team in bright boardroom reviewing charts, natural light, authentic corporate stock, copy space",
      "Modern office desk with laptop, notebook and coffee, top-down flat lay, clean neutral background",
    ],
    "E-commerce": [
      "Product packaging mockup on soft gradient backdrop, studio lighting, isolated commercial shot",
      "Online shopping cart icon set, flat vector, transparent background, vibrant gradient, design asset",
    ],
  },
  "Nature & Travel": {
    Landscapes: [
      "Misty mountain ridges at sunrise, layered depth, aerial perspective, minimal travel landscape",
      "Desert dunes with long shadows at golden hour, wide-angle, rich warm tones",
    ],
    "Wildlife & Plants": [
      "Hummingbird hovering near tropical flower, high-speed capture, clean bokeh background",
      "Monstera leaf close-up on plain pastel background, soft daylight, botanical minimal stock",
    ],
  },
};

function PromptLibrary() {
  const [copied, setCopied] = useState<string | null>(null);
  const [group, setGroup] = useState<string>(Object.keys(LIBRARY_GROUPS)[0]);
  const [cat, setCat] = useState<string | null>(null);
  const groups = Object.keys(LIBRARY_GROUPS);
  const lib = LIBRARY_GROUPS[group] || {};
  const cats = Object.keys(lib);
  const filtered: Record<string, string[]> = cat && lib[cat] ? { [cat]: lib[cat] } : lib;
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "1.1px",
          color: C.muted,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Main reference
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {groups.map((g) => (
          <Chip
            key={g}
            label={g}
            active={group === g}
            onClick={() => {
              setGroup(g);
              setCat(null);
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "1.1px",
          color: C.muted,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Category
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
        <Chip label="All" active={!cat} onClick={() => setCat(null)} />
        {cats.map((c) => (
          <Chip key={c} label={c} active={cat === c} onClick={() => setCat(cat === c ? null : c)} />
        ))}
      </div>
      {Object.entries(filtered).map(([c, prompts]) => (
        <div key={c} style={{ marginBottom: 26 }}>
          <h3
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "1.1px",
              color: C.muted,
              marginBottom: 10,
              fontWeight: 700,
            }}
          >
            {c}
          </h3>
          {prompts.map((p: string, i: number) => {
            const k = `${c}-${i}`;
            return (
              <div
                key={i}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border2}`,
                  borderRadius: 10,
                  padding: "13px 15px",
                  marginBottom: 8,
                  position: "relative",
                }}
              >
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.68, paddingRight: 75 }}>
                  {p}
                </p>
                <button
                  onClick={() => {
                    copy(p);
                    setCopied(k);
                    setTimeout(() => setCopied(null), 1500);
                  }}
                  style={{
                    position: "absolute",
                    top: 11,
                    right: 11,
                    background: copied === k ? "rgba(34,197,94,.12)" : C.card2,
                    border: `1px solid ${copied === k ? "rgba(34,197,94,.4)" : C.border2}`,
                    color: copied === k ? C.green : C.muted,
                    borderRadius: 7,
                    padding: "4px 11px",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {copied === k ? "✓" : "Copy"}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function Settings({
  themeKey,
  setThemeKey,
}: {
  themeKey: ThemeKey;
  setThemeKey: (t: ThemeKey) => void;
}) {
  return (
    <div>
      <Divider label="Creator" />
      <CreatorCard C={C as any} />

      <Divider label="API Keys" />
      <FreeApiProviders C={C as any} />
    </div>
  );
}

function ApiKeySettings() {
  const [cfg, setCfg] = useState(() => loadApiCfg());
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  function update(patch: Partial<typeof cfg>) {
    const next = { ...cfg, ...patch };
    setCfg(next);
    saveApiCfg(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }
  async function test() {
    setTesting(true);
    setTestMsg("");
    try {
      const t = await callAI("Reply with: OK", "ping", 10);
      setTestMsg("✓ Connected: " + (t.slice(0, 50) || "(empty)"));
    } catch (e: any) {
      setTestMsg("✗ " + e.message);
    } finally {
      setTesting(false);
    }
  }
  const providers: { id: Provider; label: string; hint: string }[] = [
    { id: "lovable", label: "Lovable AI (Default)", hint: "No key required, billed via workspace" },
    { id: "gemini", label: "Google Gemini", hint: "Get key at aistudio.google.com" },
    { id: "groq", label: "Groq AI", hint: "Get key at console.groq.com" },
    { id: "mistral", label: "Mistral AI", hint: "Get key at console.mistral.ai (supports vision)" },
  ];
  const keyPlaceholder =
    cfg.provider === "gemini" ? "AIza..." : cfg.provider === "groq" ? "gsk_..." : "...";
  const modelPlaceholder =
    cfg.provider === "gemini"
      ? "gemini-2.0-flash"
      : cfg.provider === "groq"
        ? "llama-3.3-70b-versatile"
        : cfg.provider === "mistral"
          ? "mistral-large-latest / pixtral-12b-2409"
          : "";
  const providerName =
    cfg.provider === "gemini"
      ? "Gemini"
      : cfg.provider === "groq"
        ? "Groq"
        : cfg.provider === "mistral"
          ? "Mistral"
          : "";
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {providers.map((p) => {
          const active = cfg.provider === p.id;
          return (
            <button
              key={p.id}
              onClick={() => update({ provider: p.id })}
              style={{
                background: active ? C.orangeSoft : C.card2,
                border: `2px solid ${active ? C.orange : C.border2}`,
                borderRadius: 12,
                padding: "12px 14px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: active ? C.orange : C.text,
                  marginBottom: 3,
                }}
              >
                {p.label}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{p.hint}</div>
            </button>
          );
        })}
      </div>
      {cfg.provider !== "lovable" && (
        <>
          <Inp
            label={`${providerName} API Key`}
            value={cfg.key}
            onChange={(v: string) => update({ key: v })}
            placeholder={keyPlaceholder}
            type="password"
          />
          <Inp
            label="Model (optional)"
            value={cfg.model}
            onChange={(v: string) => update({ model: v })}
            placeholder={modelPlaceholder}
          />
        </>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Btn onClick={test} loading={testing} label="🔌 Test Connection" color={C.blue} />
        {saved && <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Saved</span>}
        {testMsg && (
          <span style={{ fontSize: 12, color: testMsg.startsWith("✓") ? C.green : C.red }}>
            {testMsg}
          </span>
        )}
      </div>
    </div>
  );
}

function HeartButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const phone = "01797953059";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const copyPhone = () => {
    navigator.clipboard?.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Developer info"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: `linear-gradient(135deg,${C.orange},${C.purple})`,
          border: "none",
          cursor: "pointer",
          boxShadow: `0 6px 30px ${C.orange}88`,
          zIndex: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "heartBeat 1.6s ease-in-out infinite",
          color: "#fff",
          fontSize: 26,
        }}
      >
        ♥
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.75)",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card,
              border: `1px solid ${C.border2}`,
              borderRadius: 18,
              padding: 28,
              maxWidth: 380,
              width: "100%",
              textAlign: "center",
              position: "relative",
            }}
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "none",
                border: "none",
                color: C.muted,
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <div style={{ fontSize: 44, marginBottom: 12 }}>💖</div>
            <div
              style={{
                fontFamily: "var(--display)",
                fontSize: 13,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                marginBottom: 6,
              }}
            >
              Developed by
            </div>
            <div
              style={{
                fontFamily: "var(--display)",
                fontSize: 26,
                fontWeight: 800,
                color: C.text,
                marginBottom: 18,
                letterSpacing: "-.5px",
              }}
            >
              Md Sonet Mia
            </div>
            <a
              href="https://wa.me/8801797953059"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#25D366",
                color: "#fff",
                textDecoration: "none",
                padding: "12px 22px",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 15,
                boxShadow: "0 4px 20px rgba(37,211,102,.4)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {phone}
            </a>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
              <button
                onClick={copyPhone}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: copied ? "rgba(34,197,94,.15)" : C.card2,
                  border: `1px solid ${copied ? "rgba(34,197,94,.4)" : C.border2}`,
                  color: copied ? C.green : C.muted,
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  transition: "all .15s",
                }}
              >
                {copied ? "✓ Copied" : "⧉ Copy Number"}
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 14 }}>Tap to open WhatsApp</div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🖼",
    title: "Bulk Image Prompt Generator",
    desc: "Up to 200 prompts per subject",
    id: "bulk",
  },
  { icon: "💡", title: "Idea Generator", desc: "Turn concepts into AI-ready prompts", id: "idea" },
  { icon: "📷", title: "JPG Creator", desc: "Microstock-ready photo prompts", id: "jpg" },
  { icon: "🟦", title: "PNG Creator", desc: "Transparent PNG asset prompts", id: "png" },
  { icon: "📚", title: "Prompt Library", desc: "Curated prompts by category", id: "library" },
  { icon: "⚡", title: "Prompt Improver", desc: "AI-powered prompt analysis", id: "improver" },
  { icon: "🔀", title: "Prompt Variations", desc: "Many angles from one prompt", id: "variations" },
  { icon: "🔍", title: "Silhouette Finder", desc: "Clean isolated silhouettes", id: "silhouette" },
];

// ── ShinyText (framer-motion animated gradient text) ──────────────────────────
function ShinyText({
  text,
  speed = 3,
  baseColor = "#64CEFB",
  shineColor = "#ffffff",
  spread = 100,
  className = "",
  style = {},
}: {
  text: string;
  speed?: number;
  baseColor?: string;
  shineColor?: string;
  spread?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const gradient = `linear-gradient(${spread}deg, ${baseColor} 0%, ${baseColor} 35%, ${shineColor} 50%, ${baseColor} 65%, ${baseColor} 100%)`;
  return (
    <motion.span
      className={className}
      style={{
        display: "inline-block",
        backgroundImage: gradient,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
        ...style,
      }}
      animate={{ backgroundPosition: ["200% 0%", "-100% 0%"] }}
      transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
    >
      {text}
    </motion.span>
  );
}

function HeroSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black font-[Inter,sans-serif]">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4"
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Hero center */}
        <div className="flex-1 flex flex-col items-center justify-center text-center pb-10">
          <h1
            className="text-white font-medium tracking-tighter text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl"
            style={{ lineHeight: 0.85 }}
          >
            <span className="block">Sweet</span>
            <ShinyText
              text="Prompts Pro."
              speed={3}
              baseColor="#64CEFB"
              shineColor="#ffffff"
              spread={100}
            />
          </h1>
        </div>
      </div>
    </section>
  );
}

function HomePage({ setPage }: { setPage: (p: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <HeroSection />
    </div>
  );
}

// ── Image → Prompts ───────────────────────────────────────────────────────────
type ImgItem = {
  id: string;
  name: string;
  dataUrl: string;
  prompt?: string;
  status: "idle" | "loading" | "done" | "error";
  error?: string;
};

function ImagePicker({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [over, setOver] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const fs = Array.from(e.dataTransfer.files).filter(
          (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
        );
        if (fs.length) onFiles(fs);
      }}
      style={{
        display: "block",
        border: `2px dashed ${over ? C.orange : C.border2}`,
        borderRadius: 14,
        padding: "28px 20px",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        background: over ? C.orangeSoft : C.card,
        transition: "all .18s",
        marginBottom: 14,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ fontSize: 30, marginBottom: 6 }}>📤</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>
        Drop images here or click to upload
      </div>
      <div style={{ fontSize: 11.5, color: C.muted }}>
        JPG, PNG, WEBP · multiple files supported
      </div>
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        disabled={disabled}
        style={{ display: "none" }}
        onChange={(e) => {
          const fs = e.target.files ? Array.from(e.target.files) : [];
          if (fs.length) onFiles(fs);
          e.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function ImageToPrompts() {
  const [items, setItems] = useState<ImgItem[]>([]);
  const [style, setStyle] = useState("photorealistic microstock");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  async function addFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    const newItems: ImgItem[] = [];
    for (const f of imgs) {
      const dataUrl = await fileToDataUrl(f);
      newItems.push({
        id: Math.random().toString(36).slice(2),
        name: f.name,
        dataUrl,
        status: "idle",
      });
    }
    setItems((prev) => [...prev, ...newItems]);
  }

  async function generateAll() {
    if (!items.length) return;
    setBusy(true);
    setProgress(0);
    const sys = `You are an expert AI image prompt engineer for microstock. Given an uploaded image, write ONE detailed AI generation prompt (60-120 words) that could reproduce a similar image in ${style} style. Focus on subject, composition, lighting, color palette, mood, and technical details (lens, aperture if photo). Avoid trademarks, brand names, and identifiable people. Return ONLY the prompt text, no numbering, no preface.`;
    let done = 0;
    const next = [...items];
    for (let i = 0; i < next.length; i++) {
      const it = next[i];
      if (it.status === "done") {
        done++;
        continue;
      }
      next[i] = { ...it, status: "loading" };
      setItems([...next]);
      try {
        const text = await callVisionAI(
          sys,
          "Analyze this image and produce the prompt.",
          it.dataUrl,
          500,
        );
        next[i] = { ...next[i], status: "done", prompt: text.trim() };
      } catch (e: any) {
        next[i] = { ...next[i], status: "error", error: e.message };
      }
      done++;
      setItems([...next]);
      setProgress(Math.round((done / next.length) * 100));
    }
    setBusy(false);
  }

  const completed = items.filter((i) => i.status === "done" && i.prompt).map((i) => i.prompt!);

  return (
    <div>
      <ImagePicker onFiles={addFiles} disabled={busy} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <Label>Prompt style</Label>
          <Sel value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="photorealistic microstock">Photorealistic microstock</option>
            <option value="digital illustration">Digital illustration</option>
            <option value="flat vector">Flat vector</option>
            <option value="3D render">3D render</option>
            <option value="watercolor">Watercolor</option>
            <option value="cinematic">Cinematic</option>
          </Sel>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <Btn
            onClick={generateAll}
            loading={busy}
            disabled={!items.length}
            label={`✨ Generate Prompts (${items.length})`}
          />
        </div>
      </div>
      {busy && (
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
          Processing… {progress}%
        </div>
      )}

      {items.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                background: C.card,
                border: `1px solid ${C.border2}`,
                borderRadius: 12,
                padding: 10,
              }}
            >
              <img
                src={it.dataUrl}
                alt={it.name}
                style={{
                  width: "100%",
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 6,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {it.name}
              </div>
              {it.status === "loading" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: C.orange,
                    fontSize: 12,
                  }}
                >
                  <Spin s={12} c={C.orange} /> Analyzing…
                </div>
              )}
              {it.status === "done" && it.prompt && (
                <div
                  style={{
                    fontSize: 12,
                    color: C.text,
                    lineHeight: 1.5,
                    maxHeight: 120,
                    overflow: "auto",
                  }}
                >
                  {it.prompt}
                </div>
              )}
              {it.status === "error" && (
                <div style={{ fontSize: 11, color: C.red }}>✗ {it.error}</div>
              )}
              {it.status === "idle" && <div style={{ fontSize: 11, color: C.dim }}>Waiting…</div>}
              <button
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                style={{
                  marginTop: 8,
                  background: "none",
                  border: `1px solid ${C.border2}`,
                  color: C.muted,
                  borderRadius: 6,
                  padding: "3px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      {completed.length > 0 && <ExportBar prompts={completed} />}
    </div>
  );
}

// ── Image → Metadata ──────────────────────────────────────────────────────────
const MARKETPLACES = [
  { id: "adobe", label: "Adobe Stock", kwMax: 49, titleMax: 200 },
  { id: "shutterstock", label: "Shutterstock", kwMax: 50, titleMax: 200 },
  { id: "getty", label: "Getty / iStock", kwMax: 50, titleMax: 150 },
  { id: "dreamstime", label: "Dreamstime", kwMax: 100, titleMax: 100 },
  { id: "freepik", label: "Freepik", kwMax: 50, titleMax: 100 },
  { id: "vecteezy", label: "Vecteezy", kwMax: 50, titleMax: 100 },
];

type MetaItem = {
  id: string;
  name: string;
  dataUrl: string;
  kind: "image" | "video";
  status: "idle" | "loading" | "done" | "error";
  meta?: { title: string; keywords: string[]; category: string; description: string };
  error?: string;
};

function csvEscape(s: string) {
  return `"${(s ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

function ImageToMetadata() {
  const [items, setItems] = useState<MetaItem[]>([]);
  const [selected, setSelected] = useState<string[]>(["adobe"]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  async function addFiles(files: File[]) {
    const next: MetaItem[] = [];
    for (const f of files) {
      const kind: "image" | "video" = f.type.startsWith("video/") ? "video" : "image";
      if (kind === "video") {
        next.push({
          id: Math.random().toString(36).slice(2),
          name: f.name,
          dataUrl: "",
          kind,
          status: "idle",
        });
      } else {
        const dataUrl = await fileToDataUrl(f);
        next.push({
          id: Math.random().toString(36).slice(2),
          name: f.name,
          dataUrl,
          kind,
          status: "idle",
        });
      }
    }
    setItems((prev) => [...prev, ...next]);
  }

  function toggleMk(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function run() {
    if (!items.length || !selected.length) return;
    setBusy(true);
    setProgress(0);
    const kwTarget = Math.min(
      ...selected.map((id) => MARKETPLACES.find((m) => m.id === id)!.kwMax),
    );
    const titleTarget = Math.min(
      ...selected.map((id) => MARKETPLACES.find((m) => m.id === id)!.titleMax),
    );
    const sys = `You generate microstock metadata for uploaded images. Return STRICT JSON with keys: title (<=${titleTarget} chars, descriptive, no brand names, no clickbait), description (1-2 sentences), category (one of: Animals, Buildings & Architecture, Business, Drinks, The Environment, States of Mind, Food, Graphic Resources, Hobbies & Leisure, Industry, Landscapes, Lifestyle, People, Plants & Flowers, Culture & Religion, Science, Social Issues, Sports, Technology, Transport, Travel), keywords (array of exactly ${kwTarget} single-word or two-word English keywords, most relevant first, no duplicates, no brand names). Return ONLY valid JSON, no code fences.`;

    const next = [...items];
    for (let i = 0; i < next.length; i++) {
      const it = next[i];
      if (it.status === "done") {
        setProgress(Math.round(((i + 1) / next.length) * 100));
        continue;
      }
      if (it.kind === "video") {
        next[i] = {
          ...it,
          status: "error",
          error: "Video analysis not supported — extract a frame and re-upload as image.",
        };
        setItems([...next]);
        setProgress(Math.round(((i + 1) / next.length) * 100));
        continue;
      }
      next[i] = { ...it, status: "loading" };
      setItems([...next]);
      try {
        const raw = await callVisionAI(
          sys,
          "Analyze this image and return the JSON metadata.",
          it.dataUrl,
          1200,
        );
        const clean = raw.replace(/```json|```/g, "").trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
        const kws: string[] = Array.isArray(parsed.keywords)
          ? parsed.keywords.map((k: any) => String(k).trim()).filter(Boolean)
          : [];
        next[i] = {
          ...next[i],
          status: "done",
          meta: {
            title: String(parsed.title || "").slice(0, titleTarget),
            description: String(parsed.description || ""),
            category: String(parsed.category || "Graphic Resources"),
            keywords: kws.slice(0, kwTarget),
          },
        };
      } catch (e: any) {
        next[i] = { ...next[i], status: "error", error: e.message };
      }
      setItems([...next]);
      setProgress(Math.round(((i + 1) / next.length) * 100));
    }
    setBusy(false);
  }

  function downloadCsv() {
    const rows: string[] = [];
    rows.push(
      ["Filename", "Marketplace", "Title", "Description", "Keywords", "Category"].join(","),
    );
    for (const it of items) {
      if (!it.meta) continue;
      for (const mkId of selected) {
        const mk = MARKETPLACES.find((m) => m.id === mkId)!;
        const kws = it.meta.keywords.slice(0, mk.kwMax).join(", ");
        const title = it.meta.title.slice(0, mk.titleMax);
        rows.push(
          [
            csvEscape(it.name),
            csvEscape(mk.label),
            csvEscape(title),
            csvEscape(it.meta.description),
            csvEscape(kws),
            csvEscape(it.meta.category),
          ].join(","),
        );
      }
    }
    triggerDownload(
      new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }),
      "microstock-metadata.csv",
    );
  }

  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div>
      <ImagePicker onFiles={addFiles} disabled={busy} />

      <Label>Target marketplaces</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {MARKETPLACES.map((m) => {
          const on = selected.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggleMk(m.id)}
              style={{
                background: on ? C.orangeSoft : C.card2,
                border: `1.5px solid ${on ? C.orange : C.border2}`,
                color: on ? C.orange : C.text,
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {on ? "✓ " : ""}
              {m.label} <span style={{ opacity: 0.6, fontSize: 10 }}>·{m.kwMax}kw</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <Btn
          onClick={run}
          loading={busy}
          disabled={!items.length || !selected.length}
          label={`🏷 Generate Metadata (${items.length})`}
        />
        {doneCount > 0 && (
          <Btn onClick={downloadCsv} label={`↓ Download CSV (${doneCount})`} color={C.green} />
        )}
      </div>
      {busy && (
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
          Analyzing sequentially… {progress}%
        </div>
      )}

      {items.map((it) => (
        <div
          key={it.id}
          style={{
            background: C.card,
            border: `1px solid ${C.border2}`,
            borderRadius: 12,
            padding: 12,
            marginBottom: 10,
            display: "flex",
            gap: 12,
          }}
        >
          {it.dataUrl ? (
            <img
              src={it.dataUrl}
              alt={it.name}
              style={{
                width: 100,
                height: 100,
                objectFit: "cover",
                borderRadius: 8,
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 8,
                background: C.card2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                flexShrink: 0,
              }}
            >
              🎬
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                color: C.muted,
                marginBottom: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {it.name}
            </div>
            {it.status === "loading" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: C.orange,
                  fontSize: 12,
                }}
              >
                <Spin s={12} c={C.orange} /> Analyzing…
              </div>
            )}
            {it.status === "idle" && <div style={{ fontSize: 12, color: C.dim }}>Waiting…</div>}
            {it.status === "error" && (
              <div style={{ fontSize: 12, color: C.red }}>✗ {it.error}</div>
            )}
            {it.status === "done" && it.meta && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                  {it.meta.title}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>
                  📂 {it.meta.category}
                </div>
                <div style={{ fontSize: 11.5, color: C.text, lineHeight: 1.5, marginBottom: 6 }}>
                  {it.meta.description}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  🔑 <span style={{ color: C.text }}>{it.meta.keywords.join(", ")}</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
            style={{
              background: "none",
              border: `1px solid ${C.border2}`,
              color: C.muted,
              borderRadius: 6,
              padding: "3px 8px",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "inherit",
              height: "fit-content",
            }}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
const AI_TOOLS = [
  { id: "improver", icon: "⚡", label: "Prompt Improver" },
  { id: "variations", icon: "🔀", label: "Prompt Variations" },
  { id: "expander", icon: "📝", label: "Prompt Expander" },
  { id: "fixer", icon: "🛠", label: "Prompt Fixer" },
  { id: "translator", icon: "🌐", label: "Prompt Translator" },
  { id: "brainstorm", icon: "🧠", label: "Brainstormer" },
  { id: "silhouette", icon: "🔍", label: "Silhouette Finder" },
  { id: "imgprompts", icon: "🖼", label: "Image → Prompts" },
  { id: "imgmeta", icon: "🏷", label: "Image → Metadata" },
];

const CREATORS = [
  { id: "bulk", label: "Bulk Generator" },
  { id: "idea", label: "Idea Generator" },
  { id: "jpg", label: "JPG Creator" },
  { id: "png", label: "PNG Creator" },
];

function Navbar({ page, setPage }: any) {
  const [aiOpen, setAiOpen] = useState(false);
  const [crOpen, setCrOpen] = useState(false);
  return (
    <nav
      style={{
        background: "rgba(10,10,15,0.55)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 68,
        position: "sticky",
        top: 0,
        zIndex: 100,
        gap: 12,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px -12px rgba(0,0,0,0.5)",
      }}
    >
      <button
        onClick={() => setPage("home")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 11,
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #fff 0%, #d4d4e0 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 22px rgba(245,132,31,.35), inset 0 0 0 1px rgba(255,255,255,.4)`,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f5841f, #a78bfa)",
            }}
          />
        </span>
        <span
          style={{
            fontFamily: "var(--display)",
            fontSize: 16.5,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-.4px",
          }}
        >
          Sweet Prompts Pro
        </span>
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "5px 6px",
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 999,
          backdropFilter: "blur(12px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <NavBtn label="Home" active={page === "home"} onClick={() => setPage("home")} />
        <Dropdown
          label="Creators"
          open={crOpen}
          setOpen={setCrOpen}
          items={CREATORS}
          setPage={setPage}
          active={CREATORS.some((c) => c.id === page)}
        />
        <Dropdown
          label="AI Tools"
          open={aiOpen}
          setOpen={setAiOpen}
          items={AI_TOOLS}
          setPage={setPage}
          active={AI_TOOLS.some((c) => c.id === page)}
        />
        <NavBtn label="Library" active={page === "library"} onClick={() => setPage("library")} />
        <NavBtn label="Settings" active={page === "settings"} onClick={() => setPage("settings")} />
      </div>
    </nav>
  );
}

function NavBtn({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "rgba(255,255,255,0.14)" : "transparent",
        border: "1px solid transparent",
        borderRadius: 999,
        color: active ? "#fff" : "rgba(255,255,255,0.75)",
        padding: "6px 14px",
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all .15s",
      }}
    >
      {label}
    </button>
  );
}

function Dropdown({ label, open, setOpen, items, setPage, active }: any) {
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: open || active ? "rgba(255,255,255,0.14)" : "transparent",
          border: "1px solid transparent",
          borderRadius: 999,
          color: open || active ? "#fff" : "rgba(255,255,255,0.75)",
          padding: "6px 14px",
          fontSize: 13.5,
          fontWeight: active ? 600 : 500,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          gap: 5,
          transition: "all .15s",
        }}
      >
        {label}{" "}
        <span
          style={{
            fontSize: 11,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            background: C.nav,
            border: `1px solid ${C.border2}`,
            borderRadius: 12,
            padding: "8px 0",
            minWidth: 210,
            boxShadow: `0 12px 40px rgba(0,0,0,.4)`,
            zIndex: 200,
          }}
        >
          {items.map((t: any) => (
            <button
              key={t.id}
              onClick={() => {
                setPage(t.id);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                background: "none",
                border: "none",
                color: C.muted,
                padding: "8px 16px",
                fontSize: 13.5,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.card2;
                e.currentTarget.style.color = C.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = C.muted;
              }}
            >
              {t.icon && <span style={{ fontSize: 14 }}>{t.icon}</span>}
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────
const PAGE_META: Record<string, { title: string | null; desc?: string }> = {
  home: { title: null },
  bulk: {
    title: "Bulk Image Prompt Generator",
    desc: "Generate microstock-ready prompts for many subjects at once",
  },
  idea: { title: "Idea Generator", desc: "Turn any concept into dozens of AI-ready prompts" },
  jpg: {
    title: "JPG Creator",
    desc: "Microstock photo prompts for Adobe Stock, Shutterstock, Getty",
  },
  png: { title: "PNG Creator", desc: "Transparent PNG asset prompts for design marketplaces" },
  library: { title: "Prompt Library", desc: "Browse curated prompts by category" },
  improver: { title: "Prompt Improver", desc: "Analyze and enhance existing prompts" },
  variations: { title: "Prompt Variations", desc: "Many creative angles from one prompt" },
  expander: { title: "Prompt Expander", desc: "Turn short ideas into rich detailed prompts" },
  fixer: { title: "Prompt Fixer", desc: "Diagnose and fix weak prompts" },
  translator: { title: "Prompt Translator", desc: "Translate prompts into any language" },
  brainstorm: { title: "Brainstormer", desc: "Generate creative directions" },
  silhouette: { title: "Silhouette Finder", desc: "Clean isolated silhouette prompts" },
  imgprompts: {
    title: "Image → Prompts",
    desc: "Upload images and generate AI prompts that recreate their style",
  },
  imgmeta: {
    title: "Image → Metadata",
    desc: "Generate microstock-ready title, keywords & category CSV from images",
  },
  settings: { title: "Settings", desc: "Theme and preferences" },
};

function PageContent({ page, themeKey, setThemeKey }: any) {
  const pages: Record<string, React.ReactNode> = {
    bulk: <BulkGenerator />,
    idea: <IdeaGenerator />,
    jpg: <JPGCreator />,
    png: <PNGCreator />,
    library: <PromptLibrary />,
    improver: <PromptImprover />,
    variations: <PromptVariations />,
    expander: <PromptExpander />,
    fixer: <PromptFixer />,
    translator: <PromptTranslator />,
    brainstorm: <Brainstormer />,
    silhouette: <SilhouetteFinder />,
    imgprompts: <ImageToPrompts />,
    imgmeta: <ImageToMetadata />,
    settings: <Settings themeKey={themeKey} setThemeKey={setThemeKey} />,
  };
  return pages[page] || null;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [themeKey, setThemeKeyRaw] = useState<ThemeKey>(
    () => tryLoad("sp_theme", "sweet") as ThemeKey,
  );
  CURRENT = THEMES[themeKey] as Theme;
  function setThemeKey(t: ThemeKey) {
    setThemeKeyRaw(t);
    trySave("sp_theme", t);
    CURRENT = THEMES[t] as Theme;
  }

  const meta = PAGE_META[page] || PAGE_META.home;
  const isFuturistic = themeKey === "futuristic";
  const displayFont = isFuturistic ? "'Orbitron', sans-serif" : "'Syne', sans-serif";
  const bodyFont = isFuturistic ? "'Rajdhani', sans-serif" : "'Plus Jakarta Sans', sans-serif";

  return (
    <>
      <link rel="stylesheet" href={FONTS_LINK} />
      <style>{`
        :root { --display: ${displayFont}; }
        @keyframes sp { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        @keyframes neonPulse { 0%,100% { opacity:.6; } 50% { opacity:1; } }
        @keyframes heartBeat { 0%,100% { transform: scale(1); } 25% { transform: scale(1.12); } 50% { transform: scale(1); } 75% { transform: scale(1.08); } }
        @keyframes ambientDrift { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(-3%, 2%, 0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        body { background: ${C.bg}; font-family: ${bodyFont}; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.muted}; background-clip: padding-box; border: 2px solid transparent; }
        select option { background: #16161f; color: ${C.text}; }
        ::placeholder { color: ${C.dim}; opacity: 1; }
        ::selection { background: ${C.orange}55; color: ${C.text}; }
        button, a { transition: transform .18s ease, background .18s ease, color .18s ease, border-color .18s ease, box-shadow .18s ease; }
        h1, h2, h3 { letter-spacing: -0.02em; }
        ${
          themeKey === "sweet"
            ? `
          body::before {
            content: ""; position: fixed; inset: -20% -10% -10% -10%; z-index: 0; pointer-events: none;
            background:
              radial-gradient(60% 50% at 15% 0%, rgba(245,132,31,.10) 0%, transparent 60%),
              radial-gradient(50% 40% at 90% 10%, rgba(167,139,250,.10) 0%, transparent 60%),
              radial-gradient(45% 35% at 50% 100%, rgba(96,165,250,.06) 0%, transparent 70%);
            filter: blur(20px); animation: ambientDrift 22s ease-in-out infinite;
          }
          body::after {
            content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: .35;
            background-image:
              linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
            background-size: 44px 44px;
            mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
            -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
          }
        `
            : ""
        }
        ${
          isFuturistic
            ? `
          body { background-image: radial-gradient(circle at 20% 10%, ${C.orange}11 0%, transparent 50%), radial-gradient(circle at 80% 90%, ${C.purple}11 0%, transparent 50%); }
          h1, h2 { text-shadow: 0 0 20px ${C.orangeGlow}; }
        `
            : ""
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          color: C.text,
          fontFamily: bodyFont,
          position: "relative",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar page={page} setPage={setPage} />
          {page === "home" ? (
            <HomePage setPage={setPage} />
          ) : (
            <div
              style={{
                maxWidth: 880,
                margin: "0 auto",
                padding: "44px 24px 96px",
                animation: "fadeUp .28s ease",
              }}
            >
              {meta.title && (
                <div style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: C.orangeSoft,
                      border: `1px solid ${C.orange}33`,
                      borderRadius: 999,
                      padding: "4px 12px",
                      marginBottom: 14,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: C.orange,
                        boxShadow: `0 0 10px ${C.orangeGlow}`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: C.orange,
                        letterSpacing: ".6px",
                        textTransform: "uppercase",
                      }}
                    >
                      Sweet Prompts Pro
                    </span>
                  </div>
                  <h1
                    style={{
                      fontFamily: displayFont,
                      fontSize: 40,
                      fontWeight: 800,
                      color: C.text,
                      marginBottom: 10,
                      letterSpacing: "-1.2px",
                      lineHeight: 1.1,
                      backgroundImage:
                        themeKey === "sweet"
                          ? `linear-gradient(180deg, #ffffff 0%, #b8b8d0 100%)`
                          : undefined,
                      WebkitBackgroundClip: themeKey === "sweet" ? "text" : undefined,
                      WebkitTextFillColor: themeKey === "sweet" ? "transparent" : undefined,
                      backgroundClip: themeKey === "sweet" ? "text" : undefined,
                    }}
                  >
                    {meta.title}
                  </h1>
                  {meta.desc && (
                    <p style={{ fontSize: 15.5, color: C.muted, lineHeight: 1.6, maxWidth: 640 }}>
                      {meta.desc}
                    </p>
                  )}
                </div>
              )}
              <PageContent page={page} themeKey={themeKey} setThemeKey={setThemeKey} />
            </div>
          )}
        </div>

        <HeartButton />
      </div>
    </>
  );
}

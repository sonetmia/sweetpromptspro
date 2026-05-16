import { useState } from "react";
import { callAIFn } from "@/lib/ai.functions";

// ── Themes ────────────────────────────────────────────────────────────────────
const THEMES = {
  simple: {
    bg: "#ffffff", bgDeep: "#f7f7fa", nav: "#ffffff", card: "#f5f5f9",
    card2: "#ecedf2", border: "#e2e3ea", border2: "#d4d6df",
    orange: "#ea580c", orangeB: "#c2410c", orangeSoft: "rgba(234,88,12,.10)", orangeGlow: "rgba(234,88,12,.25)",
    purple: "#7c3aed", purpleB: "#6d28d9", purpleSoft: "rgba(124,58,237,.10)",
    text: "#0f172a", muted: "#64748b", dim: "#94a3b8",
    green: "#16a34a", red: "#dc2626", blue: "#2563eb", teal: "#0d9488", gold: "#d97706",
  },
  sweet: {
    bg: "#1a1a2e", bgDeep: "#13131f", nav: "#1e1e30", card: "#252538", card2: "#2d2d45",
    border: "#35354f", border2: "#3f3f5c",
    orange: "#f5841f", orangeB: "#e06b0a", orangeSoft: "rgba(245,132,31,.14)", orangeGlow: "rgba(245,132,31,.3)",
    purple: "#8b5cf6", purpleB: "#7c3aed", purpleSoft: "rgba(139,92,246,.15)",
    text: "#f0f0f8", muted: "#9090b0", dim: "#4a4a68",
    green: "#22c55e", red: "#ef4444", blue: "#60a5fa", teal: "#2dd4bf", gold: "#fbbf24",
  },
  futuristic: {
    bg: "#05060f", bgDeep: "#020308", nav: "#0a0d1f", card: "#0f1430", card2: "#161c3f",
    border: "#243064", border2: "#3a4a8c",
    orange: "#00f0ff", orangeB: "#06b6d4", orangeSoft: "rgba(0,240,255,.12)", orangeGlow: "rgba(0,240,255,.45)",
    purple: "#ff00d4", purpleB: "#d100af", purpleSoft: "rgba(255,0,212,.14)",
    text: "#e7f0ff", muted: "#7c8ec7", dim: "#3d4a7a",
    green: "#00ffa3", red: "#ff3860", blue: "#00b3ff", teal: "#00ffe0", gold: "#ffd700",
  },
} as const;

type ThemeKey = keyof typeof THEMES;

type Theme = { [K in keyof typeof THEMES.sweet]: string };
let CURRENT: Theme = THEMES.sweet as Theme;
const C = new Proxy({} as Theme, {
  get(_, p: string) { return (CURRENT as any)[p]; },
});

const COUNT_OPTIONS = [5, 10, 20, 30, 50, 100, 200];

const FONTS_LINK = "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Orbitron:wght@600;700;800;900&family=Rajdhani:wght@400;500;600;700&display=swap";

// ── API ───────────────────────────────────────────────────────────────────────
async function callAI(system: string, user: string, maxTokens = 1400): Promise<string> {
  const r = await callAIFn({ data: { system, user, maxTokens } });
  return r.text;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseNumbered(text: string): string[] {
  const lines = text.split("\n").filter(l => /^\d+[\.\)]/.test(l.trim()));
  return lines.length ? lines.map(l => l.replace(/^\d+[\.\)]\s*/, "").trim()) : [text.trim()];
}
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}
function dlTxt(arr: string[]) {
  triggerDownload(new Blob([arr.join("\n\n---\n\n")], { type: "text/plain;charset=utf-8" }), "prompts.txt");
}
function dlCsv(arr: string[]) {
  const rows = arr.map((p, i) => `${i + 1},"${p.replace(/"/g, '""')}"`).join("\n");
  triggerDownload(new Blob([`Index,Prompt\n${rows}`], { type: "text/csv;charset=utf-8" }), "prompts.csv");
}
function copy(t: string) { navigator.clipboard?.writeText(t); }
function tryLoad(k: string, d: string) { try { return localStorage.getItem(k) ?? d; } catch { return d; } }
function trySave(k: string, v: string) { try { localStorage.setItem(k, v); } catch {} }

// ── Generate prompts in batches (so 200 fits) ─────────────────────────────────
async function generateLargeBatch(system: string, user: string, totalCount: number, onProgress?: (p: number) => void): Promise<string[]> {
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
  label: { display: "block", fontSize: 11, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".8px", fontWeight: 600 },
};

function Spin({ s = 14, c = "#fff" }: { s?: number; c?: string }) {
  return <span style={{ display: "inline-block", width: s, height: s, borderRadius: "50%", border: `2px solid ${c}44`, borderTopColor: c, animation: "sp .65s linear infinite" }} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ ...ss.label, color: C.muted }}>{children}</label>;
}

function Sel(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ background: C.card2, border: `1px solid ${C.border2}`, color: C.text, borderRadius: 9, padding: "10px 13px", fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "inherit", width: "100%", ...props.style }} />;
}

function Txt({ label, value, onChange, placeholder, rows = 4 }: any) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <Label>{label}</Label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ width: "100%", background: C.card2, border: `1px solid ${f ? C.orange + "99" : C.border2}`, borderRadius: 10, padding: "11px 14px", color: C.text, fontSize: 13.5, fontFamily: "inherit", resize: "vertical", outline: "none", lineHeight: 1.7, transition: "border-color .18s", boxSizing: "border-box", boxShadow: f ? `0 0 0 3px ${C.orange}18` : "none" }} />
    </div>
  );
}

function Inp({ label, value, onChange, placeholder, type = "text" }: any) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <Label>{label}</Label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ background: C.card2, border: `1px solid ${f ? C.orange + "99" : C.border2}`, color: C.text, borderRadius: 9, padding: "10px 13px", fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", boxShadow: f ? `0 0 0 3px ${C.orange}18` : "none" }} />
    </div>
  );
}

function Btn({ onClick, loading, disabled, label, color }: any) {
  const bg = color || C.orange;
  const off = loading || disabled;
  return (
    <button onClick={onClick} disabled={off} style={{ background: off ? C.dim : bg, color: "#fff", border: "none", borderRadius: 9, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: off ? "not-allowed" : "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7, boxShadow: off ? "none" : `0 4px 20px ${bg}55`, transition: "all .17s", letterSpacing: ".2px" }}>
      {loading ? <><Spin /> Processing…</> : label}
    </button>
  );
}

function Card({ text, index, total, badge }: { text: string; index: number; total: number; badge?: string }) {
  const [c, setC] = useState(false);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "15px 17px", marginBottom: 10, position: "relative" }}>
      {(total > 1 || badge) && (
        <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
          {total > 1 && <span style={{ fontSize: 10, color: C.orange, fontWeight: 700, background: C.orangeSoft, borderRadius: 6, padding: "1px 8px" }}>#{index + 1}</span>}
          {badge && <span style={{ fontSize: 10, color: C.teal, fontWeight: 700, background: "rgba(45,212,191,.12)", border: "1px solid rgba(45,212,191,.25)", borderRadius: 6, padding: "1px 8px", textTransform: "uppercase" }}>{badge}</span>}
        </div>
      )}
      <p style={{ fontSize: 13.5, lineHeight: 1.75, color: C.text, paddingRight: 80, whiteSpace: "pre-wrap" }}>{text}</p>
      <button onClick={() => { copy(text); setC(true); setTimeout(() => setC(false), 1500); }}
        style={{ position: "absolute", top: 12, right: 12, background: c ? "rgba(34,197,94,.15)" : C.card2, border: `1px solid ${c ? "rgba(34,197,94,.4)" : C.border2}`, color: c ? C.green : C.muted, borderRadius: 7, padding: "4px 11px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
        {c ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}

function ExportBar({ prompts }: { prompts: string[] }) {
  if (!prompts.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 8px", flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, color: C.muted, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 20, padding: "2px 10px" }}>{prompts.length} result{prompts.length !== 1 ? "s" : ""}</span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
        <button onClick={() => dlTxt(prompts)} style={{ background: "none", border: `1px solid ${C.border2}`, color: C.muted, borderRadius: 7, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>↓ TXT</button>
        <button onClick={() => dlCsv(prompts)} style={{ background: "none", border: `1px solid ${C.border2}`, color: C.muted, borderRadius: 7, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>↓ CSV</button>
        <button onClick={() => copy(prompts.join("\n\n---\n\n"))} style={{ background: "none", border: `1px solid ${C.border2}`, color: C.muted, borderRadius: 7, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>⧉ Copy All</button>
      </div>
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 9, padding: "10px 14px", marginTop: 12 }}><p style={{ color: C.red, fontSize: 12.5, lineHeight: 1.55 }}>⚠ {msg}</p></div>;
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px" }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 10, color: C.muted, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function Chip({ label, active, onClick }: any) {
  return <button onClick={onClick} style={{ background: active ? C.orangeSoft : C.card2, border: `1px solid ${active ? C.orange + "66" : C.border}`, color: active ? C.orange : C.muted, borderRadius: 20, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 600 : 400 }}>{label}</button>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.muted }}>Generating…</span>
        <span style={{ fontSize: 12, color: C.orange, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: C.card2, borderRadius: 6 }}>
        <div style={{ height: "100%", width: `${value}%`, background: `linear-gradient(to right,${C.orange},${C.purple})`, borderRadius: 6, transition: "width .4s" }} />
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
      setLoading(true); setErr(""); setResults([]); setProgress(0);
      try {
        const out = await generateLargeBatch(opts.buildSystem(count, extra), input, count, setProgress);
        setResults(out);
      } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
    }

    return (
      <div>
        {opts.intro && (
          <div style={{ background: `${opts.intro.color || C.orange}12`, border: `1px solid ${opts.intro.color || C.orange}33`, borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: opts.intro.color || C.orange, marginBottom: 4 }}>{opts.intro.title}</div>
            <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>{opts.intro.desc}</p>
          </div>
        )}
        <Txt label={opts.inputLabel} value={input} onChange={setInput} placeholder={opts.inputPlaceholder} rows={opts.rows || 3} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 16 }}>
          <div><Label>Count</Label>
            <Sel value={count} onChange={e => setCount(+e.target.value)}>
              {COUNT_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </Sel></div>
          {(opts.fields || []).map(f => (
            <div key={f.key}><Label>{f.label}</Label>
              <Sel value={extra[f.key] || f.opts[0]} onChange={e => setExtra(p => ({ ...p, [f.key]: e.target.value }))}>
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </Sel></div>
          ))}
        </div>
        <Btn onClick={run} loading={loading} disabled={!input.trim()} label={opts.buttonLabel} color={opts.color} />
        {loading && <ProgressBar value={progress} />}
        <Err msg={err} />
        {results.length > 0 && (<><ExportBar prompts={results} />{results.map((r, i) => <Card key={i} text={r} index={i} total={results.length} badge={opts.badge} />)}</>)}
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

  const subjects = batchInput.split("\n").map(s => s.trim()).filter(Boolean);

  async function run() {
    if (!subjects.length) return;
    setLoading(true); setErr(""); setResults([]); setProgress(0);
    const all: { subject: string; prompts: string[] }[] = [];
    try {
      for (let i = 0; i < subjects.length; i++) {
        const prompts = await generateLargeBatch(
          `Expert AI image prompt generator for ${platform}. Generate exactly {{COUNT}} distinct, commercially viable, microstock-ready prompts. Style: ${style}. Adobe Stock compliant — no copyrighted content, no identifiable people. Return ONLY numbered prompts.`,
          subjects[i], count,
          (p) => setProgress(Math.round(((i + p / 100) / subjects.length) * 100))
        );
        all.push({ subject: subjects[i], prompts });
      }
      setResults(all);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  const all = results.flatMap(r => r.prompts);
  return (
    <div>
      <div style={{ background: `linear-gradient(135deg,${C.orange}18,${C.purple}18)`, border: `1px solid ${C.orange}33`, borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>⚡ Bulk Image Prompt Generator</div>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>Enter subjects (one per line) and generate multiple AI prompts for each.</p>
      </div>
      <Txt label="Enter Subjects (one per line)" value={batchInput} onChange={setBatchInput} placeholder="business team meeting&#10;sunset beach&#10;coffee shop interior" rows={8} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 16 }}>
        <div><Label>Art Style</Label>
          <Sel value={style} onChange={e => setStyle(e.target.value)}>
            {["photorealistic", "cinematic", "illustration", "digital art", "oil painting", "watercolor", "3D render", "concept art"].map(s => <option key={s}>{s}</option>)}
          </Sel></div>
        <div><Label>Platform</Label>
          <Sel value={platform} onChange={e => setPlatform(e.target.value)}>
            {["Midjourney", "DALL-E 3", "Stable Diffusion", "Firefly", "Leonardo AI"].map(s => <option key={s}>{s}</option>)}
          </Sel></div>
        <div><Label>Prompts per Subject</Label>
          <Sel value={count} onChange={e => setCount(+e.target.value)}>
            {COUNT_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </Sel></div>
      </div>
      {subjects.length > 0 && (
        <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{subjects.length} subject{subjects.length !== 1 ? "s" : ""} queued</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>Will generate ~{subjects.length * count} prompts</div>
        </div>
      )}
      <Btn onClick={run} loading={loading} disabled={!subjects.length} label={`⚡ Generate ${subjects.length * count || ""} Prompts`} />
      {loading && <ProgressBar value={progress} />}
      <Err msg={err} />
      {results.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <ExportBar prompts={all} />
          {results.map((r, gi) => (
            <div key={gi} style={{ marginBottom: 20 }}>
              <Divider label={`Subject: ${r.subject}`} />
              {r.prompts.map((p, i) => <Card key={i} text={p} index={i} total={r.prompts.length} />)}
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
    { key: "style", label: "Art Style", opts: ["photorealistic", "cinematic", "digital art", "oil painting", "watercolor", "3D render", "anime", "illustration", "concept art", "sketch"] },
    { key: "mood", label: "Mood", opts: ["any", "dramatic", "serene", "melancholic", "joyful", "mysterious", "epic", "romantic", "eerie", "playful"] },
  ],
  buildSystem: (count, extra) =>
    `Expert AI image prompt generator for Adobe Stock. Generate exactly {{COUNT}} distinct microstock prompts. Style: ${extra.style}. Mood: ${extra.mood === "any" ? "varied" : extra.mood}. Each 2-4 sentences with visual detail, lighting, composition. No copyrighted content. Return ONLY numbered prompts.`,
});

const JPGCreator = makeGenerator({
  intro: { title: "📷 JPG Creator (Microstock)", desc: "Optimized JPG photo prompts: real-world scenes, commercial appeal, royalty-free.", color: undefined },
  inputLabel: "Topic / Subject",
  inputPlaceholder: "lifestyle, business, food, travel, fitness…",
  buttonLabel: "📷 Generate JPG Prompts",
  defaultExtra: { orientation: "landscape", lighting: "natural daylight", market: "Adobe Stock" },
  fields: [
    { key: "orientation", label: "Orientation", opts: ["landscape", "portrait", "square 1:1"] },
    { key: "lighting", label: "Lighting", opts: ["natural daylight", "golden hour", "studio softbox", "overcast", "blue hour", "indoor window light"] },
    { key: "market", label: "Marketplace", opts: ["Adobe Stock", "Shutterstock", "Getty", "iStock", "Alamy"] },
  ],
  buildSystem: (count, extra) =>
    `Expert microstock photographer for ${extra.market}. Generate exactly {{COUNT}} commercially viable JPG photo prompts. Each prompt must specify: photorealistic high-resolution JPG, ${extra.orientation} orientation, ${extra.lighting}, sharp focus, professional composition, shallow DOF when relevant, lens (35mm/50mm/85mm), color grading. Strictly NO logos, brands, celebrities, watermarks, copyrighted content, recognizable faces. Suitable for ${extra.market} royalty-free licensing. Return ONLY numbered prompts.`,
  badge: "JPG",
});

const PNGCreator = makeGenerator({
  intro: { title: "🟦 PNG Creator (Transparent Microstock)", desc: "Clean PNG prompts with transparent backgrounds — icons, cutouts, stickers, design assets.", color: undefined },
  inputLabel: "Subject / Asset",
  inputPlaceholder: "coffee cup, leaf, abstract shape, business icon…",
  buttonLabel: "🟦 Generate PNG Prompts",
  defaultExtra: { style: "flat vector", usage: "design asset", bg: "transparent" },
  fields: [
    { key: "style", label: "Style", opts: ["flat vector", "3D render", "isometric", "watercolor cutout", "line art", "sticker", "clay 3D", "paper cut"] },
    { key: "usage", label: "Usage", opts: ["design asset", "icon", "sticker", "illustration", "logo element", "UI graphic"] },
    { key: "bg", label: "Background", opts: ["transparent", "pure white removable", "alpha channel"] },
  ],
  buildSystem: (count, extra) =>
    `Expert microstock illustrator. Generate exactly {{COUNT}} PNG asset prompts. Each must specify: ${extra.style}, ${extra.usage}, isolated on ${extra.bg} background, clean edges suitable for alpha cutout, no shadows touching edges, vector-clean composition, commercial royalty-free quality for Adobe Stock / Shutterstock. NO copyrighted IP, NO faces, NO brands. Output should be PNG-ready with transparency. Return ONLY numbered prompts.`,
  badge: "PNG",
});

const SilhouetteFinder = makeGenerator({
  intro: { title: "🎯 Silhouette Finder", desc: "Clean silhouette prompts optimized for stock, logos, icons.", color: undefined },
  inputLabel: "Subject / Object",
  inputPlaceholder: "flying eagle, running horse, yoga woman…",
  buttonLabel: "🔍 Find Silhouette Prompts",
  defaultExtra: { style: "clean vector", bg: "pure white" },
  fields: [
    { key: "bg", label: "Background", opts: ["pure white", "transparent", "light gray", "cream white"] },
    { key: "style", label: "Style", opts: ["clean vector", "flat design", "detailed illustration", "minimalist", "geometric", "bold graphic"] },
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
  fields: [{ key: "mode", label: "Variation Type", opts: ["mixed", "style", "mood", "composition", "era", "color"] }],
  buildSystem: (_c, extra) => {
    const modes: any = { style: "vary art style/medium dramatically", mood: "vary mood/time/atmosphere", composition: "vary camera angle/framing", era: "vary historical period", color: "vary color palette", mixed: "vary style, mood, lighting, composition" };
    return `Create exactly {{COUNT}} distinct variations. Variation type: ${modes[extra.mode]}. Keep core subject. Return ONLY numbered variations.`;
  },
});

// Improver / Expander / Fixer / Translator / Brainstormer (single output)
function PromptImprover() {
  const [prompt, setPrompt] = useState(""); const [focus, setFocus] = useState("all");
  const [result, setResult] = useState(""); const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  async function run() {
    if (!prompt.trim()) return; setLoading(true); setErr(""); setResult(""); setAnalysis("");
    try {
      const text = await callAI(`Expert AI prompt engineer. Improve the prompt, focus: ${focus === "all" ? "lighting, composition, style, mood, technical details" : focus}. Respond EXACTLY:\nANALYSIS: [2-3 sentences on weaknesses]\nIMPROVED: [full improved prompt]`, prompt);
      const a = text.match(/ANALYSIS:\s*(.*?)(?=IMPROVED:|$)/s); const b = text.match(/IMPROVED:\s*(.*)/s);
      setAnalysis(a?.[1]?.trim() || ""); setResult(b?.[1]?.trim() || text.trim());
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }
  return (
    <div>
      <Txt label="Original Prompt" value={prompt} onChange={setPrompt} placeholder="Paste your existing prompt…" rows={4} />
      <div style={{ marginBottom: 16 }}><Label>Improvement Focus</Label>
        <Sel value={focus} onChange={e => setFocus(e.target.value)}>
          {[["all", "All Aspects"], ["lighting", "Lighting"], ["composition", "Composition"], ["style", "Style"], ["mood", "Mood"], ["technical", "Technical"], ["color", "Color"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Sel></div>
      <Btn onClick={run} loading={loading} disabled={!prompt.trim()} label="⚡ Improve Prompt" />
      <Err msg={err} />
      {analysis && <div style={{ background: `${C.blue}12`, border: `1px solid ${C.blue}30`, borderRadius: 10, padding: "12px 15px", marginTop: 14 }}><div style={{ fontSize: 10, color: C.blue, textTransform: "uppercase", marginBottom: 5, fontWeight: 700 }}>Analysis</div><p style={{ fontSize: 13, color: C.text, lineHeight: 1.65 }}>{analysis}</p></div>}
      {result && (<><Divider label="Improved Prompt" /><Card text={result} index={0} total={1} /><ExportBar prompts={[result]} /></>)}
    </div>
  );
}

function PromptExpander() {
  const [prompt, setPrompt] = useState(""); const [depth, setDepth] = useState("detailed");
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  async function run() {
    if (!prompt.trim()) return; setLoading(true); setErr("");
    try {
      const depths: any = { brief: "2-3 sentences", detailed: "4-6 sentences rich with detail", cinematic: "full paragraph as movie scene", technical: "full technical specs: lens mm, aperture, ISO" };
      const text = await callAI(`Expand into vivid AI image prompt. Depth: ${depths[depth]}. Return ONLY the expanded prompt.`, prompt);
      setResult(text.trim());
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }
  return (
    <div>
      <Txt label="Short Idea / Prompt" value={prompt} onChange={setPrompt} placeholder="e.g. 'cat in space'" rows={2} />
      <div style={{ marginBottom: 16 }}><Label>Expansion Depth</Label>
        <Sel value={depth} onChange={e => setDepth(e.target.value)}>
          {[["brief", "Brief"], ["detailed", "Detailed"], ["cinematic", "Cinematic"], ["technical", "Technical Specs"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Sel></div>
      <Btn onClick={run} loading={loading} disabled={!prompt.trim()} label="📝 Expand Prompt" />
      <Err msg={err} />
      {result && (<><Divider label="Expanded Prompt" /><Card text={result} index={0} total={1} /><ExportBar prompts={[result]} /></>)}
    </div>
  );
}

function PromptFixer() {
  const [prompt, setPrompt] = useState(""); const [issue, setIssue] = useState("");
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  async function run() {
    if (!prompt.trim()) return; setLoading(true); setErr("");
    try {
      const text = await callAI(`Analyze and fix all issues. Respond EXACTLY:\nISSUES FOUND: [bullet list]\nFIXED PROMPT: [repaired prompt]`, issue.trim() ? `Prompt: ${prompt}\nIssue: ${issue}` : prompt);
      setResult(text.trim());
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }
  return (
    <div>
      <Txt label="Prompt to Fix" value={prompt} onChange={setPrompt} placeholder="Paste a problematic prompt…" rows={4} />
      <Txt label="Describe Problem (optional)" value={issue} onChange={setIssue} placeholder="e.g. too generic…" rows={2} />
      <Btn onClick={run} loading={loading} disabled={!prompt.trim()} label="🛠 Fix Prompt" />
      <Err msg={err} />
      {result && (<><Divider label="Diagnosis & Fix" /><Card text={result} index={0} total={1} /></>)}
    </div>
  );
}

function PromptTranslator() {
  const [prompt, setPrompt] = useState(""); const [lang, setLang] = useState("Spanish");
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  async function run() {
    if (!prompt.trim()) return; setLoading(true); setErr("");
    try {
      const text = await callAI(`Translate this AI image prompt into ${lang}. Keep technical terms (bokeh, HDR, f/1.8) in English. Return ONLY the translated prompt.`, prompt);
      setResult(text.trim());
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }
  return (
    <div>
      <Txt label="Prompt to Translate" value={prompt} onChange={setPrompt} placeholder="Enter your English prompt…" rows={4} />
      <div style={{ marginBottom: 16 }}><Label>Target Language</Label>
        <Sel value={lang} onChange={e => setLang(e.target.value)}>
          {["Spanish", "French", "German", "Japanese", "Portuguese", "Italian", "Chinese", "Korean", "Arabic", "Hindi", "Russian", "Turkish", "Bengali"].map(l => <option key={l}>{l}</option>)}
        </Sel></div>
      <Btn onClick={run} loading={loading} disabled={!prompt.trim()} label="🌐 Translate" />
      <Err msg={err} />
      {result && (<><Divider label={`Translated (${lang})`} /><Card text={result} index={0} total={1} /><ExportBar prompts={[result]} /></>)}
    </div>
  );
}

function Brainstormer() {
  const [theme, setTheme] = useState(""); const [angle, setAngle] = useState("unexpected");
  const [count, setCount] = useState(10);
  const [results, setResults] = useState<string[]>([]); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  const [progress, setProgress] = useState(0);
  async function run() {
    if (!theme.trim()) return; setLoading(true); setErr(""); setProgress(0);
    try {
      const angles: any = { unexpected: "go beyond obvious", emotional: "focus on emotion", abstract: "abstract/symbolic", narrative: "imply backstory", technical: "technical excellence" };
      const out = await generateLargeBatch(`Generate exactly {{COUNT}} diverse creative concept directions. Approach: ${angles[angle]}. Each: vivid 2-3 sentence creative concept. Return ONLY numbered ideas.`, theme, count, setProgress);
      setResults(out);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }
  return (
    <div>
      <Txt label="Theme or Subject" value={theme} onChange={setTheme} placeholder="'solitude', 'ancient technology'…" rows={2} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div><Label>Creative Angle</Label>
          <Sel value={angle} onChange={e => setAngle(e.target.value)}>
            {[["unexpected", "🎲 Unexpected"], ["emotional", "❤️ Emotional"], ["abstract", "🌀 Abstract"], ["narrative", "📖 Narrative"], ["technical", "🎯 Technical"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Sel></div>
        <div><Label>Count</Label>
          <Sel value={count} onChange={e => setCount(+e.target.value)}>
            {COUNT_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </Sel></div>
      </div>
      <Btn onClick={run} loading={loading} disabled={!theme.trim()} label="🧠 Brainstorm Ideas" />
      {loading && <ProgressBar value={progress} />}
      <Err msg={err} />
      {results.length > 0 && (<><ExportBar prompts={results} />{results.map((r, i) => <Card key={i} text={r} index={i} total={results.length} />)}</>)}
    </div>
  );
}

// ── Library ───────────────────────────────────────────────────────────────────
const LIBRARY: Record<string, string[]> = {
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
};

function PromptLibrary() {
  const [copied, setCopied] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const cats = Object.keys(LIBRARY);
  const filtered = cat ? { [cat]: LIBRARY[cat] } : LIBRARY;
  return (
    <div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
        <Chip label="All" active={!cat} onClick={() => setCat(null)} />
        {cats.map(c => <Chip key={c} label={c} active={cat === c} onClick={() => setCat(cat === c ? null : c)} />)}
      </div>
      {Object.entries(filtered).map(([c, prompts]) => (
        <div key={c} style={{ marginBottom: 26 }}>
          <h3 style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "1.1px", color: C.muted, marginBottom: 10, fontWeight: 700 }}>{c}</h3>
          {prompts.map((p, i) => {
            const k = `${c}-${i}`;
            return (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "13px 15px", marginBottom: 8, position: "relative" }}>
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.68, paddingRight: 75 }}>{p}</p>
                <button onClick={() => { copy(p); setCopied(k); setTimeout(() => setCopied(null), 1500); }} style={{ position: "absolute", top: 11, right: 11, background: copied === k ? "rgba(34,197,94,.12)" : C.card2, border: `1px solid ${copied === k ? "rgba(34,197,94,.4)" : C.border2}`, color: copied === k ? C.green : C.muted, borderRadius: 7, padding: "4px 11px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
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
function Settings({ themeKey, setThemeKey }: { themeKey: ThemeKey; setThemeKey: (t: ThemeKey) => void }) {
  return (
    <div>
      <div style={{ background: `${C.orange}12`, border: `1px solid ${C.orange}33`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, marginBottom: 6 }}>⚡ How AI Works Here</div>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>All tools run on <strong style={{ color: C.text }}>Lovable AI Gateway</strong> — zero setup, zero API keys needed. Just generate.</p>
      </div>

      <Divider label="Theme" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
        {(Object.keys(THEMES) as ThemeKey[]).map(k => {
          const t = THEMES[k];
          const active = themeKey === k;
          const label = k === "simple" ? "Simple ☀" : k === "sweet" ? "Sweet (Default) ✦" : "Futuristic ⚡";
          return (
            <button key={k} onClick={() => setThemeKey(k)} style={{
              background: active ? `linear-gradient(135deg,${t.orange}22,${t.purple}22)` : t.card,
              border: `2px solid ${active ? t.orange : t.border2}`,
              borderRadius: 14, padding: "16px 18px", cursor: "pointer", textAlign: "left",
              fontFamily: "inherit", transition: "all .18s",
              boxShadow: active ? `0 8px 30px ${t.orange}33` : "none",
            }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {[t.bg, t.card, t.orange, t.purple, t.text].map((col, i) => (
                  <span key={i} style={{ width: 22, height: 22, borderRadius: 6, background: col, border: `1px solid ${t.border}` }} />
                ))}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{label}</div>
              <div style={{ fontSize: 11.5, color: t.muted, marginTop: 4 }}>
                {k === "simple" && "Clean light interface"}
                {k === "sweet" && "Original dark warmth"}
                {k === "futuristic" && "Neon cyber HUD"}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, padding: "13px 15px", marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: "uppercase" }}>🔒 Privacy</div>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.65 }}>Your theme preference is saved locally. AI requests go through the secure Lovable AI Gateway.</p>
      </div>
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "🖼", title: "Bulk Image Prompt Generator", desc: "Up to 200 prompts per subject", id: "bulk" },
  { icon: "💡", title: "Idea Generator", desc: "Turn concepts into AI-ready prompts", id: "idea" },
  { icon: "📷", title: "JPG Creator", desc: "Microstock-ready photo prompts", id: "jpg" },
  { icon: "🟦", title: "PNG Creator", desc: "Transparent PNG asset prompts", id: "png" },
  { icon: "📚", title: "Prompt Library", desc: "Curated prompts by category", id: "library" },
  { icon: "⚡", title: "Prompt Improver", desc: "AI-powered prompt analysis", id: "improver" },
  { icon: "🔀", title: "Prompt Variations", desc: "Many angles from one prompt", id: "variations" },
  { icon: "🔍", title: "Silhouette Finder", desc: "Clean isolated silhouettes", id: "silhouette" },
];

function HomePage({ setPage }: { setPage: (p: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 40px 60px", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: `radial-gradient(ellipse at center, ${C.orange}22 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 100, left: "10%", width: 200, height: 200, background: `radial-gradient(ellipse at center, ${C.purple}22 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.orangeSoft, border: `1px solid ${C.orange}44`, borderRadius: 20, padding: "5px 16px", fontSize: 12.5, color: C.orange, fontWeight: 600, marginBottom: 24, position: "relative" }}>
          ✦ AI-Powered Microstock Prompt Studio
        </div>
        <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(36px,7vw,72px)", fontWeight: 800, color: C.text, lineHeight: 1.08, marginBottom: 24, letterSpacing: "-2px", position: "relative" }}>
          Generate AI Prompts<br /><span style={{ color: C.orange }}>at Scale</span>
        </h1>
        <p style={{ fontSize: "clamp(15px,2vw,18px)", color: C.muted, maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7, position: "relative" }}>
          JPG, PNG, silhouettes — bulk generate microstock-ready prompts from 5 to 200 at a time.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
          <button onClick={() => setPage("bulk")} style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 12, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 6px 30px ${C.orange}55` }}>🖼 Bulk Generator →</button>
          <button onClick={() => setPage("jpg")} style={{ background: C.purple, color: "#fff", border: "none", borderRadius: 12, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 6px 30px ${C.purple}55` }}>📷 JPG Creator →</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px 80px" }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 800, color: C.orange, textAlign: "center", marginBottom: 40, letterSpacing: "-1px" }}>All Tools</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 18 }}>
          {FEATURES.map(f => (
            <div key={f.id} onClick={() => setPage(f.id)}
              onMouseEnter={() => setHover(f.id)} onMouseLeave={() => setHover(null)}
              style={{ background: hover === f.id ? C.card2 : C.card, border: `1px solid ${hover === f.id ? C.orange + "55" : C.border}`, borderRadius: 14, padding: "24px 22px", cursor: "pointer", transition: "all .18s", transform: hover === f.id ? "translateY(-3px)" : "none", boxShadow: hover === f.id ? `0 8px 30px ${C.orange}22` : "none" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg,${C.orange}44,${C.purple}33)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 7, fontFamily: "var(--display)" }}>{f.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
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
    <nav style={{ background: C.nav, borderBottom: `1px solid ${C.border}`, padding: "0 32px", display: "flex", alignItems: "center", height: 58, position: "sticky", top: 0, zIndex: 100, gap: 8, backdropFilter: "blur(10px)" }}>
      <button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginRight: 16 }}>
        <span style={{ fontSize: 20, color: C.orange }}>✦</span>
        <span style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: "-.5px" }}>Sweet Prompts</span>
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, flexWrap: "wrap" }}>
        <NavBtn label="Home" active={page === "home"} onClick={() => setPage("home")} />
        <Dropdown label="Creators" open={crOpen} setOpen={setCrOpen} items={CREATORS} setPage={setPage} active={CREATORS.some(c => c.id === page)} />
        <Dropdown label="AI Tools" open={aiOpen} setOpen={setAiOpen} items={AI_TOOLS} setPage={setPage} active={AI_TOOLS.some(c => c.id === page)} />
        <NavBtn label="Library" active={page === "library"} onClick={() => setPage("library")} />
        <NavBtn label="Settings" active={page === "settings"} onClick={() => setPage("settings")} />
      </div>
    </nav>
  );
}

function NavBtn({ label, active, onClick }: any) {
  return <button onClick={onClick} style={{ background: active ? C.orangeSoft : "none", border: `1px solid ${active ? C.orange + "55" : "transparent"}`, borderRadius: 8, color: active ? C.orange : C.muted, padding: "5px 12px", fontSize: 13.5, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>;
}

function Dropdown({ label, open, setOpen, items, setPage, active }: any) {
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: open || active ? C.orangeSoft : "none", border: `1px solid ${open || active ? C.orange + "55" : "transparent"}`, borderRadius: 8, color: open || active ? C.orange : C.muted, padding: "5px 12px", fontSize: 13.5, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
        {label} <span style={{ fontSize: 11, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>▾</span>
      </button>
      {open && (
        <div onMouseLeave={() => setOpen(false)} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: C.nav, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "8px 0", minWidth: 210, boxShadow: `0 12px 40px rgba(0,0,0,.4)`, zIndex: 200 }}>
          {items.map((t: any) => (
            <button key={t.id} onClick={() => { setPage(t.id); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", color: C.muted, padding: "8px 16px", fontSize: 13.5, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
              onMouseEnter={e => { e.currentTarget.style.background = C.card2; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.muted; }}>
              {t.icon && <span style={{ fontSize: 14 }}>{t.icon}</span>}{t.label}
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
  bulk: { title: "Bulk Image Prompt Generator", desc: "Generate microstock-ready prompts for many subjects at once" },
  idea: { title: "Idea Generator", desc: "Turn any concept into dozens of AI-ready prompts" },
  jpg: { title: "JPG Creator", desc: "Microstock photo prompts for Adobe Stock, Shutterstock, Getty" },
  png: { title: "PNG Creator", desc: "Transparent PNG asset prompts for design marketplaces" },
  library: { title: "Prompt Library", desc: "Browse curated prompts by category" },
  improver: { title: "Prompt Improver", desc: "Analyze and enhance existing prompts" },
  variations: { title: "Prompt Variations", desc: "Many creative angles from one prompt" },
  expander: { title: "Prompt Expander", desc: "Turn short ideas into rich detailed prompts" },
  fixer: { title: "Prompt Fixer", desc: "Diagnose and fix weak prompts" },
  translator: { title: "Prompt Translator", desc: "Translate prompts into any language" },
  brainstorm: { title: "Brainstormer", desc: "Generate creative directions" },
  silhouette: { title: "Silhouette Finder", desc: "Clean isolated silhouette prompts" },
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
    settings: <Settings themeKey={themeKey} setThemeKey={setThemeKey} />,
  };
  return pages[page] || null;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [themeKey, setThemeKeyRaw] = useState<ThemeKey>(() => (tryLoad("sp_theme", "sweet") as ThemeKey));
  CURRENT = THEMES[themeKey];
  function setThemeKey(t: ThemeKey) { setThemeKeyRaw(t); trySave("sp_theme", t); CURRENT = THEMES[t]; }

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
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; font-family: ${bodyFont}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 4px; }
        select option { background: ${C.card}; color: ${C.text}; }
        ::placeholder { color: ${C.dim}; opacity: 1; }
        ${isFuturistic ? `
          body { background-image: radial-gradient(circle at 20% 10%, ${C.orange}11 0%, transparent 50%), radial-gradient(circle at 80% 90%, ${C.purple}11 0%, transparent 50%); }
          h1, h2 { text-shadow: 0 0 20px ${C.orangeGlow}; }
        ` : ""}
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: bodyFont }}>
        <Navbar page={page} setPage={setPage} />
        {page === "home" ? (
          <HomePage setPage={setPage} />
        ) : (
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 80px", animation: "fadeUp .22s ease" }}>
            {meta.title && (
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontFamily: displayFont, fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 6, letterSpacing: "-.8px" }}>{meta.title}</h1>
                {meta.desc && <p style={{ fontSize: 14, color: C.muted }}>{meta.desc}</p>}
              </div>
            )}
            <PageContent page={page} themeKey={themeKey} setThemeKey={setThemeKey} />
          </div>
        )}
      </div>
    </>
  );
}

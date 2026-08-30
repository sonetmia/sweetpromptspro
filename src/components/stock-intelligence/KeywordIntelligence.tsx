import { useState } from "react";
import { generateKeywords } from "./api";
import { aiErrorMessage } from "@/lib/ai/errors";

export default function KeywordIntelligence() {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("Photo");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await generateKeywords(topic, contentType);
      setResult(res);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderKeywordList = (title: string, keywords: string[]) => {
    if (!keywords || !keywords.length) return null;
    const textToCopy = keywords.join(", ");
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          padding: 20,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#a78bfa" }}>
            {title} ({keywords.length})
          </h3>
          <button
            onClick={() => copyToClipboard(textToCopy)}
            style={{
              background: "none",
              border: "none",
              color: "#60a5fa",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Copy All
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {keywords.map((kw, i) => (
            <span
              key={i}
              style={{
                padding: "4px 10px",
                background: "rgba(255,255,255,0.1)",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Keyword Intelligence</h2>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
        Research, validate, and organize keywords for your stock assets using AI relevance scoring.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Describe the image/topic..."
          style={{
            flex: 2,
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            outline: "none",
          }}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            outline: "none",
          }}
        >
          <option value="Photo">Photo</option>
          <option value="Vector">Vector</option>
          <option value="Illustration">Illustration</option>
          <option value="Background">Background</option>
        </select>
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          style={{
            background: loading ? "rgba(255,255,255,0.1)" : "#f5841f",
            color: "#fff",
            padding: "0 24px",
            borderRadius: 8,
            fontWeight: 600,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate Keywords"}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "#ef4444",
            padding: 16,
            background: "rgba(239,68,68,0.1)",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <button
              onClick={() => {
                const all = [
                  ...(result.primary || []),
                  ...(result.secondary || []),
                  ...(result.longTail || []),
                  ...(result.concepts || []),
                ];
                copyToClipboard(all.join(", "));
              }}
              style={{
                background: "rgba(96,165,250,0.1)",
                color: "#60a5fa",
                border: "1px solid rgba(96,165,250,0.2)",
                padding: "6px 16px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Copy All (
              {
                [
                  ...(result.primary || []),
                  ...(result.secondary || []),
                  ...(result.longTail || []),
                  ...(result.concepts || []),
                ].length
              }
              )
            </button>
          </div>
          {renderKeywordList("Primary Keywords", result.primary)}
          {renderKeywordList("Secondary Keywords", result.secondary)}
          {renderKeywordList("Long-tail Phrases", result.longTail)}
          {renderKeywordList("Conceptual Keywords", result.concepts)}
        </div>
      )}
    </div>
  );
}

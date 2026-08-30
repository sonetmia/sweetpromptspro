import { useState } from "react";
import { simulateSearch } from "./api";
import { aiErrorMessage } from "@/lib/ai/errors";

export default function SearchSimulator() {
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSimulate = async () => {
    if (!topic.trim() || !title.trim() || !keywords.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await simulateSearch(topic, title, keywords);
      setResult(res);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Stock Search Simulator</h2>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
        Test how well your metadata aligns with a specific search intent. <br />
        <strong style={{ color: "#fbbf24" }}>
          Note: This is an AI analysis tool, not an official Adobe ranking system.
        </strong>
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginBottom: 24,
          maxWidth: 800,
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: 6, color: "#a78bfa", fontWeight: 600 }}>
            Target Search Intent
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Happy diverse business team meeting"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, color: "#a78bfa", fontWeight: 600 }}>
            Your Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Multiethnic corporate team analyzing financial data"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 6, color: "#a78bfa", fontWeight: 600 }}>
            Your Keywords
          </label>
          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., business, team, meeting, corporate, diverse, happy..."
            rows={3}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>
        <button
          onClick={handleSimulate}
          disabled={loading}
          style={{
            background: loading ? "rgba(255,255,255,0.1)" : "#f5841f",
            color: "#fff",
            padding: "14px",
            borderRadius: 8,
            fontWeight: 600,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Simulating Search..." : "Run Analysis"}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div
              style={{
                background: "rgba(34,197,94,0.1)",
                padding: 20,
                borderRadius: 12,
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <h4
                style={{
                  color: "#4ade80",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ✅ Strong Matches
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.strongMatches?.map((t: string, i: number) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 8px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 4,
                      fontSize: 13,
                    }}
                  >
                    {t}
                  </span>
                ))}
                {(!result.strongMatches || result.strongMatches.length === 0) && (
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    None detected.
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                padding: 20,
                borderRadius: 12,
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <h4
                style={{
                  color: "#f87171",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ❌ Missing Concepts
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.missingConcepts?.map((t: string, i: number) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 8px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 4,
                      fontSize: 13,
                    }}
                  >
                    {t}
                  </span>
                ))}
                {(!result.missingConcepts || result.missingConcepts.length === 0) && (
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    None detected.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(251,191,36,0.1)",
              padding: 20,
              borderRadius: 12,
              border: "1px solid rgba(251,191,36,0.2)",
            }}
          >
            <h4
              style={{
                color: "#fcd34d",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ⚠️ Weak or Irrelevant Terms
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {result.weakTerms?.map((t: string, i: number) => (
                <span
                  key={i}
                  style={{
                    padding: "4px 8px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 4,
                    fontSize: 13,
                  }}
                >
                  {t}
                </span>
              ))}
              {(!result.weakTerms || result.weakTerms.length === 0) && (
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>None detected.</span>
              )}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              padding: 24,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <h4 style={{ color: "#a78bfa", marginBottom: 12 }}>Suggested Improvements</h4>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
              {result.suggestedImprovements}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

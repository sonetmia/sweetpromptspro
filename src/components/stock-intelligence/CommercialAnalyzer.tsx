import { useState } from "react";
import { analyzeCommercialValue } from "./api";
import { aiErrorMessage } from "@/lib/ai/errors";

export default function CommercialAnalyzer() {
  const [concept, setConcept] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!concept.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await analyzeCommercialValue(concept);
      setResult(res);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: string | number) => {
    const num = typeof score === "string" ? parseInt(score, 10) : score;
    if (isNaN(num)) return "#fff";
    if (num >= 80) return "#22c55e";
    if (num >= 60) return "#fbbf24";
    return "#ef4444";
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Commercial Value Analyzer</h2>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
        Evaluate the commercial suitability and versatility of an image concept.
        <br />
        <strong style={{ color: "#fbbf24" }}>
          Note: This is a Commercial Suitability Estimate, NOT a guarantee of sales or earnings.
        </strong>
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "flex-start" }}>
        <textarea
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Describe your image concept (e.g., 'A modern diverse business team having a meeting in a bright, sunny office with lots of copy space on the right')..."
          rows={3}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            outline: "none",
            resize: "vertical",
          }}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !concept.trim()}
          style={{
            background: loading ? "rgba(255,255,255,0.1)" : "#f5841f",
            height: 70,
            color: "#fff",
            padding: "0 24px",
            borderRadius: 8,
            fontWeight: 600,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Analyzing..." : "Analyze Value"}
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
        <div style={{ display: "flex", gap: 24, flexDirection: "column" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              padding: 32,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.05)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              Commercial Suitability Estimate
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: getScoreColor(result.overallScore),
                lineHeight: 1,
              }}
            >
              {result.overallScore}
            </div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
              out of 100
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 12 }}>
              <h4
                style={{
                  color: "#a78bfa",
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Concept Clarity</span>
                <span>{result.clarity?.split(" ")[0]}</span>
              </h4>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                {result.clarity?.substring(result.clarity.indexOf(" ") + 1)}
              </p>
            </div>

            <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 12 }}>
              <h4
                style={{
                  color: "#a78bfa",
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Versatility</span>
                <span>{result.versatility?.split(" ")[0]}</span>
              </h4>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                {result.versatility?.substring(result.versatility.indexOf(" ") + 1)}
              </p>
            </div>

            <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 12 }}>
              <h4
                style={{
                  color: "#a78bfa",
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Copy Space</span>
                <span>{result.copySpace?.split(" ")[0]}</span>
              </h4>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                {result.copySpace?.substring(result.copySpace.indexOf(" ") + 1)}
              </p>
            </div>

            <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 12 }}>
              <h4 style={{ color: "#a78bfa", marginBottom: 8 }}>Seasonal Value</h4>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{result.seasonalValue}</p>
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
            <h4 style={{ fontSize: 16, color: "#f5841f", marginBottom: 12 }}>Market Insights</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <strong style={{ color: "#fff" }}>Target Buyers:</strong>{" "}
                <span style={{ color: "rgba(255,255,255,0.7)" }}>
                  {result.commercialApplicability}
                </span>
              </div>
              <div>
                <strong style={{ color: "#fff" }}>Niche Usefulness:</strong>{" "}
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{result.nicheUsefulness}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

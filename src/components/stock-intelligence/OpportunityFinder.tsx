import { useState } from "react";
import { analyzeTopic } from "./api";
import { aiErrorMessage } from "@/lib/ai/errors";

export default function OpportunityFinder() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleGenerate = async (count: number) => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await analyzeTopic(topic, count);
      setResult(res);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Opportunity Finder</h2>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
        Enter a topic (e.g., "Back to School") to generate AI-assisted microstock opportunities.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic..."
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            outline: "none",
          }}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate(20)}
        />
        <button
          onClick={() => handleGenerate(20)}
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
          {loading ? "Analyzing..." : "Generate 20 Opportunities"}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              padding: 24,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <h3 style={{ fontSize: 18, color: "#a78bfa", marginBottom: 16 }}>Niche Analysis</h3>
            <p>
              <strong>Niche:</strong> {result.niche}
            </p>
            <p>
              <strong>Sub-niches:</strong> {result.subNiches?.join(", ")}
            </p>
            <p>
              <strong>Search Terms:</strong> {result.relatedSearchTerms?.join(", ")}
            </p>
            <p>
              <strong>Saturation Estimate:</strong>{" "}
              <span style={{ opacity: 0.7 }}>(AI Estimate)</span> {result.saturationEstimate}
            </p>
            <p>
              <strong>Seasonal Relevance:</strong> {result.seasonalRelevance}
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 18, color: "#a78bfa", marginBottom: 16 }}>
              Content Opportunities
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {result.opportunities?.map((opp: any, i: number) => (
                <div
                  key={i}
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
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <h4 style={{ fontSize: 16, fontWeight: 600 }}>{opp.title}</h4>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "4px 8px",
                        background: "rgba(167,139,250,0.2)",
                        color: "#a78bfa",
                        borderRadius: 999,
                      }}
                    >
                      {opp.contentType}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
                    <strong>Concept:</strong> {opp.concept}
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.6)",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <strong>Buyer/Use:</strong> {opp.buyerUseCase}
                    </div>
                    <div>
                      <strong>Composition:</strong> {opp.composition}
                    </div>
                    <div>
                      <strong>Copy Space:</strong> {opp.copySpace}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: "monospace",
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      <strong style={{ color: "#fff" }}>Prompt Base:</strong>{" "}
                      {opp.promptReadyConcept}
                    </div>
                    <div>
                      <strong style={{ color: "#fff" }}>Metadata Title:</strong>{" "}
                      {opp.metadataReadyConcept}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

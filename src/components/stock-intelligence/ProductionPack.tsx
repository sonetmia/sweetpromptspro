import { useState } from "react";
import { generateProductionPack } from "./api";

export default function ProductionPack() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleGenerate = async (count: number) => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await generateProductionPack(topic, count);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Prompt → Production Pack</h2>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
        Turn a single topic into a complete stock production package (prompts, negative prompts,
        metadata, composition guidelines).
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter your shoot topic (e.g., 'Sustainable agriculture in modern farming')..."
          style={{
            flex: "1 1 300px",
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            outline: "none",
          }}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate(1)}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => handleGenerate(1)}
            disabled={loading || !topic.trim()}
            style={{
              background: loading ? "rgba(255,255,255,0.1)" : "#f5841f",
              color: "#fff",
              padding: "0 20px",
              borderRadius: 8,
              fontWeight: 600,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Generating..." : "Generate 1 Pack"}
          </button>
          <button
            onClick={() => handleGenerate(10)}
            disabled={loading || !topic.trim()}
            style={{
              background: loading ? "rgba(255,255,255,0.1)" : "rgba(245,132,31,0.2)",
              color: loading ? "#fff" : "#f5841f",
              padding: "0 20px",
              borderRadius: 8,
              fontWeight: 600,
              border: loading ? "none" : "1px solid rgba(245,132,31,0.5)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Generate 10
          </button>
          <button
            onClick={() => handleGenerate(20)}
            disabled={loading || !topic.trim()}
            style={{
              background: loading ? "rgba(255,255,255,0.1)" : "rgba(245,132,31,0.2)",
              color: loading ? "#fff" : "#f5841f",
              padding: "0 20px",
              borderRadius: 8,
              fontWeight: 600,
              border: loading ? "none" : "1px solid rgba(245,132,31,0.5)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Generate 20
          </button>
        </div>
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

      {result && result.packs && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                // simple export to json
                const dataStr =
                  "data:text/json;charset=utf-8," +
                  encodeURIComponent(JSON.stringify(result.packs, null, 2));
                const dl = document.createElement("a");
                dl.setAttribute("href", dataStr);
                dl.setAttribute("download", `production_packs.json`);
                dl.click();
              }}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Export JSON
            </button>
          </div>

          {result.packs.map((pack: any, i: number) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                padding: 24,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, color: "#fff", marginBottom: 8 }}>{pack.concept}</h3>
                <div
                  style={{ display: "flex", gap: 12, fontSize: 13, color: "rgba(255,255,255,0.6)" }}
                >
                  <span>
                    <strong style={{ color: "#a78bfa" }}>Ratio:</strong> {pack.aspectRatio}
                  </span>
                  <span>
                    <strong style={{ color: "#a78bfa" }}>Composition:</strong> {pack.composition}
                  </span>
                  <span>
                    <strong style={{ color: "#a78bfa" }}>Copy Space:</strong> {pack.copySpace}
                  </span>
                </div>
              </div>

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 20 }}
              >
                <div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
                  >
                    <strong style={{ color: "#4ade80", fontSize: 14 }}>Generation Prompt</strong>
                    <button
                      onClick={() => copyToClipboard(pack.aiPrompt)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#60a5fa",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <textarea
                    value={pack.aiPrompt}
                    readOnly
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      color: "#fff",
                      resize: "none",
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
                  >
                    <strong style={{ color: "#f87171", fontSize: 14 }}>Negative Prompt</strong>
                    <button
                      onClick={() => copyToClipboard(pack.negativePrompt)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#60a5fa",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <input
                    value={pack.negativePrompt}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      color: "#fff",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: "rgba(167,139,250,0.05)",
                  padding: 16,
                  borderRadius: 8,
                  border: "1px solid rgba(167,139,250,0.2)",
                }}
              >
                <h4 style={{ color: "#a78bfa", marginBottom: 12, fontSize: 15 }}>
                  Metadata Package
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
                    >
                      <strong style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                        Title
                      </strong>
                      <button
                        onClick={() => copyToClipboard(pack.title)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#60a5fa",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <input
                      value={pack.title}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "8px",
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        color: "#fff",
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
                    >
                      <strong style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                        Keywords
                      </strong>
                      <button
                        onClick={() => copyToClipboard(pack.keywords?.join(", "))}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#60a5fa",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <textarea
                      value={pack.keywords?.join(", ")}
                      readOnly
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "8px",
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        color: "#fff",
                        resize: "none",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: "rgba(255,255,255,0.6)", marginRight: 8 }}>
                      Category:
                    </span>{" "}
                    {pack.category}
                  </div>
                  {pack.complianceNotes && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "#fbbf24",
                        background: "rgba(251,191,36,0.1)",
                        padding: "8px",
                        borderRadius: 4,
                      }}
                    >
                      ⚠️ <strong>Compliance Note:</strong> {pack.complianceNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

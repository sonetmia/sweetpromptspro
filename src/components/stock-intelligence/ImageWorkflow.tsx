import { useState } from "react";
import { generateWorkflowData } from "./api";
import { aiErrorMessage } from "@/lib/ai/errors";
import { fileToValidatedDataUrl } from "@/lib/ai/validation";

export default function ImageWorkflow() {
  const [image, setImage] = useState<{ file: File; dataUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"prompt" | "metadata" | "analysis">("prompt");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const f = e.target.files[0];
    try {
      setImage({ file: f, dataUrl: await fileToValidatedDataUrl(f) });
      setResult(null);
      setError("");
    } catch (err) {
      setImage(null);
      setError(aiErrorMessage(err));
    }
  };

  const handleGenerate = async () => {
    if (!image) return;
    setLoading(true);
    setError("");
    try {
      const res = await generateWorkflowData(image.dataUrl);
      setResult(res);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Prompt + Metadata Workflow</h2>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
        Upload an image to extract a detailed reconstruction prompt, optimal stock metadata, and
        commercial quality analysis in one go.
      </p>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              background: "rgba(255,255,255,0.05)",
              border: "1px dashed rgba(255,255,255,0.2)",
              padding: "40px 20px",
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {image ? (
              <img
                src={image.dataUrl}
                style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8, objectFit: "contain" }}
                alt="Upload preview"
              />
            ) : (
              <div>
                <span style={{ color: "#fff", fontWeight: 600 }}>Click to Upload Image</span>
                <br />
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>(JPG, PNG)</span>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg, image/png"
              onChange={handleFile}
              style={{ display: "none" }}
            />
          </label>

          {image && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "rgba(255,255,255,0.1)" : "#f5841f",
                color: "#fff",
                padding: "12px",
                borderRadius: 8,
                fontWeight: 600,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Analyzing..." : "Generate Workflow Data"}
            </button>
          )}

          {error && (
            <div
              style={{
                color: "#ef4444",
                marginTop: 16,
                padding: 16,
                background: "rgba(239,68,68,0.1)",
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {result && (
          <div
            style={{
              flex: 2,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {(["prompt", "metadata", "analysis"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: activeTab === tab ? "rgba(255,255,255,0.05)" : "transparent",
                    border: "none",
                    borderBottom: activeTab === tab ? "2px solid #a78bfa" : "2px solid transparent",
                    color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.5)",
                    fontWeight: activeTab === tab ? 600 : 400,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ padding: 24 }}>
              {activeTab === "prompt" && (
                <div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}
                  >
                    <h3 style={{ fontSize: 16, color: "#a78bfa" }}>Reconstruction Prompt</h3>
                    <button
                      onClick={() => copyToClipboard(result.prompt)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#60a5fa",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <textarea
                    value={result.prompt}
                    readOnly
                    rows={6}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#fff",
                      resize: "none",
                    }}
                  />
                </div>
              )}

              {activeTab === "metadata" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}
                    >
                      <strong style={{ color: "#a78bfa" }}>Title</strong>
                      <button
                        onClick={() => copyToClipboard(result.metadata.title)}
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
                      value={result.metadata.title}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        color: "#fff",
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}
                    >
                      <strong style={{ color: "#a78bfa" }}>
                        Keywords ({result.metadata.keywords?.length || 0})
                      </strong>
                      <button
                        onClick={() => copyToClipboard(result.metadata.keywords?.join(", "))}
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
                      value={result.metadata.keywords?.join(", ")}
                      readOnly
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        color: "#fff",
                        resize: "none",
                      }}
                    />
                  </div>
                  <div>
                    <strong style={{ color: "rgba(255,255,255,0.6)" }}>Category:</strong>{" "}
                    {result.metadata.category}
                  </div>
                </div>
              )}

              {activeTab === "analysis" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                  {Object.entries(result.qualityAnalysis || {}).map(([k, v]) => (
                    <div
                      key={k}
                      style={{ background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 8 }}
                    >
                      <h4
                        style={{ textTransform: "capitalize", color: "#a78bfa", marginBottom: 4 }}
                      >
                        {k.replace(/([A-Z])/g, " $1").trim()}
                      </h4>
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{String(v)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

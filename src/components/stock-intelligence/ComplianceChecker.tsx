import { useState } from "react";
import { checkCompliance } from "./api";
import { aiErrorMessage } from "@/lib/ai/errors";
import { fileToValidatedDataUrl } from "@/lib/ai/validation";

export default function ComplianceChecker() {
  const [image, setImage] = useState<{ file: File; dataUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

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

  const handleCheck = async () => {
    if (!image) return;
    setLoading(true);
    setError("");
    try {
      const res = await checkCompliance(image.dataUrl);
      setResult(res);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: string) => {
    if (score === "Pass") return "#22c55e"; // green
    if (score === "Potential Risk") return "#ef4444"; // red
    return "#fbbf24"; // yellow (Review)
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Stock Compliance Checker</h2>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
        AI-assisted pre-check for logos, artifacts, and IP issues. <br />
        <strong style={{ color: "#fbbf24" }}>
          Note: This analysis is an AI-assisted pre-check and does not guarantee Adobe Stock
          acceptance.
        </strong>
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
              onClick={handleCheck}
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
              {loading ? "Checking..." : "Run Compliance Check"}
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
              flex: 1,
              background: "rgba(255,255,255,0.03)",
              padding: 24,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Stock Readiness Score
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: getScoreColor(result.score) }}>
                {result.score}
              </div>
              <p style={{ marginTop: 8, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                {result.overallNote}
              </p>
            </div>

            {result.warnings && result.warnings.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4
                  style={{
                    color: "#fbbf24",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>⚠️</span> Warnings & Observations
                </h4>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {result.warnings.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.aiArtifacts && (
              <div>
                <h4
                  style={{
                    color: "#a78bfa",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>🤖</span> AI Artifacts Note
                </h4>
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.8)",
                    background: "rgba(0,0,0,0.2)",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  {result.aiArtifacts}
                </p>
              </div>
            )}

            {(!result.warnings || result.warnings.length === 0) && (
              <div
                style={{
                  color: "#22c55e",
                  textAlign: "center",
                  padding: 12,
                  background: "rgba(34,197,94,0.1)",
                  borderRadius: 8,
                }}
              >
                No major compliance issues detected by AI.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

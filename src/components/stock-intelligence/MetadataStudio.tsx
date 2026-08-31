import { useState } from "react";
import { analyzeImageMetadata } from "./api";

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export default function MetadataStudio() {
  const [images, setImages] = useState<
    { file: File; dataUrl: string; result?: any; loading?: boolean; error?: string }[]
  >([]);
  const [processing, setProcessing] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const newImages = await Promise.all(
      newFiles.map(async (f) => ({
        file: f,
        dataUrl: await fileToDataUrl(f),
      })),
    );
    setImages((prev) => [...prev, ...newImages]);
  };

  const processImage = async (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], loading: true, error: undefined };
      return next;
    });

    try {
      const res = await analyzeImageMetadata(images[index].dataUrl);
      setImages((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], loading: false, result: res };
        return next;
      });
    } catch (e: any) {
      setImages((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], loading: false, error: e.message };
        return next;
      });
    }
  };

  const processAll = async () => {
    setProcessing(true);
    // Process sequentially to avoid rate limits
    for (let i = 0; i < images.length; i++) {
      if (!images[i].result && !images[i].loading) {
        await processImage(i);
      }
    }
    setProcessing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Premium Metadata Studio</h2>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
        Upload images to automatically generate Adobe Stock optimized Titles, Descriptions, and
        Keywords.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <label
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px dashed rgba(255,255,255,0.2)",
            padding: "20px 40px",
            borderRadius: 12,
            cursor: "pointer",
            textAlign: "center",
            flex: 1,
            transition: "background 0.2s",
          }}
        >
          <span style={{ color: "#fff", fontWeight: 600 }}>Click to Upload Images</span>
          <br />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>(JPG, PNG)</span>
          <input
            type="file"
            multiple
            accept="image/jpeg, image/png"
            onChange={handleFiles}
            style={{ display: "none" }}
          />
        </label>
        {images.length > 0 && (
          <button
            onClick={processAll}
            disabled={processing}
            style={{
              background: processing ? "rgba(255,255,255,0.1)" : "#f5841f",
              height: "100%",
              color: "#fff",
              padding: "0 30px",
              borderRadius: 12,
              fontWeight: 600,
              border: "none",
              cursor: processing ? "not-allowed" : "pointer",
            }}
          >
            {processing
              ? "Processing..."
              : `Process All (${images.filter((i) => !i.result).length} pending)`}
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {images.map((item, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.05)",
              padding: 20,
              display: "flex",
              gap: 20,
              position: "relative",
            }}
          >
            <button
              onClick={() => removeImage(i)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(239,68,68,0.2)",
                color: "#ef4444",
                border: "none",
                borderRadius: "50%",
                width: 24,
                height: 24,
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <div style={{ width: 150, flexShrink: 0 }}>
              <img
                src={item.dataUrl}
                style={{ width: "100%", borderRadius: 8, objectFit: "cover", aspectRatio: "1" }}
                alt=""
              />
              {!item.result && !item.loading && (
                <button
                  onClick={() => processImage(i)}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: "8px",
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Generate Metadata
                </button>
              )}
            </div>

            <div style={{ flex: 1 }}>
              {item.loading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  Analyzing image...
                </div>
              ) : item.error ? (
                <div style={{ color: "#ef4444" }}>Error: {item.error}</div>
              ) : item.result ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
                    >
                      <strong style={{ color: "#a78bfa" }}>Title</strong>
                      <button
                        onClick={() => copyToClipboard(item.result.title)}
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
                      value={item.result.title}
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
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
                    >
                      <strong style={{ color: "#a78bfa" }}>
                        Keywords ({item.result.keywords?.length || 0})
                      </strong>
                      <button
                        onClick={() => copyToClipboard(item.result.keywords?.join(", "))}
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
                      value={item.result.keywords?.join(", ")}
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

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong style={{ color: "rgba(255,255,255,0.6)" }}>Category:</strong>{" "}
                      {item.result.category}
                    </div>
                    <div>
                      <strong style={{ color: "rgba(255,255,255,0.6)" }}>Type:</strong>{" "}
                      {item.result.contentType}
                    </div>
                    {item.result.aiGuidance && (
                      <div style={{ gridColumn: "1 / -1", color: "#fbbf24" }}>
                        ⚠️ {item.result.aiGuidance}
                      </div>
                    )}
                    {item.result.observations && (
                      <div style={{ gridColumn: "1 / -1", color: "#9ca3af" }}>
                        ℹ️ {item.result.observations}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  Waiting to process...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

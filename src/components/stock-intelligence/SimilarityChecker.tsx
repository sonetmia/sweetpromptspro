import { useState, useRef } from "react";

// Extremely basic client-side image similarity using canvas and downsampling
// For a production app, a dedicated perceptual hash backend is recommended.
async function getPerceptualHash(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve("");

      // Downsample to 8x8 to get a basic "fingerprint"
      const size = 8;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      // Convert to grayscale and calculate average
      const imgData = ctx.getImageData(0, 0, size, size).data;
      let total = 0;
      const grays = [];
      for (let i = 0; i < imgData.length; i += 4) {
        const gray = imgData[i] * 0.299 + imgData[i+1] * 0.587 + imgData[i+2] * 0.114;
        grays.push(gray);
        total += gray;
      }
      const avg = total / grays.length;

      // Build 64-bit hash based on whether pixel is > average
      let hash = "";
      for (let i = 0; i < grays.length; i++) {
        hash += grays[i] >= avg ? "1" : "0";
      }
      resolve(hash);
    };
    img.src = dataUrl;
  });
}

function calculateHammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return 100;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

type AnalyzedImage = { file: File; dataUrl: string; hash: string };
type DuplicateGroup = { master: AnalyzedImage; duplicates: { img: AnalyzedImage; distance: number }[] };

export default function SimilarityChecker() {
  const [images, setImages] = useState<AnalyzedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [progress, setProgress] = useState(0);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setProcessing(true);
    setGroups([]);
    const files = Array.from(e.target.files);
    const newImages: AnalyzedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round(((i) / files.length) * 100));
      const dataUrl = await fileToDataUrl(files[i]);
      const hash = await getPerceptualHash(dataUrl);
      newImages.push({ file: files[i], dataUrl, hash });
    }

    setProgress(100);
    const allImages = [...images, ...newImages];
    setImages(allImages);
    analyzeSimilarities(allImages);
    setProcessing(false);
  };

  const analyzeSimilarities = (imgs: AnalyzedImage[]) => {
    const threshold = 10; // Max hamming distance (out of 64) to be considered similar
    const newGroups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < imgs.length; i++) {
      if (processed.has(imgs[i].hash)) continue;

      const currentGroup: DuplicateGroup = { master: imgs[i], duplicates: [] };
      processed.add(imgs[i].hash);

      for (let j = i + 1; j < imgs.length; j++) {
        if (processed.has(imgs[j].hash)) continue;

        const dist = calculateHammingDistance(imgs[i].hash, imgs[j].hash);
        if (dist <= threshold) {
          currentGroup.duplicates.push({ img: imgs[j], distance: dist });
          processed.add(imgs[j].hash);
        }
      }

      if (currentGroup.duplicates.length > 0) {
        newGroups.push(currentGroup);
      }
    }
    setGroups(newGroups);
  };

  const clearAll = () => {
    setImages([]);
    setGroups([]);
  };

  const removeGroup = (index: number) => {
    setGroups(prev => prev.filter((_, i) => i !== index));
    // Also remove them from the images list if we wanted to be thorough, but keeping it simple for now
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Duplicate & Similarity Checker</h2>
      <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
        Batch upload images to find visually similar or near-duplicate content before submitting to Adobe Stock. <br/>
        Uses local client-side analysis.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <label style={{
          background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)",
          padding: "20px", borderRadius: 12, cursor: "pointer", textAlign: "center", flex: 1,
          transition: "background 0.2s"
        }}>
          {processing ? (
            <span style={{ color: "#fff", fontWeight: 600 }}>Analyzing... {progress}%</span>
          ) : (
            <>
              <span style={{ color: "#fff", fontWeight: 600 }}>Click to Upload Batch</span>
              <br /><span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>(Select multiple JPG/PNG files)</span>
            </>
          )}
          <input type="file" multiple accept="image/jpeg, image/png" onChange={handleFiles} disabled={processing} style={{ display: "none" }} />
        </label>

        {images.length > 0 && (
           <button onClick={clearAll} style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", border: "none", padding: "0 20px", borderRadius: 12, cursor: "pointer", fontWeight: 600 }}>Clear All</button>
        )}
      </div>

      {images.length > 0 && (
        <div style={{ marginBottom: 24, display: "flex", gap: 16 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px 20px", borderRadius: 8 }}>Total Images: <strong>{images.length}</strong></div>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px 20px", borderRadius: 8 }}>Similar Groups Found: <strong>{groups.length}</strong></div>
        </div>
      )}

      {groups.length === 0 && images.length > 0 && !processing && (
         <div style={{ color: "#22c55e", padding: 20, background: "rgba(34,197,94,0.1)", borderRadius: 12, textAlign: "center" }}>
           Great! No visually similar images detected in this batch.
         </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {groups.map((g, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, color: "#f5841f" }}>Possible Duplicate Group {i + 1} ({g.duplicates.length + 1} images)</h3>
              <button onClick={() => removeGroup(i)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Dismiss</button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              <div style={{ width: 120 }}>
                <img src={g.master.dataUrl} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, border: "2px solid #a78bfa" }} />
                <div style={{ fontSize: 12, textAlign: "center", marginTop: 4, color: "rgba(255,255,255,0.6)" }}>Reference Image</div>
              </div>

              {g.duplicates.map((dup, j) => (
                <div key={j} style={{ width: 120 }}>
                  <img src={dup.img.dataUrl} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8 }} />
                  <div style={{ fontSize: 12, textAlign: "center", marginTop: 4, color: "#ef4444" }}>
                    Similarity: {100 - Math.round((dup.distance / 64) * 100)}%
                  </div>
                </div>
              ))}
            </div>

            <p style={{ marginTop: 16, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
              <strong>Recommended Action:</strong> Review these images. Adobe Stock may reject them as similar content. Consider keeping only the best one or varying the concepts more significantly.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

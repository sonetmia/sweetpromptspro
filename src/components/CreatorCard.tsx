import creatorAsset from "@/assets/md-sonet-mia.png.asset.json";

export function CreatorCard({ C }: { C: Theme }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: C.card,
        border: `1px solid ${C.border2}`,
        borderRadius: 16,
        padding: "16px 18px",
      }}
    >
      <img
        src={creatorAsset.url}
        alt="Md Sonet Mia"
        loading="lazy"
        width={72}
        height={72}
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          objectFit: "cover",
          border: `2px solid ${C.orange}`,
          background: C.card2,
        }}
      />
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "1.2px",
            marginBottom: 4,
          }}
        >
          Creator
        </div>
        <div
          style={{
            fontFamily: "var(--display)",
            fontSize: 20,
            fontWeight: 800,
            color: C.text,
            letterSpacing: "-.3px",
          }}
        >
          Md Sonet Mia
        </div>
      </div>
    </div>
  );
}

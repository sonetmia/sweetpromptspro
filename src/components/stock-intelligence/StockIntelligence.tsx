import { useState } from "react";
import { motion } from "framer-motion";
import OpportunityFinder from "./OpportunityFinder";
import KeywordIntelligence from "./KeywordIntelligence";
import MetadataStudio from "./MetadataStudio";
import ImageWorkflow from "./ImageWorkflow";
import ComplianceChecker from "./ComplianceChecker";
import SimilarityChecker from "./SimilarityChecker";
import CommercialAnalyzer from "./CommercialAnalyzer";
import SearchSimulator from "./SearchSimulator";
import SeasonalCalendar from "./SeasonalCalendar";
import ProductionPack from "./ProductionPack";

const TOOLS = [
  { id: "opportunity", icon: "🎯", title: "Opportunity Finder", desc: "Discover niches and concepts for your next shoot or generation." },
  { id: "keyword", icon: "🔑", title: "Keyword Intelligence", desc: "Research, validate, and organize stock keywords." },
  { id: "metadata", icon: "🏷", title: "Premium Metadata Studio", desc: "Bulk AI metadata generation (Title, Description, Keywords)." },
  { id: "workflow", icon: "⚡", title: "Prompt + Metadata Workflow", desc: "Analyze an image to get both a reconstruction prompt and stock metadata." },
  { id: "compliance", icon: "🛡", title: "Stock Compliance Checker", desc: "AI-assisted pre-check for logos, artifacts, and IP issues." },
  { id: "similarity", icon: "👯", title: "Duplicate Checker", desc: "Find visually similar images in your batch before uploading." },
  { id: "commercial", icon: "💰", title: "Commercial Value Analyzer", desc: "Evaluate the commercial suitability and versatility of a concept." },
  { id: "search", icon: "🔎", title: "Stock Search Simulator", desc: "Test how your metadata performs against a search intent." },
  { id: "calendar", icon: "📅", title: "Seasonal Calendar", desc: "Plan ahead with a calendar of major stock photography themes." },
  { id: "pack", icon: "📦", title: "Production Pack", desc: "Turn one topic into complete, ready-to-produce stock assets." },
];

export default function StockIntelligence() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  if (activeTool) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 20px", color: "#fff" }}>
        <button
          onClick={() => setActiveTool(null)}
          style={{
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", padding: "6px 14px", borderRadius: 999, cursor: "pointer",
            marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 14, fontWeight: 500, transition: "background 0.2s"
          }}
        >
          ← Back to Dashboard
        </button>
        {activeTool === "opportunity" && <OpportunityFinder />}
        {activeTool === "keyword" && <KeywordIntelligence />}
        {activeTool === "metadata" && <MetadataStudio />}
        {activeTool === "workflow" && <ImageWorkflow />}
        {activeTool === "compliance" && <ComplianceChecker />}
        {activeTool === "similarity" && <SimilarityChecker />}
        {activeTool === "commercial" && <CommercialAnalyzer />}
        {activeTool === "search" && <SearchSimulator />}
        {activeTool === "calendar" && <SeasonalCalendar setActiveTool={setActiveTool} />}
        {activeTool === "pack" && <ProductionPack />}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px", color: "#fff" }}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 42, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>
          Stock Intelligence
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, maxWidth: 600, margin: "0 auto", lineHeight: 1.5 }}>
          A premium Adobe Stock-oriented production workspace. Analyze trends, ensure compliance, and generate perfect metadata.
        </p>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20
      }}>
        {TOOLS.map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActiveTool(t.id)}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 24,
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              backdropFilter: "blur(12px)",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 32 }}>{t.icon}</div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 6 }}>{t.title}</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{t.desc}</p>
            </div>
            <div style={{
              marginTop: "auto", paddingTop: 16, display: "flex", alignItems: "center", color: "#a78bfa", fontSize: 13, fontWeight: 600
            }}>
              Open Tool →
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

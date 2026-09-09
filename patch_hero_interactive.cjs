const fs = require('fs');
const file = 'src/components/SweetPrompts.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
// ── Hero Section (Interactive Grid) ──────────────────────────────────────────
function HeroSection({ setPage }: { setPage: (p: string) => void }) {
  const sections = [
    { id: "bulk", icon: "📦", label: "Bulk Generator", color: "from-blue-500/20 to-purple-500/20", border: "border-blue-500/30" },
    { id: "idea", icon: "💡", label: "Idea Generator", color: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/30" },
    { id: "jpg", icon: "📷", label: "JPG Creator", color: "from-green-500/20 to-emerald-500/20", border: "border-green-500/30" },
    { id: "png", icon: "🟦", label: "PNG Creator", color: "from-cyan-500/20 to-teal-500/20", border: "border-cyan-500/30" },
    { id: "imgprompts", icon: "🖼", label: "Image → Prompts", color: "from-[#64CEFB]/20 to-[#a78bfa]/20", border: "border-[#64CEFB]/30" },
    { id: "imgmeta", icon: "🏷", label: "Image → Metadata", color: "from-[#f5841f]/20 to-[#fbbf24]/20", border: "border-[#f5841f]/30" },
    { id: "stock-intelligence", icon: "📈", label: "Stock Intelligence", color: "from-rose-500/20 to-pink-500/20", border: "border-rose-500/30" },
    { id: "library", icon: "📚", label: "Prompt Library", color: "from-indigo-500/20 to-violet-500/20", border: "border-indigo-500/30" },
    { id: "brainstorm", icon: "🧠", label: "Brainstormer", color: "from-fuchsia-500/20 to-purple-500/20", border: "border-fuchsia-500/30" },
    { id: "silhouette", icon: "🔍", label: "Silhouette Finder", color: "from-slate-500/20 to-gray-500/20", border: "border-slate-500/30" },
    { id: "improver", icon: "⚡", label: "Prompt Improver", color: "from-amber-500/20 to-yellow-500/20", border: "border-amber-500/30" },
    { id: "variations", icon: "🔀", label: "Prompt Variations", color: "from-lime-500/20 to-green-500/20", border: "border-lime-500/30" },
  ];

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-black font-[Inter,sans-serif] flex flex-col items-center justify-center py-20">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-7xl mx-auto px-4 mb-16">
        <h1
          className="text-white font-medium tracking-tighter text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl mb-8 drop-shadow-2xl"
          style={{ lineHeight: 0.85 }}
        >
          <span className="block mb-4" style={{ height: "1.2em" }}>
            <TypewriterEffect words={["Sweet Prompts Pro", "Microstock Journey With Sonet", "Sweet Prompts"]} />
          </span>
        </h1>
        <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto font-light">
          Your ultimate AI-powered microstock production studio. Choose a tool below to begin your creative journey.
        </p>
      </div>

      <div className="relative z-20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-4 max-w-6xl mx-auto w-full perspective-1000">
        {sections.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 50, rotateX: 45 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 100, damping: 10 }}
            whileHover={{ scale: 1.05, rotateY: 5, rotateX: -5, translateZ: 20 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage(s.id)}
            className={\`group relative flex flex-col items-center justify-center gap-4 p-6 sm:p-8 bg-white/5 backdrop-blur-xl border \${s.border} rounded-2xl sm:rounded-3xl text-white transition-all duration-300 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] transform-style-3d\`}
          >
            <span className={\`absolute inset-0 bg-gradient-to-br \${s.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500\`}></span>
            <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>

            <span className="text-4xl sm:text-5xl drop-shadow-lg transform transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2">{s.icon}</span>
            <span className="font-semibold text-sm sm:text-base tracking-wide text-center z-10">{s.label}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
`;

const regex = /function HeroSection\(\{ setPage \}: \{ setPage: \(p: string\) => void \}\) \{[\s\S]*?<\/section>\n\}/;
content = content.replace(regex, replacement);

fs.writeFileSync(file, content, 'utf8');

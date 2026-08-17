const fs = require('fs');
const file = 'src/components/SweetPrompts.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
// ── Hero Section (Professional Dashboard) ────────────────────────────────────
function HeroSection({ setPage }: { setPage: (p: string) => void }) {
  const categories = [
    {
      title: "Stock Production Workflow",
      items: [
        { id: "stock-intelligence", icon: "📈", label: "Stock Intelligence", desc: "Premium workspace for Adobe Stock creators", color: "from-rose-500/10 to-orange-500/10", border: "border-rose-500/20" },
        { id: "imgprompts", icon: "🖼", label: "Image → Prompts", desc: "Extract detailed AI prompts from existing images", color: "from-blue-500/10 to-cyan-500/10", border: "border-blue-500/20" },
        { id: "imgmeta", icon: "🏷", label: "Image → Metadata", desc: "Auto-generate stock titles and keywords", color: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-500/20" },
        { id: "bulk", icon: "📦", label: "Bulk Generator", desc: "Generate up to 200 prompts per subject", color: "from-purple-500/10 to-indigo-500/10", border: "border-purple-500/20" },
      ]
    },
    {
      title: "Prompt Engineering",
      items: [
        { id: "idea", icon: "💡", label: "Idea Generator", desc: "Turn simple concepts into AI-ready prompts", color: "from-yellow-500/10 to-amber-500/10", border: "border-yellow-500/20" },
        { id: "improver", icon: "⚡", label: "Prompt Improver", desc: "Enhance and enrich your existing prompts", color: "from-sky-500/10 to-blue-500/10", border: "border-sky-500/20" },
        { id: "variations", icon: "🔀", label: "Prompt Variations", desc: "Create multiple stylistic alternatives", color: "from-lime-500/10 to-green-500/10", border: "border-lime-500/20" },
        { id: "fixer", icon: "🛠", label: "Prompt Fixer", desc: "Repair syntax and structural issues", color: "from-slate-500/10 to-gray-500/10", border: "border-slate-500/20" },
        { id: "expander", icon: "📝", label: "Prompt Expander", desc: "Add rich details to brief descriptions", color: "from-fuchsia-500/10 to-pink-500/10", border: "border-fuchsia-500/20" },
        { id: "translator", icon: "🌐", label: "Prompt Translator", desc: "Translate prompts from any language to English", color: "from-indigo-500/10 to-blue-500/10", border: "border-indigo-500/20" },
      ]
    },
    {
      title: "Asset Creators & Utilities",
      items: [
        { id: "jpg", icon: "📷", label: "JPG Creator", desc: "Microstock-ready photo prompt templates", color: "from-orange-500/10 to-red-500/10", border: "border-orange-500/20" },
        { id: "png", icon: "🟦", label: "PNG Creator", desc: "Transparent background asset templates", color: "from-cyan-500/10 to-blue-500/10", border: "border-cyan-500/20" },
        { id: "silhouette", icon: "🔍", label: "Silhouette Finder", desc: "Generate clean silhouette concepts", color: "from-neutral-500/10 to-stone-500/10", border: "border-neutral-500/20" },
        { id: "library", icon: "📚", label: "Prompt Library", desc: "Browse saved and favorite prompts", color: "from-violet-500/10 to-purple-500/10", border: "border-violet-500/20" },
      ]
    }
  ];

  return (
    <section className="relative w-full min-h-screen bg-black font-[Inter,sans-serif] flex flex-col items-center pt-24 pb-32 overflow-y-auto">
      {/* Background ambient effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#f5841f] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-[#a78bfa] opacity-[0.02] blur-[150px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-6xl mx-auto px-6 mb-16">
        <h1
          className="text-white font-medium tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-6 drop-shadow-xl"
          style={{ lineHeight: 1.1 }}
        >
          <span className="block mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70" style={{ height: "1.2em" }}>
            <TypewriterEffect words={["Sweet Prompts Pro", "Microstock Journey With Sonet", "Sweet Prompts"]} />
          </span>
        </h1>
        <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
          The professional AI production workspace. Streamline your microstock workflow with advanced prompt engineering and bulk generation tools.
        </p>
      </div>

      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-16">
        {categories.map((cat, idx) => (
          <div key={idx} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white/90 tracking-tight">{cat.title}</h2>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {cat.items.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx * 0.1) + (i * 0.05), duration: 0.4, ease: "easeOut" }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPage(s.id)}
                  className={\`group relative flex flex-col items-start p-6 bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-md border border-white/5 hover:\${s.border} rounded-2xl text-left transition-all duration-300 overflow-hidden\`}
                >
                  <span className={\`absolute inset-0 bg-gradient-to-br \${s.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500\`}></span>

                  <div className="relative z-10 flex items-center gap-4 mb-4">
                    <span className="text-3xl bg-white/5 p-3 rounded-xl border border-white/10 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {s.icon}
                    </span>
                    <span className="font-semibold text-lg text-white/90 group-hover:text-white transition-colors">{s.label}</span>
                  </div>

                  <p className="relative z-10 text-sm text-white/50 group-hover:text-white/70 leading-relaxed transition-colors">
                    {s.desc}
                  </p>

                  <div className="relative z-10 mt-6 flex items-center text-xs font-semibold tracking-wide text-white/40 group-hover:text-white/80 transition-colors uppercase">
                    Open Tool <span className="ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
`;

const regex = /\/\/\s*──\s*Hero Section \(Interactive Grid\).*?function HeroSection[\s\S]*?<\/section>\n\s*\}/s;
content = content.replace(regex, replacement);

fs.writeFileSync(file, content, 'utf8');

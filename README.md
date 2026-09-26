# SweetPrompts Pro — Commercial Stock Workflow & Prompt Studio

An art-directed, editorial-grade creative suite designed for microstock contributors, visual designers, and prompt engineers. Built with strict compliance engines to create commercially viable, IP-safe, high-intent assets for Adobe Stock, Freepik, Shutterstock, and leading content marketplaces.

---

## Key Features

### 1. Creators & Generation Suite
- **Bulk Generator**: High-speed batch prompt generation with exact count selection (1, 5, 10, 15, 20, 30) and uniqueness validation.
- **Idea Generator**: Trend-focused concept brainstormer producing commercial stock themes and buyer demand scenarios.
- **JPG Creator**: Specialized photorealistic commercial photography prompt generator with camera lens, lighting, and negative space controls.
- **PNG Creator**: Isolated cutout and clean vector graphic prompt generator optimized for transparency and icon packs.

### 2. AI Prompt Engineering Tools
- **Prompt Improver**: Enhances raw concepts with high-value commercial stock terminology and camera details.
- **Prompt Variations**: Generates diverse visual variations without changing core subject intent.
- **Prompt Expander**: Adds depth, lighting, composition, and background fidelity.
- **Prompt Fixer**: Identifies and removes stock compliance risks (human faces, logos, distorted anatomy).
- **Prompt Translator**: Translates multi-language ideas (including Bengali/Bangla) into production-grade English stock prompts.
- **Brainstormer**: Explores seasonal, niche, and high-demand commercial themes.
- **Silhouette Finder**: Crafts high-contrast vector silhouette prompts with isolated backgrounds.

### 3. Stock Audit & Compliance Engine
- **Metadata Studio**: Generates 50 high-relevance stock keywords, commercial titles, and category tags.
- **IP & Risk Checker**: Scans for trademarked brands, living artists, copyrighted characters, and restricted landmarks.
- **Commercial Optimizer**: Scores buyer utility, copy space, and commercial readiness.
- **Similarity Checker**: Evaluates distinctiveness and prevents duplicate prompt submissions.
- **Pre-Submission Check**: 14-point audit ensuring compliance with official Adobe Stock contributor guidelines.

### 4. Visual Archive & Export
- **Stock Library**: Local-first visual archive with search, category filtering, and item management.
- **Central Export Engine**: One-click **Download TXT** and **Download CSV** with full UTF-8 BOM encoding and character escaping.
- **Theme System**: Dynamic Cinematic Dark mode and Warm Printed Paper Light mode with system auto-detection.

---

## Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Build Tool**: Vite, ESBuild
- **AI Router**: Centralized `AIManager` supporting Google Gemini, Groq, Mistral, OpenRouter, Hugging Face, and Cerebras
- **Local-First Storage**: Versioned browser `localStorage` management with zero server tracking
- **Deployment**: Vercel-ready with client-side SPA routing (`vercel.json`)

---

## Local Development Setup

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/sweetprompts-pro.git
cd sweetprompts-pro

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Build & Preview
```bash
# Typecheck
npm run typecheck

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Environment Configuration

SweetPrompts Pro is designed with **local-first privacy**:
1. You can configure your personal API key directly in **Settings & Providers** inside the application. The key is securely stored in your browser's `localStorage` and never transmitted to third-party databases.
2. Alternatively, you can provide default API keys via environment variables for team deployments:

Create a `.env.local` file (see `.env.example`):
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GROQ_API_KEY=your_groq_key_here
VITE_MISTRAL_API_KEY=your_mistral_key_here
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
```

---

## Vercel Deployment

Deploying SweetPrompts Pro to Vercel requires zero custom build scripts:

1. Push this repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Framework Preset will auto-detect as **Vite**.
5. (Optional) Configure environment variables in Project Settings.
6. Click **Deploy**.

---

## Security & Privacy

- No hardcoded API keys or private secrets in the codebase.
- Client-side storage ensures user prompts, API keys, and history remain private on the user's device.
- All export files (TXT/CSV) are generated client-side via browser Blob APIs and automatically revoke object URLs after download.

---

## License

Apache-2.0

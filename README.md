# Sweet AI Metadata Lab

> A focused AI microstock prompt studio for creating production-ready image prompts, metadata, variations, and creative stock workflows.

Sweet AI Metadata Lab helps creators move from a short idea to a structured, commercially minded output. The application combines bulk prompt generation, image-to-prompt workflows, metadata generation, prompt improvement, creative variations, and stock-production intelligence in one workspace.

## Product overview

Sweet AI Metadata Lab is designed for creators, stock contributors, designers, and production teams who need repeatable prompt workflows rather than one-off text generation. The interface keeps the first step simple while exposing deeper controls for users who need more specificity, volume, or marketplace-oriented output.

The primary workflow is:

```text
Describe an idea → choose a tool → generate structured output → review → copy or export
```

## Core capabilities

| Area | Capability | Purpose |
|---|---|---|
| Prompt generation | Bulk Image Prompt Generator | Create multiple microstock-oriented prompts for a subject or concept. |
| Prompt generation | Idea Generator | Turn an early concept into several AI-ready creative directions. |
| Prompt generation | JPG Creator | Produce photo-oriented prompts with commercial composition and stock-use considerations. |
| Prompt generation | PNG Creator | Generate isolated transparent-asset concepts for design workflows. |
| Prompt refinement | Prompt Improver | Analyze an existing prompt and return a clearer, more detailed version. |
| Prompt refinement | Prompt Variations | Create multiple creative angles from one base prompt. |
| Prompt refinement | Prompt Expander | Turn a short idea into a richer, more descriptive prompt. |
| Prompt refinement | Prompt Fixer | Detect common prompt problems and provide a repaired version. |
| Prompt refinement | Prompt Translator | Translate prompt content into another language while retaining intent. |
| Creative planning | Brainstormer | Generate creative directions before committing to a production prompt. |
| Asset workflows | Image Studio | Convert uploaded images into prompts or marketplace-ready metadata. |
| Stock intelligence | Production Pack | Build a broader stock-production package from a single topic. |
| Stock intelligence | Opportunity Finder | Explore topic opportunities, search terms, and related concepts. |
| Stock intelligence | Keyword Intelligence | Generate primary, secondary, and long-tail keyword suggestions. |
| Safety and quality | Microstock risk validator | Flag possible brands, copyrighted characters, landmarks, identifiable people, and other risk signals. |

## Experience principles

The product follows four interface principles:

1. **Clear first action.** A new user should be able to open a studio and generate an output without configuring every advanced option.
2. **Progressive control.** Detailed options should appear only when they are useful, keeping the main workspace calm and readable.
3. **Reusable output.** Generated prompts should be easy to copy, export, compare, and reuse in a production workflow.
4. **Commercial awareness.** Prompt generation should consider composition, format, technical detail, metadata, and potential marketplace restrictions.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19 with TypeScript |
| Application framework | TanStack Start and TanStack Router |
| Build tool | Vite |
| Styling | Tailwind CSS with project-level CSS variables |
| Animation | Framer Motion |
| UI primitives | Radix UI and Lucide React |
| Data and server state | TanStack React Query |
| AI gateway | Lovable AI Gateway using Gemini 2.5 Flash by default |
| Alternative providers | Gemini, Groq, and Mistral can be configured from the application settings |
| Deployment target | Cloudflare-compatible TanStack Start output |

## Requirements

Before running the project locally, install the following:

- Node.js 20 or newer
- Bun, or another package manager compatible with the repository lockfile
- A configured AI gateway key for server-side generation

The default server-side integration expects `LOVABLE_API_KEY`. The key must remain server-side and must never be placed in client code or committed to the repository.

## Local development

Clone the repository and enter the project directory:

```bash
git clone https://github.com/sonetmia/sweetpromptspro.git
cd sweetpromptspro
```

Install dependencies using the repository’s lockfile:

```bash
bun install
```

Create a local environment file for the server-side AI gateway:

```bash
printf 'LOVABLE_API_KEY=your_key_here\n' > .env
```

Start the development server:

```bash
bun run dev
```

The application is then available at the local URL printed by Vite. Do not commit `.env` or any file containing a real API key.

## Available scripts

| Command | Description |
|---|---|
| `bun run dev` | Start the Vite development server. |
| `bun run build` | Create a production build for the TanStack Start application. |
| `bun run build:dev` | Create a development-mode production build. |
| `bun run preview` | Preview the generated production build locally. |
| `bun run lint` | Run the repository ESLint and Prettier checks. |
| `bun run format` | Format project files with Prettier. |

Equivalent commands can be used with another package manager when required, for example `pnpm run dev` or `npm run dev` after installing dependencies.

## AI provider configuration

The application uses the Lovable AI Gateway by default. The server functions in `src/lib/ai.functions.ts` read `LOVABLE_API_KEY` from the server environment and call the configured gateway for text and image-vision requests.

Users can also configure supported personal providers from the application settings. The current provider options include:

| Provider | Typical use | Configuration location |
|---|---|---|
| Lovable Gateway | Default text and vision generation | Server environment through `LOVABLE_API_KEY` |
| Gemini | Direct text and vision generation | Application settings |
| Groq | Direct text generation | Application settings |
| Mistral | Direct text and vision generation | Application settings |

Personal provider configuration is stored locally in the browser. Treat personal API keys as sensitive credentials, use a restricted key where the provider supports it, and clear the setting before using a shared device.

## Repository structure

```text
src/
├── components/
│   ├── SweetPrompts.tsx          # Main application shell and prompt tools
│   ├── FreeApiProviders.tsx      # Provider information and creator panel
│   ├── AIProvidersSection.tsx    # AI provider presentation section
│   └── stock-intelligence/       # Image and stock-production workflows
├── lib/
│   ├── ai.functions.ts           # Server-side text and vision AI functions
│   ├── error-capture.ts          # Error capture utilities
│   └── error-page.ts              # Error-page helpers
├── routes/
│   ├── index.tsx                 # Home route and page metadata
│   └── __root.tsx                # Root layout, providers, and global metadata
├── assets/                       # Local visual assets
└── styles.css                    # Global styles and theme tokens
```

## Application navigation

The main application is a single workspace with internal page state for the available tools. The principal destinations are:

| Destination | Description |
|---|---|
| Home | Product landing experience and tool entry points. |
| Image Studio | Unified image-to-prompt and image-to-metadata workflow. |
| Bulk Generator | High-volume prompt generation for multiple subjects. |
| JPG Creator | Photo-oriented microstock prompt generation. |
| PNG Creator | Transparent PNG asset prompt generation. |
| Prompt Library | Curated prompt collections and reusable examples. |
| Stock Intelligence | Production, metadata, keyword, and opportunity workflows. |
| Settings | Theme and provider preferences. |

## Quality and safety behavior

Generated prompts are passed through a local risk-validation layer that looks for signals such as brand names, trademarked products, copyrighted characters, restricted landmarks, identifiable people, logos, and named artist styles. These signals are intended as review guidance rather than a legal determination. Creators remain responsible for reviewing generated content, licensing requirements, model releases, and marketplace rules before publication.

The application also surfaces common runtime failures, including missing AI gateway configuration, rate limits, exhausted gateway credits, provider errors, and invalid image data. Production deployments should provide a clear server-side secret configuration and an operational way to monitor failed AI requests.

## Contributing

Create a focused branch for each change:

```bash
git switch -c feat/your-change
```

Keep UI changes scoped to the relevant component, preserve existing tool behavior, and verify both desktop and mobile layouts. Before opening a pull request, run:

```bash
bun run build
bun run lint
git diff --check
```

A pull request should explain the user problem, summarize the implementation, mention any new configuration, and include screenshots or a short recording for significant visual changes.

## Roadmap direction

The next product improvements should prioritize workflow quality over feature volume. High-value follow-up work includes reusable variable-based templates, prompt version history, prompt comparison, stronger library search, saved projects, and model-specific output optimization. These features should be introduced progressively so the primary generation flow remains fast and understandable.

## License and usage

No license file is currently defined in this repository. Until a license is added, reuse, redistribution, and commercial use should be treated as governed by the repository owner’s explicit permission and any third-party service terms that apply.

## Maintainer

Sweet AI Metadata Lab is developed by **Md Sonet Mia**.

For project questions or collaboration, open a GitHub issue or contact the maintainer through the project’s existing communication channel.

## References

- [Sweet AI Metadata Lab repository](https://github.com/sonetmia/sweetpromptspro)
- [TanStack Start documentation](https://tanstack.com/start/latest)
- [Vite documentation](https://vite.dev/guide/)
- [Framer Motion documentation](https://motion.dev/docs/react)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)

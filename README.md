# Sweet Prompts Pro

Sweet Prompts Pro is an AI microstock prompt studio for production-ready image prompts, metadata, variations, image workflows, and stock-production intelligence.

## Core capabilities

- Bulk image prompt generation
- Idea generation and brainstorming
- JPG and PNG prompt creation
- Prompt improvement, expansion, fixing, translation, and variations
- Image-to-prompt and image-to-metadata workflows
- Stock opportunity, keyword, compliance, and production tools
- Local risk validation for common microstock concerns
- Custom student authentication with Super Admin approval

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Application | TanStack Start + TanStack Router |
| Build | Vite + Nitro |
| Styling | Tailwind CSS |
| UI | Radix UI + Lucide React |
| Server state | TanStack React Query |
| Authentication | Application-owned Prisma + PostgreSQL |
| Password hashing | Node.js scrypt |
| Sessions | SHA-256 token hashes + HttpOnly SameSite cookies |
| AI integration | Configurable server-side OpenAI-compatible gateway |
| Default model | Google Gemini 2.5 Flash |

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL database
- An OpenAI-compatible AI gateway for server-side generation

## Environment configuration

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=
ADMIN_WHATSAPP=
ADMIN_PASSWORD_HASH=
APP_ORIGIN=
AI_GATEWAY_URL=
AI_GATEWAY_API_KEY=
AI_MODEL=google/gemini-2.5-flash
```

Never commit `.env` or real credentials.

## Local development

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

For development database schema changes, use `npx prisma migrate dev` when appropriate.

## Build and verification

```bash
npm run build
npm run lint
git diff --check
```

The production build runs `prisma generate` before the Vite build.

## Custom authentication

Student accounts are managed by the application database.

```text
Register
   ↓
PENDING
   ↓
Super Admin review
   ↓
APPROVED
   ↓
Student Login
   ↓
Sweet Prompts
```

Supported student states:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Only approved students can access the protected application. Rejecting or suspending a student invalidates active sessions.

### Super Admin setup

Generate a password hash:

```bash
npm run auth:hash -- "YOUR_ADMIN_PASSWORD"
```

Put the generated scrypt hash in `ADMIN_PASSWORD_HASH` and configure `ADMIN_WHATSAPP`.

Admin login is available at `/admin/login`.

## AI configuration

Server-side AI requests use an OpenAI-compatible endpoint configured with:

- `AI_GATEWAY_URL`
- `AI_GATEWAY_API_KEY`
- `AI_MODEL`

The API key is read only on the server. The application can also support personal provider settings in the browser where those features are enabled. Personal API keys should be treated as sensitive credentials.

## Repository structure

```text
src/
├── components/                  # Application UI and workflows
├── components/stock-intelligence/
├── lib/
│   ├── ai.functions.ts          # Server-side AI gateway functions
│   └── auth.local.server.ts     # Custom Prisma authentication
├── routes/                      # Application and API routes
├── assets/                      # Local visual assets
├── server.ts                    # TanStack Start server entry
└── styles.css                   # Global styles
prisma/
├── schema.prisma                # PostgreSQL data model
└── migrations/                  # Database migrations
scripts/
└── generate-admin-hash.mjs      # Admin password hash generator
```

## Security notes

- Passwords are stored as scrypt hashes.
- Session tokens are random values; only SHA-256 hashes are persisted.
- Sessions use HttpOnly and SameSite cookies.
- Authentication APIs perform same-origin checks and rate limiting.
- Secrets must remain in server environment variables.
- `DATABASE_URL`, admin credentials, and AI gateway credentials must never be exposed through client-side `VITE_*` variables.

## Contributing

Before submitting changes:

```bash
npm run build
npm run lint
git diff --check
```

Keep changes focused and preserve existing application workflows and custom authentication behavior.

## Maintainer

Sweet Prompts Pro is developed by Md Sonet Mia.

<!-- deployment trigger: 2026-09-09 -->

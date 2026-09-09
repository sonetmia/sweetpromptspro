# Sweet Prompts Custom Authentication

Sweet Prompts uses an application-owned authentication system built with Prisma and PostgreSQL. It does not depend on Supabase Auth, Supabase database tables, or hosted authentication providers.

## 1. PostgreSQL

Create a PostgreSQL database that accepts standard PostgreSQL connections and put its connection string in `DATABASE_URL`.

## 2. Install and migrate

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

For development schema changes, use `npx prisma migrate dev` after configuring `DATABASE_URL`.

## 3. Super Admin

Generate the admin password hash locally:

```bash
npm run auth:hash -- "YOUR_ADMIN_PASSWORD"
```

Copy the generated `scrypt:...` value into `ADMIN_PASSWORD_HASH`.

Configure:

```env
DATABASE_URL=...
ADMIN_WHATSAPP=...
ADMIN_PASSWORD_HASH=...
APP_ORIGIN=https://your-domain.example
```

Never expose these server variables through `VITE_*` variables and never commit real credentials.

## 4. AI gateway

Server-side AI generation uses an OpenAI-compatible endpoint:

```env
AI_GATEWAY_URL=https://your-ai-gateway.example/v1/chat/completions
AI_GATEWAY_API_KEY=...
AI_MODEL=google/gemini-2.5-flash
```

The AI credential is read on the server only. Use a gateway/provider that supports the OpenAI chat-completions request format and vision messages when image analysis is required.

## 5. Student flow

1. Student opens `/register` and submits registration information.
2. The account is stored as `PENDING` and no session is created.
3. Super Admin opens `/admin/login`.
4. Super Admin reviews and approves the student.
5. Student logs in from `/login`.
6. Only `APPROVED` students can enter the protected Sweet Prompts application.
7. Rejecting or suspending a student invalidates that student's active sessions.

Supported student states are `PENDING`, `APPROVED`, `REJECTED`, and `SUSPENDED`.

## 6. Sessions

Sessions use a random 256-bit token. Only a SHA-256 token hash is stored in PostgreSQL. The raw token is kept in an HttpOnly, SameSite cookie. Normal sessions last 8 hours and Remember Me sessions last 30 days.

## 7. Production checklist

Before deployment:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run lint
```

Production environment variables must include the PostgreSQL connection, Super Admin credentials, application origin, and AI gateway configuration.

# Sweet Prompts Custom Authentication

This project uses its own authentication system with Prisma + PostgreSQL. Supabase Auth and Supabase database tables are not required.

## 1. PostgreSQL

Create a PostgreSQL database from any provider that supports standard PostgreSQL connections. Put its connection string in `DATABASE_URL`.

## 2. Create the schema

Run:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

For local development you can use `npx prisma migrate dev` after setting `DATABASE_URL`.

## 3. Super Admin

Generate the admin password hash locally:

```bash
npm run auth:hash -- "YOUR_ADMIN_PASSWORD"
```

Copy the printed `scrypt:...` value into `ADMIN_PASSWORD_HASH`.

Set:

```env
DATABASE_URL=...
ADMIN_WHATSAPP=...
ADMIN_PASSWORD_HASH=...
APP_ORIGIN=https://your-vercel-domain.vercel.app
```

Never put these server variables in `VITE_*` variables.

## 4. User flow

1. Student opens `/register` and submits their information.
2. Account is stored as `PENDING` and no session is created.
3. Super Admin opens `/admin/login`.
4. Super Admin approves the student from the dashboard.
5. Student logs in from `/login`.
6. Only `APPROVED` users can enter the existing Sweet Prompts application.
7. Rejecting or suspending a student immediately invalidates that student's active sessions.

## 5. Sessions

Sessions use a random 256-bit token. Only a SHA-256 token hash is stored in PostgreSQL. The raw token is kept in an HttpOnly, SameSite=Lax cookie. Normal sessions last 8 hours and Remember Me sessions last 30 days.

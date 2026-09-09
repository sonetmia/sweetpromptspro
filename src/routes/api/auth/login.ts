import { createFileRoute } from "@tanstack/react-router";
import { enforceRateLimit, json, loginSchema, loginStudent, sessionResponse } from "@/lib/auth.local.server";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          enforceRateLimit(request, "login", 12);
          const input = loginSchema.parse(await request.json());
          const session = await loginStudent(input.whatsapp, input.password, input.remember);
          return sessionResponse({ ok: true }, session.token, session.expiresAt);
        } catch (error) {
          if (error instanceof Response) return error;
          return json({ error: error instanceof Error ? error.message : "Login failed." }, 401);
        }
      },
    },
  },
});

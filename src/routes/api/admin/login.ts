import { createFileRoute } from "@tanstack/react-router";
import { adminLoginSchema, enforceRateLimit, json, loginAdmin, sessionResponse } from "@/lib/auth.local.server";

export const Route = createFileRoute("/api/admin/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          enforceRateLimit(request, "admin-login", 8);
          const input = adminLoginSchema.parse(await request.json());
          const session = await loginAdmin(input.whatsapp, input.password, input.remember);
          return sessionResponse({ ok: true }, session.token, session.expiresAt);
        } catch (error) {
          if (error instanceof Response) return error;
          return json({ error: error instanceof Error ? error.message : "Administrator login failed." }, 401);
        }
      },
    },
  },
});

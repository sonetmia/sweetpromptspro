import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookie, destroySession, json } from "@/lib/auth.server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await destroySession(request);
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() } });
      },
    },
  },
});

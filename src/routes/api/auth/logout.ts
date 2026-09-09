import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookie, destroySession, json } from "@/lib/auth.local.server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await destroySession(request);
          return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() } });
        } catch {
          return new Response(JSON.stringify({ error: "Unable to log out right now." }), { status: 500, headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() } });
        }
      },
    },
  },
});

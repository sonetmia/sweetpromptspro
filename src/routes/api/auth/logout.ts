import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookie, destroySession, enforceSameOrigin } from "@/lib/auth.server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          enforceSameOrigin(request);
          await destroySession(request);
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() },
          });
        } catch (error) {
          if (error instanceof Response) return error;
          return new Response(JSON.stringify({ error: "Unable to log out right now." }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie() },
          });
        }
      },
    },
  },
});

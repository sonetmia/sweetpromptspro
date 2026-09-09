import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser, json } from "@/lib/auth.local.server";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getSessionUser(request);
        if (!user) return json({ error: "Unauthorized" }, 401);
        return json({ user });
      },
    },
  },
});

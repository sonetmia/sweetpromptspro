import { createFileRoute } from "@tanstack/react-router";
import { adminStudents, json, requireAdmin } from "@/lib/auth.local.server";

export const Route = createFileRoute("/api/admin/students")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request);
          return json({ students: await adminStudents() });
        } catch (error) {
          if (error instanceof Response) return error;
          return json({ error: "Unable to load students." }, 500);
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { json, requireAdmin, updateStudentStatus } from "@/lib/auth.server";
import { z } from "zod";

const schema = z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]) });

export const Route = createFileRoute("/api/admin/students/$id/status")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          await requireAdmin(request);
          const { status } = schema.parse(await request.json());
          return json({ student: await updateStudentStatus(params.id, status) });
        } catch (error) {
          if (error instanceof Response) return error;
          if (error instanceof Error && error.name === "ZodError") return json({ error: "Invalid status." }, 400);
          return json({ error: error instanceof Error ? error.message : "Unable to update status." }, 400);
        }
      },
    },
  },
});

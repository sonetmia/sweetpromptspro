import { createFileRoute } from "@tanstack/react-router";
import { enforceRateLimit, json, registerSchema, registerStudent } from "@/lib/auth.server";

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          enforceRateLimit(request, "register", 8);
          const body = await request.json();
          const input = registerSchema.parse(body);
          await registerStudent(input);
          return json({ ok: true, message: "Registration submitted. Please wait for Super Admin approval." }, 201);
        } catch (error) {
          if (error instanceof Response) return error;
          if (error instanceof Error && error.name === "ZodError") return json({ error: "Please check the registration fields." }, 400);
          return json({ error: error instanceof Error ? error.message : "Registration failed." }, 400);
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import AuthGate from "@/components/AuthGate";

export const Route = createFileRoute("/admin/login")({ component: () => <AuthGate mode="admin" /> });

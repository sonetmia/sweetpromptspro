import { createFileRoute } from "@tanstack/react-router";
import AuthGate from "@/components/AuthGate";

export const Route = createFileRoute("/login")({ component: () => <AuthGate mode="login" /> });

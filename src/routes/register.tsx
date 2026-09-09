import { createFileRoute } from "@tanstack/react-router";
import AuthGate from "@/components/AuthGate";

export const Route = createFileRoute("/register")({ component: () => <AuthGate mode="register" /> });

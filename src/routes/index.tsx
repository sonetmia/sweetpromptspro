import { createFileRoute } from "@tanstack/react-router";
import { App as SweetPrompts } from "@/components/SweetPrompts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sweet AI Metadata Lab by SONET" },
      {
        name: "description",
        content:
          "AI-powered prompt generation, metadata, keyword intelligence and stock-production workflows. Bring your own free/freemium AI provider key.",
      },
      { property: "og:title", content: "Sweet AI Metadata Lab by SONET" },
      {
        property: "og:description",
        content: "AI-powered prompt generation, metadata and stock-production workflows by SONET.",
      },
    ],
  }),
  component: () => <SweetPrompts />,
});

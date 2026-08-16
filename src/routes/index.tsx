import { createFileRoute } from "@tanstack/react-router";
import SweetPrompts from "@/components/SweetPrompts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sweet Prompts — AI Microstock Prompt Studio" },
      {
        name: "description",
        content:
          "Generate JPG, PNG, silhouette and bulk AI image prompts for Adobe Stock, Shutterstock, and more — 5 to 200 prompts at a time.",
      },
      { property: "og:title", content: "Sweet Prompts — AI Microstock Prompt Studio" },
      {
        property: "og:description",
        content: "Bulk AI prompt generation for microstock JPG and PNG assets.",
      },
    ],
  }),
  component: () => <SweetPrompts />,
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const textInputSchema = z.object({
  system: z.string().trim().min(1).max(12000),
  user: z.string().trim().min(1).max(30000),
  maxTokens: z.number().int().min(100).max(4000).optional(),
});

const visionInputSchema = textInputSchema.extend({
  imageDataUrl: z
    .string()
    .max(11_000_000)
    .regex(/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i, "Unsupported image data URL"),
});

const clampTokens = (value?: number) => Math.min(Math.max(value ?? 1400, 100), 4000);

async function gatewayRequest(body: unknown, vision = false) {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  const apiUrl = process.env.AI_GATEWAY_URL;
  if (!apiKey || !apiUrl) throw new Error("AI gateway not configured");

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit reached. Please wait and retry.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please check the configured AI provider.");
    const t = await res.text().catch(() => "");
    throw new Error(`${vision ? "AI vision" : "AI"} error ${res.status}: ${t.slice(0, 120)}`);
  }

  const j = await res.json();
  return { text: j.choices?.[0]?.message?.content ?? "" };
}

export const callAIFn = createServerFn({ method: "POST" })
  .inputValidator((data) => textInputSchema.parse(data))
  .handler(async ({ data }) =>
    gatewayRequest({
      model: process.env.AI_MODEL ?? "google/gemini-2.5-flash",
      max_tokens: clampTokens(data.maxTokens),
      messages: [
        { role: "system", content: data.system },
        { role: "user", content: data.user },
      ],
    }),
  );

export const callAIVisionFn = createServerFn({ method: "POST" })
  .inputValidator((data) => visionInputSchema.parse(data))
  .handler(async ({ data }) =>
    gatewayRequest(
      {
        model: process.env.AI_MODEL ?? "google/gemini-2.5-flash",
        max_tokens: clampTokens(data.maxTokens),
        messages: [
          { role: "system", content: data.system },
          {
            role: "user",
            content: [
              { type: "text", text: data.user },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      },
      true,
    ),
  );

import { createServerFn } from "@tanstack/react-start";

export const callAIFn = createServerFn({ method: "POST" })
  .inputValidator((d: { system: string; user: string; maxTokens?: number }) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: data.maxTokens ?? 1400,
        messages: [
          { role: "system", content: data.system },
          { role: "user", content: data.user },
        ],
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached. Please wait and retry.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
      const t = await res.text().catch(() => "");
      throw new Error(`AI error ${res.status}: ${t.slice(0, 120)}`);
    }
    const j = await res.json();
    return { text: j.choices?.[0]?.message?.content ?? "" };
  });

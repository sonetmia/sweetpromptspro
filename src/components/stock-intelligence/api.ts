import { callAIFn, callAIVisionFn } from "@/lib/ai.functions";

type Provider = "lovable" | "gemini" | "groq" | "mistral";

function loadApiCfg(): { provider: Provider; key: string; model: string } {
  try {
    const raw = localStorage.getItem("sp_api_cfg");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { provider: "lovable", key: "", model: "" };
}

async function callGemini(system: string, user: string, key: string, model: string, maxTokens: number) {
  const m = model || "gemini-2.0-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API Error: ${res.status}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callGroq(system: string, user: string, key: string, model: string, maxTokens: number) {
  const m = model || "llama-3.3-70b-versatile";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: m,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq API Error: ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

async function callMistral(system: string, user: string, key: string, model: string, maxTokens: number) {
  const m = model || "mistral-large-latest";
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: m,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Mistral API Error: ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

async function callGeminiVision(system: string, user: string, imageDataUrl: string, key: string, model: string, maxTokens: number) {
  const m = model || "gemini-2.0-flash";
  const base64 = imageDataUrl.split(",")[1];
  const mimeType = imageDataUrl.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{
        role: "user",
        parts: [
          { text: user },
          { inlineData: { mimeType, data: base64 } },
        ],
      }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini Vision Error: ${res.status}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function callAI(system: string, user: string, maxTokens = 2000): Promise<string> {
  const cfg = loadApiCfg();
  if (cfg.provider === "gemini" && cfg.key) return callGemini(system, user, cfg.key, cfg.model, maxTokens);
  if (cfg.provider === "groq" && cfg.key) return callGroq(system, user, cfg.key, cfg.model, maxTokens);
  if (cfg.provider === "mistral" && cfg.key) return callMistral(system, user, cfg.key, cfg.model, maxTokens);


  try {
    const rawNewCfg = localStorage.getItem("sp_ai_providers_v1");
    if (rawNewCfg) {
      const parsed = JSON.parse(rawNewCfg);
      const provs = parsed.providers || {};

      if (provs.google?.enabled && provs.google?.apiKey) {
        return callGemini(system, user, provs.google.apiKey, provs.google.model || "gemini-2.5-flash", maxTokens);
      }
      if (provs.groq?.enabled && provs.groq?.apiKey) {
        return callGroq(system, user, provs.groq.apiKey, provs.groq.model || "llama-3.3-70b-versatile", maxTokens);
      }
      if (provs.mistral?.enabled && provs.mistral?.apiKey) {
        return callMistral(system, user, provs.mistral.apiKey, provs.mistral.model || "mistral-large-latest", maxTokens);
      }
    }
  } catch(e) {}

  const r = await callAIFn({ data: { system, user, maxTokens } });
  return r.text;
}

export async function callVisionAI(system: string, user: string, imageDataUrl: string, maxTokens = 2000): Promise<string> {
  const cfg = loadApiCfg();
  if (cfg.provider === "gemini" && cfg.key) return callGeminiVision(system, user, imageDataUrl, cfg.key, cfg.model, maxTokens);


  try {
    const rawNewCfg = localStorage.getItem("sp_ai_providers_v1");
    if (rawNewCfg) {
      const parsed = JSON.parse(rawNewCfg);
      const provs = parsed.providers || {};

      if (provs.google?.enabled && provs.google?.apiKey) {
        return callGeminiVision(system, user, imageDataUrl, provs.google.apiKey, provs.google.model || "gemini-2.5-flash", maxTokens);
      }
    }
  } catch(e) {}

  const r = await callAIVisionFn({ data: { system, user, imageDataUrl, maxTokens } });
  return r.text;
}

export async function analyzeTopic(topic: string, count: number = 20) {
  const system = `You are a professional Adobe Stock intelligence assistant. Analyze the given topic and generate a highly structured JSON response containing valuable stock photography/illustration opportunities.`;
  const user = `Topic: "${topic}"

Generate ${count} specific microstock content opportunities for this topic.

Respond ONLY with a valid JSON object matching this schema:
{
  "niche": "String summarizing the broad niche",
  "subNiches": ["Array of 3-5 sub-niches"],
  "relatedSearchTerms": ["Array of 5-10 related stock search keywords"],
  "saturationEstimate": "Low, Medium, or High (AI estimate)",
  "seasonalRelevance": "Any seasonal notes or 'Evergreen'",
  "opportunities": [
    {
      "title": "Short descriptive title of the shot/concept",
      "concept": "Detailed description of the visual concept",
      "contentType": "Photo, Vector, Illustration, or Background",
      "buyerUseCase": "Who would buy this and what for",
      "composition": "Recommended composition (e.g., 'Wide shot, subject on left')",
      "copySpace": "Where to leave copy space (e.g., 'Right third')",
      "promptReadyConcept": "A clean descriptive string ready to be used as an AI prompt base",
      "metadataReadyConcept": "A short, clear title suitable for the final asset metadata"
    }
  ]
}

Ensure the output is strictly valid JSON without markdown wrapping like \`\`\`json.`;

  const res = await callAI(system, user, 3000);
  try {
    return JSON.parse(res.trim().replace(/^```json\s*/, '').replace(/```\s*$/, ''));
  } catch (e) {
    console.error("Failed to parse analyzeTopic response:", res);
    throw new Error("Failed to parse AI response as JSON.");
  }
}

export async function generateKeywords(topic: string, contentType: string) {
  const system = `You are an expert Adobe Stock contributor specializing in keyword optimization.`;
  const user = `Generate a comprehensive keyword list for a microstock asset.
Topic/Description: "${topic}"
Content Type: "${contentType}"

Return ONLY valid JSON matching this schema:
{
  "primary": ["Top 10 most relevant, high-search-volume keywords"],
  "secondary": ["10-15 descriptive, supporting keywords"],
  "longTail": ["5-10 specific multi-word phrases"],
  "concepts": ["5 abstract conceptual keywords (e.g., 'success', 'freedom')"]
}
Ensure the output is strictly valid JSON without markdown wrapping like \`\`\`json.`;

  const res = await callAI(system, user, 1500);
  try {
    return JSON.parse(res.trim().replace(/^```json\s*/, '').replace(/```\s*$/, ''));
  } catch (e) {
    console.error("Failed to parse generateKeywords response:", res);
    throw new Error("Failed to parse AI response as JSON.");
  }
}

export async function analyzeImageMetadata(imageDataUrl: string) {
  const system = `You are a professional microstock keyworder and metadata specialist. Analyze the image and provide optimal metadata for Adobe Stock.`;
  const user = `Analyze this image and return ONLY valid JSON matching this schema:
{
  "title": "A strong, descriptive, and searchable title (7-15 words)",
  "keywords": ["Array of exactly 30 highly relevant keywords, ordered by importance"],
  "category": "Suggested Adobe Stock category (e.g., 'Business', 'Nature', 'Lifestyle')",
  "contentType": "Photo, Vector, or Illustration",
  "aiGuidance": "Brief note if it looks AI generated and needs the 'Generative AI' tag",
  "observations": "Brief notes on potential property/people/text that might need releases or removal"
}
Ensure the output is strictly valid JSON without markdown wrapping like \`\`\`json.`;

  const res = await callVisionAI(system, user, imageDataUrl, 1500);
  try {
    return JSON.parse(res.trim().replace(/^```json\s*/, '').replace(/```\s*$/, ''));
  } catch (e) {
    console.error("Failed to parse analyzeImageMetadata response:", res);
    throw new Error("Failed to parse AI response as JSON.");
  }
}

export async function generateWorkflowData(imageDataUrl: string) {
  const system = `You are an expert AI image generation engineer and Adobe Stock metadata specialist.`;
  const user = `Analyze this image and return ONLY valid JSON matching this schema:
{
  "prompt": "A detailed, high-quality reconstruction prompt that would generate a similar image in Midjourney/Stable Diffusion. Include style, lighting, composition, and subject details.",
  "metadata": {
    "title": "Descriptive stock title",
    "keywords": ["Array of 25-30 comma-separated keywords"],
    "category": "Adobe Stock Category"
  },
  "qualityAnalysis": {
    "composition": "Analysis of the composition",
    "copySpace": "Analysis of copy space availability",
    "commercialUsefulness": "Why a buyer would want this",
    "potentialProblems": "Any weird AI artifacts, text, or trademark issues detected"
  }
}
Ensure the output is strictly valid JSON without markdown wrapping like \`\`\`json.`;

  const res = await callVisionAI(system, user, imageDataUrl, 2500);
  try {
    return JSON.parse(res.trim().replace(/^```json\s*/, '').replace(/```\s*$/, ''));
  } catch (e) {
    console.error("Failed to parse generateWorkflowData response:", res);
    throw new Error("Failed to parse AI response as JSON.");
  }
}

export async function checkCompliance(imageDataUrl: string) {
  const system = `You are a strict Adobe Stock compliance inspector. Your job is to pre-check images for rejection reasons.`;
  const user = `Examine this image for stock photography compliance. Look for:
1. Visible logos, trademarks, or branded products (Apple, Nike, cars, etc.)
2. Recognizable people (need model releases)
3. Identifiable private property/buildings (need property releases)
4. Suspicious or garbled text (common in AI)
5. Visual defects or obvious AI generation artifacts (extra fingers, melting geometry, weird physics)
6. Overall composition issues.

Return ONLY valid JSON matching this schema:
{
  "score": "Pass, Review, or Potential Risk",
  "warnings": ["Array of specific observations/warnings. If none, leave empty."],
  "aiArtifacts": "Notes specifically about potential AI artifacts detected",
  "overallNote": "A short summary of the readiness of this image."
}
Ensure the output is strictly valid JSON without markdown wrapping like \`\`\`json.`;

  const res = await callVisionAI(system, user, imageDataUrl, 1500);
  try {
    return JSON.parse(res.trim().replace(/^```json\s*/, '').replace(/```\s*$/, ''));
  } catch (e) {
    console.error("Failed to parse checkCompliance response:", res);
    throw new Error("Failed to parse AI response as JSON.");
  }
}

export async function analyzeCommercialValue(input: string) {
  const system = `You are a microstock market analyst.`;
  const user = `Evaluate the commercial suitability of this image concept/description for Adobe Stock.
Concept: "${input}"

Return ONLY valid JSON matching this schema:
{
  "overallScore": "A number from 1 to 100 representing the Commercial Suitability Estimate",
  "clarity": "Score 1-10 and brief reason",
  "versatility": "Score 1-10 and brief reason",
  "copySpace": "Score 1-10 and brief reason",
  "seasonalValue": "Notes on seasonal timing",
  "commercialApplicability": "Which industries/buyers would use this",
  "nicheUsefulness": "How useful is it within its specific niche"
}
Ensure the output is strictly valid JSON without markdown wrapping like \`\`\`json.`;

  const res = await callAI(system, user, 1500);
  try {
    return JSON.parse(res.trim().replace(/^```json\s*/, '').replace(/```\s*$/, ''));
  } catch (e) {
    console.error("Failed to parse analyzeCommercialValue response:", res);
    throw new Error("Failed to parse AI response as JSON.");
  }
}

export async function simulateSearch(topic: string, title: string, keywords: string) {
  const system = `You are a stock search algorithm simulator. Analyze how well provided metadata matches a target topic.`;
  const user = `Target Topic/Search Intent: "${topic}"
Provided Title: "${title}"
Provided Keywords: "${keywords}"

Return ONLY valid JSON matching this schema:
{
  "strongMatches": ["List of terms that perfectly hit the search intent"],
  "missingConcepts": ["List of important related concepts missing from the title/keywords"],
  "weakTerms": ["List of provided keywords that are irrelevant or too generic"],
  "suggestedImprovements": "A paragraph explaining how to improve the metadata for this search intent"
}
Ensure the output is strictly valid JSON without markdown wrapping like \`\`\`json.`;

  const res = await callAI(system, user, 1500);
  try {
    return JSON.parse(res.trim().replace(/^```json\s*/, '').replace(/```\s*$/, ''));
  } catch (e) {
    console.error("Failed to parse simulateSearch response:", res);
    throw new Error("Failed to parse AI response as JSON.");
  }
}

export async function generateProductionPack(topic: string, count: number) {
  const system = `You are a professional AI stock asset producer.`;
  const user = `Topic: "${topic}"
Generate ${count} complete production packs for AI image generation and microstock submission.

Return ONLY valid JSON matching this schema:
{
  "packs": [
    {
      "concept": "Short description of the idea",
      "aiPrompt": "Highly detailed prompt for Midjourney/Stable Diffusion",
      "negativePrompt": "Recommended negative prompt",
      "composition": "Recommended framing/composition",
      "aspectRatio": "Recommended aspect ratio (e.g., 16:9, 1:1)",
      "copySpace": "Where to leave space for text",
      "title": "Final Adobe Stock title",
      "keywords": ["Array of 30 keywords"],
      "category": "Adobe Stock Category",
      "complianceNotes": "Things to watch out for during generation (e.g., 'ensure hands are correct')"
    }
  ]
}
Ensure the output is strictly valid JSON without markdown wrapping like \`\`\`json.`;

  const res = await callAI(system, user, count > 5 ? 4000 : 2500);
  try {
    return JSON.parse(res.trim().replace(/^```json\s*/, '').replace(/```\s*$/, ''));
  } catch (e) {
    console.error("Failed to parse generateProductionPack response:", res);
    throw new Error("Failed to parse AI response as JSON.");
  }
}

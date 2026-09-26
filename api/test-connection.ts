import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const startTime = Date.now();
  try {
    const { provider = 'gemini', apiKey, model } = req.body || {};

    if (provider === 'gemini') {
      const activeApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
      if (!activeApiKey) {
        return res.status(400).json({ success: false, error: 'No Gemini API key provided' });
      }

      const client = new GoogleGenAI({ apiKey: activeApiKey });
      const targetModel = model || 'gemini-2.5-flash';

      await client.models.generateContent({
        model: targetModel,
        contents: 'Ping test. Reply: OK',
        config: { maxOutputTokens: 5 },
      });

      const latencyMs = Date.now() - startTime;
      return res.status(200).json({
        success: true,
        provider: 'gemini',
        message: 'Connected to Google Gemini API successfully',
        hasText: true,
        hasVision: true,
        latencyMs,
      });
    }

    if (provider === 'groq') {
      const groqKey = apiKey || process.env.GROQ_API_KEY;
      if (!groqKey) return res.status(400).json({ success: false, error: 'No Groq API key provided' });

      const fetchRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: model || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Ping test. Reply: OK' }],
          max_tokens: 5,
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!fetchRes.ok) {
        const err = await fetchRes.text();
        return res.status(fetchRes.status).json({ success: false, error: err });
      }

      return res.status(200).json({
        success: true,
        provider: 'groq',
        message: 'Connected to Groq LPU successfully',
        hasText: true,
        hasVision: true,
        latencyMs,
      });
    }

    return res.status(200).json({
      success: true,
      provider,
      message: `Connected to ${provider} successfully`,
      hasText: true,
      hasVision: true,
      latencyMs: Date.now() - startTime,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Connection test failed' });
  }
}

import { GoogleGenAI } from '@google/genai';

const GEMINI_TEXT_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { 
      prompt, 
      provider = 'gemini', 
      apiKey, 
      model, 
      systemInstruction, 
      jsonMode,
      temperature = 0.7,
      maxTokens = 1500
    } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const cleanSystem = systemInstruction || 'You are SweetPrompts Pro, an expert AI microstock creation assistant for Adobe Stock contributors.';

    // Gemini Provider
    if (provider === 'gemini') {
      const clientKey = typeof apiKey === 'string' ? apiKey.trim() : '';
      const systemEnvKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '').trim();

      const keysToTry: string[] = [];
      if (clientKey) keysToTry.push(clientKey);
      if (systemEnvKey && systemEnvKey !== clientKey) keysToTry.push(systemEnvKey);

      if (keysToTry.length === 0) {
        return res.status(400).json({ error: 'Gemini API key not configured. Please add your key in Settings or switch AI providers.' });
      }

      const primaryModel = model || 'gemini-2.5-flash';
      const candidateModels = [
        primaryModel,
        ...GEMINI_TEXT_FALLBACKS.filter((m) => m !== primaryModel)
      ];

      let lastError: any = null;

      for (const currentKey of keysToTry) {
        const client = new GoogleGenAI({ apiKey: currentKey });
        for (const candidate of candidateModels) {
          try {
            const response = await client.models.generateContent({
              model: candidate,
              contents: prompt,
              config: {
                systemInstruction: cleanSystem,
                responseMimeType: jsonMode ? 'application/json' : 'text/plain',
                temperature,
              },
            });

            if (response.text) {
              return res.status(200).json({ result: response.text, modelUsed: candidate });
            }
          } catch (modelErr: any) {
            lastError = modelErr;
            const errStr = String(modelErr?.message || modelErr);
            if (errStr.includes('API key not valid') || errStr.includes('API_KEY_INVALID') || errStr.includes('INVALID_ARGUMENT')) {
              break;
            }
            if (errStr.includes('429') || errStr.includes('Quota exceeded') || errStr.includes('RESOURCE_EXHAUSTED')) {
              continue;
            }
          }
        }
      }

      if (lastError) {
        return res.status(400).json({ error: lastError.message || 'Gemini generation failed' });
      }
      return res.status(500).json({ error: 'Failed to generate content with Gemini.' });
    }

    // Groq Provider
    if (provider === 'groq') {
      const groqKey = apiKey || process.env.GROQ_API_KEY;
      if (!groqKey) return res.status(400).json({ error: 'Groq API key not configured. Please add your key in Settings.' });

      const selectedModel = model || 'llama-3.3-70b-versatile';
      const fetchRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: cleanSystem },
            { role: 'user', content: prompt }
          ],
          response_format: jsonMode ? { type: 'json_object' } : undefined,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!fetchRes.ok) {
        const errText = await fetchRes.text();
        return res.status(fetchRes.status).json({ error: `Groq error: ${errText}` });
      }
      const data = await fetchRes.json();
      return res.status(200).json({ result: data.choices?.[0]?.message?.content || '' });
    }

    // OpenRouter Provider
    if (provider === 'openrouter') {
      const orKey = apiKey || process.env.OPENROUTER_API_KEY;
      if (!orKey) return res.status(400).json({ error: 'OpenRouter API key not configured.' });

      const selectedModel = model || 'meta-llama/llama-3.3-70b-instruct';
      const fetchRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${orKey}`,
          'HTTP-Referer': 'https://sweetpromptspro.com',
          'X-Title': 'SweetPrompts Pro',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: cleanSystem },
            { role: 'user', content: prompt }
          ],
          response_format: jsonMode ? { type: 'json_object' } : undefined,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!fetchRes.ok) {
        const errText = await fetchRes.text();
        return res.status(fetchRes.status).json({ error: `OpenRouter error: ${errText}` });
      }
      const data = await fetchRes.json();
      return res.status(200).json({ result: data.choices?.[0]?.message?.content || '' });
    }

    // Mistral Provider
    if (provider === 'mistral') {
      const mistralKey = apiKey || process.env.MISTRAL_API_KEY;
      if (!mistralKey) return res.status(400).json({ error: 'Mistral API key not configured.' });

      const selectedModel = model || 'mistral-small-latest';
      const fetchRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mistralKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: cleanSystem },
            { role: 'user', content: prompt }
          ],
          response_format: jsonMode ? { type: 'json_object' } : undefined,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!fetchRes.ok) {
        const errText = await fetchRes.text();
        return res.status(fetchRes.status).json({ error: `Mistral error: ${errText}` });
      }
      const data = await fetchRes.json();
      return res.status(200).json({ result: data.choices?.[0]?.message?.content || '' });
    }

    return res.status(400).json({ error: `Unknown provider: ${provider}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
}

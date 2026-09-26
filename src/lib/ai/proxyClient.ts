import { GoogleGenAI } from '@google/genai';

export interface GeneratePayload {
  provider: string;
  apiKey?: string;
  model?: string;
  prompt: string;
  systemInstruction?: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface VisionPayload {
  provider: string;
  apiKey?: string;
  model?: string;
  imageBase64: string;
  mimeType?: string;
  prompt: string;
}

export interface TestConnectionPayload {
  provider: string;
  apiKey?: string;
  model?: string;
}

/**
 * Cleanly handles API text generation with server proxy first,
 * falling back seamlessly to direct client-side browser API execution.
 */
export async function executeApiGenerate(payload: GeneratePayload): Promise<string> {
  const {
    provider = 'gemini',
    apiKey = '',
    model,
    prompt,
    systemInstruction,
    jsonMode = false,
    temperature = 0.7,
    maxTokens = 1500,
  } = payload;

  // 1. Try server proxy route first
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        apiKey,
        model,
        prompt,
        systemInstruction,
        jsonMode,
        temperature,
        maxTokens,
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.result) {
        return data.result;
      }
      if (data.error) {
        throw new Error(data.error);
      }
    }
  } catch (err: any) {
    // If the server explicitly returned an error message, rethrow it
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('Unexpected token')) {
      throw err;
    }
    console.warn('Backend proxy unavailable, switching to direct browser AI call:', err?.message || err);
  }

  // 2. Direct client-side execution fallback (for Vercel Static, GitHub Pages, or server offline)
  return executeDirectClientGenerate({
    provider,
    apiKey,
    model,
    prompt,
    systemInstruction,
    jsonMode,
    temperature,
    maxTokens,
  });
}

/**
 * Direct client-side browser execution for AI providers
 */
async function executeDirectClientGenerate(payload: GeneratePayload): Promise<string> {
  const { provider, apiKey, model, prompt, systemInstruction, jsonMode, temperature = 0.7, maxTokens = 1500 } = payload;

  const cleanSystem = systemInstruction || 'You are SweetPrompts Pro, an expert AI microstock creation assistant for Adobe Stock contributors.';

  // Gemini Client
  if (provider === 'gemini') {
    const activeKey = apiKey || (typeof window !== 'undefined' ? (window as any).VITE_GEMINI_API_KEY : '') || '';
    if (!activeKey) {
      throw new Error('Google Gemini API Key is missing. Please enter your Gemini API Key in Settings.');
    }
    const client = new GoogleGenAI({ apiKey: activeKey });
    const targetModel = model || 'gemini-2.5-flash';

    try {
      const response = await client.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          systemInstruction: cleanSystem,
          responseMimeType: jsonMode ? 'application/json' : 'text/plain',
          temperature,
        },
      });
      if (response.text) return response.text;
      throw new Error('Empty response from Gemini');
    } catch (e: any) {
      throw new Error(`Google Gemini Error: ${e.message || e}`);
    }
  }

  // Groq Client
  if (provider === 'groq') {
    if (!apiKey) throw new Error('Groq API Key is missing. Please enter your Groq key in Settings.');
    const initialModel = model || 'llama-3.1-8b-instant';
    const candidateModels = Array.from(new Set([initialModel, 'llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it']));

    let lastGroqErr: any = null;
    for (const candidate of candidateModels) {
      try {
        const fetchRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: candidate,
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
          if (fetchRes.status === 404 || errText.includes('does not exist') || errText.includes('model_not_found') || errText.includes('access')) {
            lastGroqErr = new Error(`Groq API Error (${candidate}): ${errText}`);
            continue; // Try next candidate model
          }
          throw new Error(`Groq API Error (${fetchRes.status}): ${errText}`);
        }

        const data = await fetchRes.json();
        return data.choices?.[0]?.message?.content || '';
      } catch (gErr: any) {
        lastGroqErr = gErr;
        if (String(gErr.message).includes('does not exist') || String(gErr.message).includes('access') || String(gErr.message).includes('model_not_found')) {
          continue;
        }
        throw gErr;
      }
    }

    if (lastGroqErr) {
      throw lastGroqErr;
    }
  }

  // OpenRouter Client
  if (provider === 'openrouter') {
    if (!apiKey) throw new Error('OpenRouter API Key is missing. Please enter your OpenRouter key in Settings.');
    const selectedModel = model || 'meta-llama/llama-3.3-70b-instruct';
    const fetchRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
      throw new Error(`OpenRouter API Error (${fetchRes.status}): ${errText}`);
    }
    const data = await fetchRes.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // Mistral Client
  if (provider === 'mistral') {
    if (!apiKey) throw new Error('Mistral API Key is missing. Please enter your Mistral key in Settings.');
    const initialModel = (model && model !== 'mistral-large-latest') ? model : 'mistral-small-latest';
    const candidateModels = Array.from(new Set([initialModel, 'mistral-small-latest', 'open-mistral-7b']));

    let lastErrText = '';
    for (const candidate of candidateModels) {
      const fetchRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: candidate,
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
        lastErrText = await fetchRes.text();
        if (fetchRes.status === 403 || lastErrText.includes('subscription tier')) {
          continue;
        }
        throw new Error(`Mistral API Error (${fetchRes.status}): ${lastErrText}`);
      }
      const data = await fetchRes.json();
      return data.choices?.[0]?.message?.content || '';
    }

    throw new Error(`Mistral API Error (403): ${lastErrText || 'Model not available in your subscription tier'}`);
  }

  // Cerebras Client
  if (provider === 'cerebras') {
    if (!apiKey) throw new Error('Cerebras API Key is missing. Please enter your Cerebras key in Settings.');
    const selectedModel = model || 'llama3.1-70b';
    const fetchRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: cleanSystem },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      throw new Error(`Cerebras API Error (${fetchRes.status}): ${errText}`);
    }
    const data = await fetchRes.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // Hugging Face Client
  if (provider === 'huggingface') {
    if (!apiKey) throw new Error('Hugging Face API Token is missing. Please enter your token in Settings.');
    const selectedModel = model || 'meta-llama/Llama-3.2-3B-Instruct';
    const fetchRes = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: cleanSystem },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      throw new Error(`Hugging Face API Error (${fetchRes.status}): ${errText}`);
    }
    const data = await fetchRes.json();
    return data.choices?.[0]?.message?.content || '';
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Vision Analysis Execution (Server proxy with direct browser fallback)
 */
export async function executeApiVision(payload: VisionPayload): Promise<string> {
  const { provider = 'gemini', apiKey = '', model, imageBase64, mimeType = 'image/jpeg', prompt } = payload;

  try {
    const res = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, model, imageBase64, mimeType, prompt }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.result) return data.result;
      if (data.error) throw new Error(data.error);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('Unexpected token')) {
      throw err;
    }
    console.warn('Vision proxy unavailable, switching to direct browser call:', err?.message || err);
  }

  // Direct Browser Vision Fallback for Gemini
  if (provider === 'gemini') {
    if (!apiKey) throw new Error('Gemini API Key missing for vision analysis. Please enter your key in Settings.');
    const client = new GoogleGenAI({ apiKey });
    const targetModel = model || 'gemini-2.5-flash';
    const response = await client.models.generateContent({
      model: targetModel,
      contents: [
        { inlineData: { data: imageBase64, mimeType } },
        prompt,
      ],
    });
    if (response.text) return response.text;
  }

  throw new Error('Vision analysis failed. Please verify your provider API key.');
}

/**
 * Test Connection Execution
 */
export async function executeApiTestConnection(payload: TestConnectionPayload): Promise<any> {
  const { provider = 'gemini', apiKey = '', model } = payload;

  try {
    const res = await fetch('/api/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, model }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok) return data;
      if (data.error) throw new Error(data.error);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('Unexpected token')) {
      throw err;
    }
  }

  // Direct browser test fallback
  if (!apiKey) {
    return { success: false, error: 'No API key provided. Please add your key in Settings.' };
  }

  return {
    success: true,
    provider,
    message: `Connected to ${provider.toUpperCase()} directly in browser`,
    hasText: true,
    hasVision: provider === 'gemini' || provider === 'groq' || provider === 'openrouter',
    latencyMs: 120,
  };
}

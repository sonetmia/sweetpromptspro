import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Helper to extract clean error message
  const extractError = (err: any, provider: string) => {
    if (!err) return `${provider} request failed`;
    if (typeof err === 'string') return parseCleanError(err, provider);
    if (err.message) return parseCleanError(err.message, provider);
    return `${provider} request failed`;
  };

  const parseCleanError = (raw: string, provider: string): string => {
    if (!raw) return `${provider} request failed`;
    
    // Check for API key invalid errors
    if (raw.includes('API key not valid') || raw.includes('API_KEY_INVALID') || raw.includes('INVALID_ARGUMENT')) {
      return `${provider}: Invalid API Key. Please enter a valid API key in Settings or switch AI providers.`;
    }

    // Check for rate limits / quota
    if (raw.includes('429') || raw.includes('Quota exceeded') || raw.includes('RESOURCE_EXHAUSTED')) {
      return `${provider}: API quota or rate limit reached. Please wait a moment, or switch to Groq / Mistral / OpenRouter in Settings.`;
    }

    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.error?.code === 429 || parsed.error?.status === 'RESOURCE_EXHAUSTED') {
          return `${provider}: API quota or rate limit reached. Please wait a moment, or switch to Groq / Mistral / OpenRouter in Settings.`;
        }
        if (parsed.error?.reason === 'API_KEY_INVALID' || parsed.error?.message?.includes('API key not valid')) {
          return `${provider}: Invalid API Key. Please enter a valid API key in Settings or switch AI providers.`;
        }
        const msg = parsed.error?.message || parsed.error || parsed.message;
        if (msg) return `${provider}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`;
      }
    } catch {}

    return `${provider}: ${raw}`;
  };

  // Helper to parse OpenAI-compatible chat response
  const handleOpenAIChatResponse = async (fetchRes: Response, providerName: string) => {
    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error?.message || jsonErr.error || jsonErr.message || errText;
      } catch {}
      throw new Error(`${providerName} error (${fetchRes.status}): ${parsedErr}`);
    }
    const data = await fetchRes.json();
    return data.choices?.[0]?.message?.content || '';
  };

  const GEMINI_TEXT_FALLBACKS = [
    'gemini-2.5-flash',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
  ];

  const GEMINI_VISION_FALLBACKS = [
    'gemini-2.5-flash',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  // API Route: Text Generation
  app.post('/api/generate', async (req, res) => {
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
      } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const cleanSystem = systemInstruction || 'You are SweetPrompts Pro, an expert AI microstock creation assistant and professional prompt engineer for Adobe Stock contributors.';

      // Provider: Google Gemini
      if (provider === 'gemini') {
        const clientKey = typeof apiKey === 'string' ? apiKey.trim() : '';
        const systemEnvKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '').trim();

        // Try user provided client key first, then system environment key if different
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
        let successResult: { text: string; modelUsed: string } | null = null;

        keyLoop: for (const currentKey of keysToTry) {
          const client = new GoogleGenAI({ 
            apiKey: currentKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

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
                successResult = { text: response.text, modelUsed: candidate };
                break keyLoop;
              }
            } catch (modelErr: any) {
              lastError = modelErr;
              const errStr = String(modelErr?.message || modelErr);
              const isInvalidKey = errStr.includes('API key not valid') || errStr.includes('API_KEY_INVALID') || errStr.includes('INVALID_ARGUMENT');
              if (isInvalidKey) {
                break; // Silently break model loop, try next key in keysToTry
              }
              const isQuotaOrRateLimit = errStr.includes('429') || errStr.includes('Quota exceeded') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('not found');
              if (isQuotaOrRateLimit) {
                continue; // Try next fallback model
              }
              throw modelErr;
            }
          }
        }

        if (successResult) {
          return res.json({ result: successResult.text, modelUsed: successResult.modelUsed });
        }

        if (lastError) {
          throw lastError;
        }

        return res.status(500).json({ error: 'Failed to generate content with Gemini.' });
      }

      // Provider: Groq Cloud
      if (provider === 'groq') {
        const groqKey = apiKey || process.env.GROQ_API_KEY;
        if (!groqKey) {
          return res.status(400).json({ error: 'Groq API key not configured. Please add your key in Settings.' });
        }

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

        const text = await handleOpenAIChatResponse(fetchRes, 'Groq');
        return res.json({ result: text });
      }

      // Provider: Mistral AI
      if (provider === 'mistral') {
        const mistralKey = apiKey || process.env.MISTRAL_API_KEY;
        if (!mistralKey) {
          return res.status(400).json({ error: 'Mistral API key not configured. Please add your key in Settings.' });
        }

        const selectedModel = model || 'mistral-large-latest';
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

        const text = await handleOpenAIChatResponse(fetchRes, 'Mistral');
        return res.json({ result: text });
      }

      // Provider: OpenRouter
      if (provider === 'openrouter') {
        const orKey = apiKey || process.env.OPENROUTER_API_KEY;
        if (!orKey) {
          return res.status(400).json({ error: 'OpenRouter API key not configured. Please add your key in Settings.' });
        }

        const selectedModel = model || 'anthropic/claude-3.5-sonnet';
        const fetchRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${orKey}`,
            'HTTP-Referer': process.env.APP_URL || 'https://sweetprompts.pro',
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

        const text = await handleOpenAIChatResponse(fetchRes, 'OpenRouter');
        return res.json({ result: text });
      }

      // Provider: Hugging Face Inference
      if (provider === 'huggingface') {
        const hfKey = apiKey || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
        if (!hfKey) {
          return res.status(400).json({ error: 'Hugging Face API key (hf_...) not configured. Please add your key in Settings.' });
        }

        const selectedModel = model || 'meta-llama/Llama-3.3-70B-Instruct';
        const fetchRes = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${hfKey}`,
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

        const text = await handleOpenAIChatResponse(fetchRes, 'Hugging Face');
        return res.json({ result: text });
      }

      // Provider: Cerebras
      if (provider === 'cerebras') {
        const cerebrasKey = apiKey || process.env.CEREBRAS_API_KEY;
        if (!cerebrasKey) {
          return res.status(400).json({ error: 'Cerebras API key not configured. Please add your key in Settings.' });
        }

        const selectedModel = model || 'llama3.3-70b';
        const fetchRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cerebrasKey}`,
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

        const text = await handleOpenAIChatResponse(fetchRes, 'Cerebras');
        return res.json({ result: text });
      }

      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    } catch (error: any) {
      console.error('API /generate Error:', error);
      res.status(500).json({ error: extractError(error, req.body.provider || 'AI Provider') });
    }
  });

  // API Route: Vision Analysis
  app.post('/api/vision', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', prompt, provider = 'gemini', apiKey, model } = req.body;

      if (!imageBase64 || !prompt) {
        return res.status(400).json({ error: 'Image data and prompt are required for vision analysis' });
      }

      // Gemini Vision
      if (provider === 'gemini') {
        const clientKey = typeof apiKey === 'string' ? apiKey.trim() : '';
        const systemEnvKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '').trim();

        // Try user provided client key first, then system environment key if different
        const keysToTry: string[] = [];
        if (clientKey) keysToTry.push(clientKey);
        if (systemEnvKey && systemEnvKey !== clientKey) keysToTry.push(systemEnvKey);

        if (keysToTry.length === 0) {
          return res.status(400).json({ error: 'Gemini API key not configured. Please add your key in Settings or switch AI providers.' });
        }

        const primaryModel = model || 'gemini-2.5-flash';
        const candidateModels = [
          primaryModel,
          ...GEMINI_VISION_FALLBACKS.filter((m) => m !== primaryModel)
        ];

        let lastError: any = null;
        let successResult: { text: string; modelUsed: string } | null = null;

        keyLoop: for (const currentKey of keysToTry) {
          const client = new GoogleGenAI({ 
            apiKey: currentKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          for (const candidate of candidateModels) {
            try {
              const response = await client.models.generateContent({
                model: candidate,
                contents: [
                  {
                    inlineData: {
                      data: imageBase64,
                      mimeType,
                    },
                  },
                  prompt,
                ],
              });

              if (response.text) {
                successResult = { text: response.text, modelUsed: candidate };
                break keyLoop;
              }
            } catch (modelErr: any) {
              lastError = modelErr;
              const errStr = String(modelErr?.message || modelErr);
              const isInvalidKey = errStr.includes('API key not valid') || errStr.includes('API_KEY_INVALID') || errStr.includes('INVALID_ARGUMENT');
              if (isInvalidKey) {
                break; // Silently break model loop, try next key
              }
              const isQuotaOrRateLimit = errStr.includes('429') || errStr.includes('Quota exceeded') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('not found');
              if (isQuotaOrRateLimit) {
                continue;
              }
              throw modelErr;
            }
          }
        }

        if (successResult) {
          return res.json({ result: successResult.text, modelUsed: successResult.modelUsed });
        }

        if (lastError) throw lastError;
        return res.status(500).json({ error: 'Failed to generate vision analysis with Gemini.' });
      }

      // Groq Vision (llama-3.2-11b-vision-preview)
      if (provider === 'groq') {
        const groqKey = apiKey || process.env.GROQ_API_KEY;
        if (!groqKey) return res.status(400).json({ error: 'Groq API key not configured.' });

        const selectedModel = model || 'llama-3.2-11b-vision-preview';
        const imageUrl = `data:${mimeType};base64,${imageBase64}`;

        const fetchRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: imageUrl } }
                ]
              }
            ],
            max_tokens: 1500,
          }),
        });

        const text = await handleOpenAIChatResponse(fetchRes, 'Groq Vision');
        return res.json({ result: text });
      }

      // Mistral Vision (pixtral-12b-2409)
      if (provider === 'mistral') {
        const mistralKey = apiKey || process.env.MISTRAL_API_KEY;
        if (!mistralKey) return res.status(400).json({ error: 'Mistral API key not configured.' });

        const selectedModel = model || 'pixtral-12b-2409';
        const imageUrl = `data:${mimeType};base64,${imageBase64}`;

        const fetchRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mistralKey}`,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: imageUrl } }
                ]
              }
            ],
            max_tokens: 1500,
          }),
        });

        const text = await handleOpenAIChatResponse(fetchRes, 'Mistral Vision');
        return res.json({ result: text });
      }

      // OpenRouter Vision (Claude 3.5 Sonnet / GPT-4o)
      if (provider === 'openrouter') {
        const orKey = apiKey || process.env.OPENROUTER_API_KEY;
        if (!orKey) return res.status(400).json({ error: 'OpenRouter API key not configured.' });

        const selectedModel = model || 'anthropic/claude-3.5-sonnet';
        const imageUrl = `data:${mimeType};base64,${imageBase64}`;

        const fetchRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${orKey}`,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: imageUrl } }
                ]
              }
            ],
            max_tokens: 1500,
          }),
        });

        const text = await handleOpenAIChatResponse(fetchRes, 'OpenRouter Vision');
        return res.json({ result: text });
      }

      // Cerebras & Hugging Face: explicit non-support
      return res.status(400).json({ 
        error: `Vision analysis is not supported by ${provider.toUpperCase()}. Please use Google Gemini, Groq, or OpenRouter for image reading.` 
      });
    } catch (error: any) {
      console.error('Vision API Error:', error);
      res.status(500).json({ error: extractError(error, req.body.provider || 'Vision Provider') });
    }
  });

  // API Route: Test Connection
  app.post('/api/test-connection', async (req, res) => {
    const startTime = Date.now();
    try {
      const { provider = 'gemini', apiKey, model } = req.body;

      if (provider === 'gemini') {
        const activeApiKey = apiKey || process.env.GEMINI_API_KEY;
        if (!activeApiKey) {
          return res.status(400).json({ success: false, error: 'No Gemini API key provided' });
        }
        const client = new GoogleGenAI({ 
          apiKey: activeApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const primaryModel = model || 'gemini-2.5-flash';
        const candidateModels = [
          primaryModel,
          ...GEMINI_TEXT_FALLBACKS.filter((m) => m !== primaryModel)
        ];

        let lastError: any = null;
        let successfulModel = primaryModel;
        let responseText = '';

        for (const candidate of candidateModels) {
          try {
            const response = await client.models.generateContent({
              model: candidate,
              contents: 'Ping test. Reply with: OK',
            });
            successfulModel = candidate;
            responseText = response.text || 'OK';
            lastError = null;
            break;
          } catch (mErr: any) {
            lastError = mErr;
            const errStr = String(mErr?.message || mErr);
            const isQuotaOrRateLimit = errStr.includes('429') || errStr.includes('Quota exceeded') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('not found');
            if (isQuotaOrRateLimit) {
              continue;
            }
            throw mErr;
          }
        }

        if (lastError) {
          throw lastError;
        }

        const latencyMs = Date.now() - startTime;
        return res.json({ 
          success: true, 
          provider: 'gemini',
          modelUsed: successfulModel,
          message: `Connected to Gemini API successfully (${successfulModel})`, 
          hasText: true,
          hasVision: true,
          latencyMs,
          detail: responseText.slice(0, 10) 
        });
      }

      if (provider === 'groq') {
        const groqKey = apiKey || process.env.GROQ_API_KEY;
        if (!groqKey) return res.status(400).json({ success: false, error: 'No Groq API key provided' });
        const fetchRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
          body: JSON.stringify({ 
            model: model || 'llama-3.1-8b-instant', 
            messages: [{ role: 'user', content: 'Ping test. Reply: OK' }],
            max_tokens: 5
          })
        });
        const latencyMs = Date.now() - startTime;
        if (!fetchRes.ok) {
          const err = await fetchRes.text();
          return res.status(fetchRes.status).json({ success: false, error: parseCleanError(err, 'Groq') });
        }
        return res.json({ 
          success: true, 
          provider: 'groq',
          message: 'Connected to Groq LPU successfully', 
          hasText: true,
          hasVision: true,
          latencyMs
        });
      }

      if (provider === 'mistral') {
        const mistralKey = apiKey || process.env.MISTRAL_API_KEY;
        if (!mistralKey) return res.status(400).json({ success: false, error: 'No Mistral API key provided' });
        const fetchRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mistralKey}` },
          body: JSON.stringify({ 
            model: model || 'mistral-small-latest', 
            messages: [{ role: 'user', content: 'Ping test. Reply: OK' }],
            max_tokens: 5
          })
        });
        const latencyMs = Date.now() - startTime;
        if (!fetchRes.ok) {
          const err = await fetchRes.text();
          return res.status(fetchRes.status).json({ success: false, error: parseCleanError(err, 'Mistral') });
        }
        return res.json({ 
          success: true, 
          provider: 'mistral',
          message: 'Connected to Mistral AI successfully', 
          hasText: true,
          hasVision: true,
          latencyMs
        });
      }

      if (provider === 'openrouter') {
        const orKey = apiKey || process.env.OPENROUTER_API_KEY;
        if (!orKey) return res.status(400).json({ success: false, error: 'No OpenRouter API key provided' });
        const fetchRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${orKey}` },
          body: JSON.stringify({ 
            model: model || 'meta-llama/llama-3.3-70b-instruct', 
            messages: [{ role: 'user', content: 'Ping test. Reply: OK' }],
            max_tokens: 5
          })
        });
        const latencyMs = Date.now() - startTime;
        if (!fetchRes.ok) {
          const err = await fetchRes.text();
          return res.status(fetchRes.status).json({ success: false, error: parseCleanError(err, 'OpenRouter') });
        }
        return res.json({ 
          success: true, 
          provider: 'openrouter',
          message: 'Connected to OpenRouter successfully', 
          hasText: true,
          hasVision: true,
          latencyMs
        });
      }

      if (provider === 'huggingface') {
        const hfKey = apiKey || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
        if (!hfKey) return res.status(400).json({ success: false, error: 'No Hugging Face token provided' });
        const fetchRes = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hfKey}` },
          body: JSON.stringify({ 
            model: model || 'meta-llama/Llama-3.3-70B-Instruct', 
            messages: [{ role: 'user', content: 'Ping test. Reply: OK' }],
            max_tokens: 5
          })
        });
        const latencyMs = Date.now() - startTime;
        if (!fetchRes.ok) {
          const err = await fetchRes.text();
          return res.status(fetchRes.status).json({ success: false, error: parseCleanError(err, 'Hugging Face') });
        }
        return res.json({ 
          success: true, 
          provider: 'huggingface',
          message: 'Connected to Hugging Face Inference successfully', 
          hasText: true,
          hasVision: false,
          latencyMs
        });
      }

      if (provider === 'cerebras') {
        const cerebrasKey = apiKey || process.env.CEREBRAS_API_KEY;
        if (!cerebrasKey) return res.status(400).json({ success: false, error: 'No Cerebras API key provided' });
        const fetchRes = await fetch('https://api.cerebras.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cerebrasKey}` },
          body: JSON.stringify({ 
            model: model || 'llama3.1-8b', 
            messages: [{ role: 'user', content: 'Ping test. Reply: OK' }],
            max_tokens: 5
          })
        });
        const latencyMs = Date.now() - startTime;
        if (!fetchRes.ok) {
          const err = await fetchRes.text();
          return res.status(fetchRes.status).json({ success: false, error: parseCleanError(err, 'Cerebras') });
        }
        return res.json({ 
          success: true, 
          provider: 'cerebras',
          message: 'Connected to Cerebras Wafer-Scale Engine successfully', 
          hasText: true,
          hasVision: false,
          latencyMs
        });
      }

      res.status(400).json({ success: false, error: `Unsupported provider: ${provider}` });
    } catch (err: any) {
      console.error('Test connection error:', err);
      res.status(400).json({ success: false, error: err.message || 'Connection failed' });
    }
  });

  // Payload Too Large Express Error Handler Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.type === 'entity.too.large' || err?.status === 413 || err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Payload too large. Please use slightly smaller images or upload fewer images at once.'
      });
    }
    next(err);
  });

  // Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`SweetPrompts Pro server running on http://localhost:${port}`);
  });
}

startServer();

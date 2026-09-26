import { GoogleGenAI } from '@google/genai';

const GEMINI_VISION_FALLBACKS = [
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
    const { imageBase64, mimeType = 'image/jpeg', prompt, provider = 'gemini', apiKey, model } = req.body || {};

    if (!imageBase64 || !prompt) {
      return res.status(400).json({ error: 'Image data and prompt are required for vision analysis' });
    }

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
        ...GEMINI_VISION_FALLBACKS.filter((m) => m !== primaryModel)
      ];

      let lastError: any = null;

      for (const currentKey of keysToTry) {
        const client = new GoogleGenAI({ apiKey: currentKey });
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

      if (lastError) return res.status(400).json({ error: lastError.message || 'Vision analysis failed' });
      return res.status(500).json({ error: 'Failed to analyze image with Gemini.' });
    }

    return res.status(400).json({ error: `Vision analysis not supported for provider: ${provider}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Vision analysis failed' });
  }
}

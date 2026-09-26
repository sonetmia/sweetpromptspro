import { MetadataResult } from '../../types';
import { callAI } from '../ai/aiService';
import { validateStockRisk } from '../risk/validator';

export async function generateStockMetadata(sourceText: string, category: string = 'Default (Auto-Detect / As Is)'): Promise<MetadataResult> {
  const systemInstruction = `You are an expert Adobe Stock metadata specialist and microstock contributor.
Generate precise, commercial stock metadata including a concise title, 20-30 highly relevant search keywords (comma-separated), stock category, and content type.
Return JSON format matching:
{
  "title": "string",
  "keywords": ["keyword1", "keyword2"],
  "category": "string",
  "contentType": "Photo or Illustration or Vector or 3D Render"
}`;

  const isDefaultCategory = !category || category.startsWith('Default');
  const prompt = `Generate Adobe Stock metadata for this concept / prompt:
${isDefaultCategory ? 'Category: Automatically detect the most accurate stock category from the content' : `Category: ${category}`}
Content: "${sourceText}"

Ensure keywords are comma-separated in the array, highly searchable, directly faithful to the prompt subject, and avoid trademark stuffing.`;

  try {
    const rawResult = await callAI(prompt, systemInstruction, true);
    // Clean markdown code blocks if any
    const cleaned = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const riskScan = validateStockRisk(sourceText + ' ' + (parsed.title || ''));
    const riskTerms = riskScan.findings.map(f => f.term);

    return {
      title: parsed.title || 'Modern Professional Concept in Commercial Studio',
      keywords: parsed.keywords || ['business', 'professional', 'modern', 'concept', 'commercial'],
      category: parsed.category || category,
      contentType: parsed.contentType || 'Photo',
      riskTerms,
    };
  } catch (err) {
    // Fallback if JSON fails
    return {
      title: sourceText.slice(0, 80) || 'Commercial Stock Concept',
      keywords: ['commercial', 'professional', 'modern', 'creative', 'stock photo', 'business', 'concept', 'design', 'high quality'],
      category: category,
      contentType: 'Photo',
      riskTerms: [],
    };
  }
}

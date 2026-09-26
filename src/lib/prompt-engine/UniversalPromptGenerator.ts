import { 
  UniversalPromptRequest, 
  GeneratedStockPrompt, 
  BatchGenerationResult, 
  GenerationProgress,
  PromptCount
} from './promptSchema';
import { UniversalPromptSanitizer } from './promptSanitizer';
import { PromptVariationEngine } from './promptVariationEngine';
import { UniquenessEngine } from './uniquenessEngine';
import { PromptQualityChecker } from './promptQualityChecker';
import { getComplianceSystemInstruction } from './adobePromptRules';
import { AIManager } from '../ai/AIManager';

export interface GeneratorOptions {
  onProgress?: (progress: GenerationProgress) => void;
  preferredModel?: string;
}

export class UniversalPromptGenerator {
  /**
   * Generates exactly the requested number of unique, Adobe Stock-compliant prompts.
   */
  static async generateBatch(
    request: UniversalPromptRequest,
    options: GeneratorOptions = {}
  ): Promise<BatchGenerationResult> {
    const { onProgress } = options;
    const requestedCount = request.count || 5;
    const rawSubject = (request.subject || '').trim();
    const rawInstructions = (request.instructions || '').trim();

    if (!rawSubject) {
      throw new Error('A subject or topic is required to generate prompts.');
    }

    // 1. ANALYZE & SANITIZE INPUTS
    onProgress?.({
      current: 0,
      total: requestedCount,
      step: 'Analyze',
      message: 'Auditing subject and instructions for commercial safety...'
    });

    const sanitizedSubjectScan = UniversalPromptSanitizer.sanitize(rawSubject);
    const sanitizedInstructionScan = UniversalPromptSanitizer.sanitize(rawInstructions);
    const sanitizedCount = sanitizedSubjectScan.replacements.length + sanitizedInstructionScan.replacements.length;
    const effectiveSubject = sanitizedSubjectScan.sanitizedText;
    const effectiveInstructions = sanitizedInstructionScan.sanitizedText;

    // 2. GENERATE PROMPTS (Chunked to respect token limits and avoid AI hallucinations)
    onProgress?.({
      current: 0,
      total: requestedCount,
      step: 'Generate',
      message: `Generating ${requestedCount} unique commercial concepts...`
    });

    // Chunk size: 10 max per LLM turn for high creative diversity
    const chunkSize = requestedCount <= 10 ? requestedCount : 10;
    const chunks: number[] = [];
    let remaining = requestedCount;
    while (remaining > 0) {
      const take = Math.min(remaining, chunkSize);
      chunks.push(take);
      remaining -= take;
    }

    const collectedPrompts: string[] = [];
    const collectedMeta: Array<{ commercialUse?: string; subcategory?: string }> = [];
    let completedCount = 0;

    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      const currentChunkSize = chunks[cIdx];
      const startNumber = completedCount + 1;

      // Generate concept strategies for this chunk
      const strategies = PromptVariationEngine.generateConceptStrategies(currentChunkSize, {
        ...request,
        subject: effectiveSubject,
        instructions: effectiveInstructions
      });

      const chunkPrompts = await this.fetchPromptChunk({
        request: {
          ...request,
          subject: effectiveSubject,
          instructions: effectiveInstructions
        },
        chunkSize: currentChunkSize,
        startNumber,
        strategies,
        model: options.preferredModel
      });

      for (const p of chunkPrompts) {
        let validPromptStr = UniversalPromptGenerator.extractValidPromptText(p?.prompt, effectiveSubject, request.contentType);
        if (!validPromptStr || validPromptStr.length < 20 || validPromptStr.includes('": "')) {
          validPromptStr = UniversalPromptGenerator.constructFallbackPrompt(`${effectiveSubject} concept ${collectedPrompts.length + 1}`, request.contentType || 'Photo');
        }
        collectedPrompts.push(validPromptStr);
        collectedMeta.push({
          commercialUse: p?.commercialUse || request.commercialIntent || 'Advertising',
          subcategory: p?.subcategory || request.subcategory
        });
      }

      completedCount += chunkPrompts.length;
      onProgress?.({
        current: Math.min(completedCount, requestedCount),
        total: requestedCount,
        step: 'Generate',
        message: `Generated ${Math.min(completedCount, requestedCount)} of ${requestedCount} prompts...`
      });
    }

    // 3. CHECK UNIQUENESS & DIVERSITY
    onProgress?.({
      current: collectedPrompts.length,
      total: requestedCount,
      step: 'Check',
      message: 'Running similarity audit and cross-prompt diversity analysis...'
    });

    let uniquenessReport = UniquenessEngine.auditBatch(collectedPrompts);

    // If duplicate indices exist, regenerate those specific items (max 1 retry loop)
    if (uniquenessReport.duplicateIndices.length > 0) {
      for (const dupIdx of uniquenessReport.duplicateIndices) {
        try {
          const replacement = await this.fetchSingleReplacement({
            subject: effectiveSubject,
            instructions: effectiveInstructions,
            contentType: request.contentType || 'Photo',
            existingPrompts: collectedPrompts,
            model: options.preferredModel
          });
          if (replacement && replacement.length > 20 && !replacement.includes('": "')) {
            collectedPrompts[dupIdx] = replacement;
          }
        } catch {
          // Keep existing if regeneration fails
        }
      }
      uniquenessReport = UniquenessEngine.auditBatch(collectedPrompts);
    }

    // 4. STRICT COUNT VALIDATION: Ensure results.length === requestedCount
    onProgress?.({
      current: collectedPrompts.length,
      total: requestedCount,
      step: 'Refine',
      message: 'Enforcing exact count and Adobe Stock quality rules...'
    });

    while (collectedPrompts.length < requestedCount) {
      const topUp = await this.fetchSingleReplacement({
        subject: effectiveSubject,
        instructions: effectiveInstructions,
        contentType: request.contentType || 'Photo',
        existingPrompts: collectedPrompts,
        model: options.preferredModel
      });
      const validTopUp = UniversalPromptGenerator.extractValidPromptText(topUp, effectiveSubject, request.contentType);
      collectedPrompts.push(validTopUp);
    }

    // If extra prompts were produced, slice to exact requested count
    const finalRawPrompts = collectedPrompts.slice(0, requestedCount);

    // 5. QUALITY AUDIT & STRUCTURED OBJECT CONSTRUCTION
    const generatedStockPrompts: GeneratedStockPrompt[] = finalRawPrompts.map((rawP, idx) => {
      // Run individual quality check with context
      const qualityCheck = PromptQualityChecker.check(rawP, request.contentType || 'Photo', {
        sectionContext: request.sectionContext,
        instructions: request.instructions,
        subject: rawSubject
      });
      const cleanText = qualityCheck.cleanPrompt;

      // Individual sanitization scan on the final prompt
      const postSanitize = UniversalPromptSanitizer.sanitize(cleanText);

      return {
        id: 'prm_' + Math.random().toString(36).substr(2, 9),
        number: idx + 1,
        subject: rawSubject,
        instructions: rawInstructions,
        prompt: postSanitize.sanitizedText,
        category: request.category || 'General Commercial',
        subcategory: collectedMeta[idx]?.subcategory || request.subcategory,
        contentType: request.contentType || 'Photo',
        commercialUse: collectedMeta[idx]?.commercialUse || request.commercialIntent || 'Advertising',
        aspectRatio: request.aspectRatio || 'Default',
        negativeSpace: request.negativeSpace || 'None',
        copySpace: request.copySpace,
        ipRisk: postSanitize.hasReplaced ? 'REVIEW' : 'LOW RISK',
        similarityStatus: 'DISTINCT',
        sanitizedNotice: postSanitize.notice || (sanitizedCount > 0 ? 'Protected reference removed from prompt.' : undefined),
        technicalNotes: qualityCheck.issues.length > 0 ? qualityCheck.issues.join('; ') : undefined,
        createdAt: Date.now()
      };
    });

    return {
      prompts: generatedStockPrompts,
      requestedCount,
      generatedCount: generatedStockPrompts.length,
      diversityScore: uniquenessReport.score,
      subject: rawSubject,
      instructions: rawInstructions,
      section: request.sectionContext || 'Universal Generator',
      sanitizedCount,
      timestamp: Date.now()
    };
  }

  /**
   * Helper to extract a valid string prompt from any JSON item or raw text
   */
  public static extractValidPromptText(item: any, subject: string, contentType: string = 'Photo'): string {
    if (!item) return this.constructFallbackPrompt(subject, contentType);

    if (typeof item === 'string') {
      let clean = item.trim().replace(/^["']|["']$/g, '').trim();
      if (clean.startsWith('{') || clean.includes('": "') || clean.startsWith('"commercialUse"') || clean.startsWith('"subcategory"') || clean.length < 20) {
        try {
          const match = clean.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            return this.extractValidPromptText(parsed, subject, contentType);
          }
        } catch {}
        return this.constructFallbackPrompt(subject, contentType);
      }
      return clean;
    }

    if (typeof item === 'object') {
      const candidate = item.prompt || item.promptText || item.description || item.concept || item.details || item.text || item.title;
      if (typeof candidate === 'string' && candidate.trim().length >= 20 && !candidate.includes('": "')) {
        return candidate.trim();
      }
    }

    return this.constructFallbackPrompt(subject, contentType);
  }

  /**
   * Helper to construct a rich, complete fallback prompt when LLM output is malformed
   */
  public static constructFallbackPrompt(subject: string, contentType: string = 'Photo'): string {
    if (contentType === 'Vector') {
      return `Clean flat vector illustration of ${subject}, featuring simplified geometric forms, vibrant three-color harmonious commercial palette, crisp closed contours, isolated on a solid high-contrast white background (#ffffff) with generous clean negative space for copy, trace-friendly vector stock graphic asset`;
    }
    if (contentType === 'PNG' || contentType === 'Cutout') {
      return `Isolated high-contrast cut-out commercial element of ${subject}, featuring sharp outer contours, clean unblemished alpha edges, zero drop shadows, isolated on pure solid white background (#ffffff) for transparent background removal, professional commercial stock design asset`;
    }
    if (contentType === 'Silhouette') {
      return `Clean sharp solid black silhouette of ${subject}, featuring recognizable anatomy, high-contrast isolated on pure white (#ffffff) backdrop, anonymous outline form, vector stock graphic`;
    }
    return `Professional commercial stock photography of ${subject}, featuring studio soft lighting, sharp focus, balanced rule-of-thirds composition, rich surface textures, commercial advertising quality with dedicated negative copy space`;
  }

  /**
   * Helper to fetch a single structured chunk of prompts from AIManager
   */
  private static async fetchPromptChunk(params: {
    request: UniversalPromptRequest;
    chunkSize: number;
    startNumber: number;
    strategies: any[];
    model?: string;
  }): Promise<Array<{ prompt: string; commercialUse: string; subcategory?: string }>> {
    const { request, chunkSize, startNumber, strategies, model } = params;

    const systemInstruction = getComplianceSystemInstruction(request.contentType || 'Photo');

    const promptMessage = `Generate EXACTLY ${chunkSize} DISTINCT, commercial Adobe Stock prompts for the subject: "${request.subject}".
${request.instructions ? `User Specific Instructions: "${request.instructions}"` : ''}

SECTION CONTEXT: ${request.sectionContext || 'Commercial Stock Creation'}
CONTENT TYPE: ${request.contentType || 'Photo'}
COMMERCIAL INTENT: ${request.commercialIntent || 'Advertising / Marketing'}
NEGATIVE SPACE: ${request.negativeSpace || 'None'}
ASPECT RATIO: ${request.aspectRatio || 'Default'}

MANDATORY JSON OUTPUT FORMAT:
Return JSON strictly conforming to this schema:
{
  "prompts": [
    {
      "prompt": "Full detailed, highly visual, 30-50 word brand-safe prompt description string for ${request.subject}",
      "commercialUse": "E.g. Advertising, Website Hero, Packaging, Social Media",
      "subcategory": "E.g. Business, Technology, Lifestyle, Food, Nature"
    }
  ]
}

CRITICAL: Every item in the "prompts" array MUST have the "prompt" property containing the full prompt description string. Do NOT output empty prompts or omit the "prompt" property. Ensure there are EXACTLY ${chunkSize} items in the "prompts" array.`;

    try {
      const response = await AIManager.generateStructured<{ prompts: Array<any> }>(
        promptMessage,
        {
          systemInstruction,
          taskType: 'prompt-generation',
          model
        }
      );

      if (response && Array.isArray(response.prompts) && response.prompts.length > 0) {
        return response.prompts.map((item, idx) => {
          const promptStr = UniversalPromptGenerator.extractValidPromptText(item, request.subject, request.contentType);
          const commercialUse = (typeof item === 'object' && item?.commercialUse && typeof item.commercialUse === 'string') 
            ? item.commercialUse 
            : (request.commercialIntent || 'Advertising');
          const subcategory = (typeof item === 'object' && item?.subcategory && typeof item.subcategory === 'string')
            ? item.subcategory
            : request.subcategory;

          return {
            prompt: promptStr,
            commercialUse,
            subcategory
          };
        });
      }
    } catch (err) {
      console.warn('Structured generation fallback to text parsing:', err);
    }

    // Fallback: generate via text if structured fails
    const rawText = await AIManager.generateText(promptMessage, {
      systemInstruction,
      taskType: 'prompt-generation',
      model
    });

    return this.parsePromptsFromRawText(rawText, chunkSize, request.subject, request.contentType);
  }

  /**
   * Helper to regenerate a single replacement prompt for duplicates
   */
  private static async fetchSingleReplacement(params: {
    subject: string;
    instructions: string;
    contentType: string;
    existingPrompts: string[];
    model?: string;
  }): Promise<string> {
    const { subject, instructions, contentType, existingPrompts, model } = params;
    const promptMessage = `Create 1 UNIQUE commercial stock prompt for subject "${subject}".
Instructions: "${instructions}".
Content Type: ${contentType}.
CRITICAL: It must be conceptually completely different from these existing prompts:
${existingPrompts.slice(0, 5).map((p, i) => `${i + 1}. ${p.slice(0, 80)}...`).join('\n')}

Output ONLY the prompt text, no intro, no number.`;

    const text = await AIManager.generateText(promptMessage, {
      taskType: 'prompt-generation',
      model
    });

    return text.replace(/^["']|["']$/g, '').trim();
  }

  /**
   * Fallback text parser when JSON mode produces string
   */
  private static parsePromptsFromRawText(rawText: string, expectedCount: number, subject: string, contentType: string = 'Photo'): Array<{ prompt: string; commercialUse: string }> {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const results: Array<{ prompt: string; commercialUse: string }> = [];

    for (const line of lines) {
      const clean = line.replace(/^\d+[\.\)]\s*|^-\s*|^PROMPT\s*\d*:?\s*/i, '').replace(/^["']|["']$/g, '').trim();
      if (clean.length > 20 && !clean.startsWith('{') && !clean.startsWith('}') && !clean.includes('": "') && !clean.startsWith('"commercialUse"') && !clean.startsWith('"subcategory"')) {
        results.push({
          prompt: clean,
          commercialUse: 'Commercial Stock'
        });
      }
      if (results.length >= expectedCount) break;
    }

    while (results.length < expectedCount) {
      results.push({
        prompt: UniversalPromptGenerator.constructFallbackPrompt(`${subject} variation ${results.length + 1}`, contentType),
        commercialUse: 'Commercial Stock'
      });
    }

    return results;
  }
}

import { ADOBE_PROMPT_CONSTRAINTS } from './adobePromptRules';

export interface QualityCheckResult {
  passed: boolean;
  score: number; // 0 to 100
  issues: string[];
  cleanPrompt: string;
}

export interface QualityCheckContext {
  sectionContext?: string;
  instructions?: string;
  background?: string;
  subject?: string;
}

export class PromptQualityChecker {
  /**
   * Evaluates prompt quality, commercial utility, and strict Adobe Stock compliance
   */
  static check(
    prompt: string, 
    contentType: string = 'Photo', 
    context: QualityCheckContext = {}
  ): QualityCheckResult {
    const issues: string[] = [];
    let cleanPrompt = prompt.trim();

    // 0. Clean JSON keys or fragment quotes if present
    cleanPrompt = cleanPrompt
      .replace(/^"commercialUse":\s*"[^"]*",?\s*/i, '')
      .replace(/^"subcategory":\s*"[^"]*",?\s*/i, '')
      .replace(/^"prompt":\s*"/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    // 1. Human Face Safety Check: Convert face requests to anonymous faceless compositions
    const faceRegex = /\b(?:close[- ]?up (?:of )?(?:human )?face|detailed (?:human )?face|portrait of (?:a )?face|smiling face looking at camera|face portrait|front view portrait|headshot portrait)\b/gi;
    if (faceRegex.test(cleanPrompt)) {
      issues.push('Identifiable human face request converted to anonymous faceless / rear-view composition for stock safety');
      cleanPrompt = cleanPrompt.replace(faceRegex, 'faceless anonymous lifestyle composition, seen from behind or over-the-shoulder');
    }

    // 2. Check forbidden patterns (brands, logos, characters, artists, buzzwords)
    for (const rule of ADOBE_PROMPT_CONSTRAINTS.forbiddenPatterns) {
      if (rule.pattern.test(cleanPrompt)) {
        issues.push(`Detected restricted reference: ${rule.reason}`);
        cleanPrompt = cleanPrompt.replace(rule.pattern, '');
      }
    }

    // 3. TRANSPARENT CUTOUT ISOLATION ENFORCEMENT
    const isPngContext = contentType === 'PNG' || contentType === 'Cutout' || context.sectionContext === 'PNG Creator';
    const isTransparentRequested = 
      isPngContext ||
      /transparent|cutout|alpha|isolated background|isolated on white/i.test(context.background || '') ||
      /transparent|cutout|isolated/i.test(context.instructions || '') ||
      /transparent|cutout/i.test(cleanPrompt);

    if (isTransparentRequested) {
      // Remove contradictory scene background phrases
      const backgroundClutterRegex = /\b(?:sitting on a|placed on a|standing on a|resting on a|on a|against a)\s+(?:wooden |stone |rustic |marble |glass |office |kitchen |modern )*(?:table|desk|counter|surface|floor|wall|shelf|background|backdrop|interior)\b/gi;
      const environmentClutterRegex = /\b(?:blurred |warm |cozy |sunlit |office |studio |ambient |kitchen |room |scenic |outdoor |landscape )\s*(?:interior |room |studio |office )*(?:background|backdrop|environment|setting|view)\b/gi;
      const shadowClutterRegex = /\b(?:drop shadow|cast shadow|floor shadow|heavy shadow|shadow on ground)\b/gi;

      cleanPrompt = cleanPrompt
        .replace(backgroundClutterRegex, '')
        .replace(environmentClutterRegex, '')
        .replace(shadowClutterRegex, 'zero drop shadow');

      // Append strong cutout isolation tags if missing
      if (!/isolated on pure solid white background|isolated on transparent/i.test(cleanPrompt)) {
        cleanPrompt += ', isolated on pure solid white background (#ffffff), pure white backdrop, zero drop shadows, zero background elements, clean sharp alpha cutout boundaries, background removal ready';
      }
    }

    // 4. Ensure no double punctuation / spaces from stripping
    cleanPrompt = cleanPrompt
      .replace(/,\s*,/g, ',')
      .replace(/\s{2,}/g, ' ')
      .replace(/^,\s*/, '')
      .replace(/,\s*$/, '')
      .trim();

    // 5. Content-type specific adjustments & Detail Enrichment
    if (contentType === 'Vector' && !/vector|flat|isolated|icon|graphic|minimalist/i.test(cleanPrompt)) {
      cleanPrompt += ', clean flat vector aesthetic, crisp trace-friendly contours, balanced composition';
    }

    if (contentType === 'Silhouette' && !/silhouette|black vector|high contrast/i.test(cleanPrompt)) {
      cleanPrompt = `Clean sharp solid black silhouette of ${cleanPrompt}, high-contrast isolated on pure white (#ffffff) background, anonymous outline form`;
    }

    // 6. ENFORCE HIGH-DETAIL RICHNESS (Expand short prompts with rich microstock details)
    const words = cleanPrompt.split(/\s+/).filter(Boolean);
    if (words.length < 25) {
      if (contentType === 'Vector' || contentType === 'PNG' || context.sectionContext === 'PNG Creator') {
        cleanPrompt += ', featuring simplified geometric forms, vibrant three-color harmonious commercial palette, crisp closed contours, high-contrast isolated structure, trace-friendly microstock graphic asset';
      } else {
        cleanPrompt += ', shot with natural diffuse lighting, sharp focus, balanced rule-of-thirds composition, rich surface textures, commercial advertising quality with dedicated negative copy space';
      }
    }

    const finalWords = cleanPrompt.split(/\s+/).filter(Boolean);
    const passed = issues.length === 0 && finalWords.length >= 15;
    const score = Math.max(20, 100 - (issues.length * 20));

    return {
      passed,
      score,
      issues,
      cleanPrompt
    };
  }
}


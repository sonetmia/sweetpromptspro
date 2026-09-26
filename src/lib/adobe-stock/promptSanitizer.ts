import { findIPRisks } from './ipRules';

export interface PromptScanResult {
  hasRisk: boolean;
  detectedCount: number;
  risks: Array<{
    term: string;
    rawMatch: string;
    category: string;
    level: 'HIGH' | 'MEDIUM';
    reason: string;
    safeAlternative: string;
  }>;
  sanitizedPrompt: string;
  commercialNegativeConstraints: string;
}

export function sanitizePromptInput(input: string): PromptScanResult {
  const risks = findIPRisks(input);
  let sanitized = input;

  // Replace each detected rawMatch with its safe generic alternative
  for (const risk of risks) {
    if (risk.rawMatch && risk.rawMatch.length > 1) {
      const regex = new RegExp(`\\b${escapeRegExp(risk.rawMatch)}\\b`, 'gi');
      sanitized = sanitized.replace(regex, risk.safeAlternative);
    }
  }

  // Standard Adobe Stock commercial negative requirements
  const commercialNegativeConstraints = 
    'no human faces, no recognizable face, no close-up portrait, no deformed facial features, no logos, no trademarks, no brand names, no copyrighted characters, no celebrity likeness, no readable text, no watermarks, no distorted anatomy, no extra digits, no visual artifacts';

  return {
    hasRisk: risks.length > 0,
    detectedCount: risks.length,
    risks,
    sanitizedPrompt: sanitized.trim(),
    commercialNegativeConstraints
  };
}

export function autoSanitizePrompt(input: string) {
  const scan = sanitizePromptInput(input);
  const buzzwords = [
    /\b(?:photorealistic|hyperrealistic|ultra realistic|8k|4k|masterpiece|trending on artstation|octane render|unreal engine 5?|award winning|best seller|top downloaded|guaranteed sales|100% safe|adobe approved)\b/gi
  ];
  let cleaned = scan.sanitizedPrompt;
  const replacedTerms: { original: string; replacement: string; reason: string }[] = scan.risks.map(r => ({
    original: r.rawMatch,
    replacement: r.safeAlternative,
    reason: r.reason
  }));

  for (const bw of buzzwords) {
    cleaned = cleaned.replace(bw, (match) => {
      replacedTerms.push({
        original: match,
        replacement: '',
        reason: 'Low-quality AI buzzword that triggers stock spam filters'
      });
      return '';
    });
  }

  // Clean up any stray human face requests
  cleaned = cleaned.replace(/\b(?:close[- ]?up (?:of )?(?:human )?face|detailed face|front view face|looking at camera face)\b/gi, 'faceless anonymous lifestyle composition, seen from behind');

  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();

  return {
    hasRisk: scan.hasRisk || replacedTerms.length > 0,
    sanitizedPrompt: cleaned,
    replacedTerms
  };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds standard Adobe Stock commercial prompt structure:
 * SUBJECT, ENVIRONMENT, COMPOSITION, VISUAL STYLE, LIGHTING, CAMERA/RENDERING, COLOR, COMMERCIAL INTENT, NEGATIVE REQUIREMENTS
 */
export function buildCommercialStockPrompt(params: {
  subject: string;
  environment?: string;
  composition?: string;
  lighting?: string;
  visualStyle?: string;
  copySpace?: string;
  aspectRatio?: string;
  contentType?: string;
  isIsolated?: boolean;
}): string {
  const parts: string[] = [];

  // Subject (ensure faceless / anonymous if humans)
  let sub = params.subject.trim();
  if (/\b(?:person|man|woman|worker|doctor|engineer|student|executive|people)\b/i.test(sub) && !/\b(?:faceless|from behind|silhouette|over-the-shoulder|crop|hands)\b/i.test(sub)) {
    sub = `${sub}, faceless anonymous composition seen from behind or over-the-shoulder`;
  }
  parts.push(sub);

  // Copy space / Negative space placement
  if (params.copySpace && params.copySpace !== 'None') {
    parts.push(`subject positioned with generous clean ${params.copySpace.toLowerCase()} negative space for commercial copy and advertising text`);
  }

  // Isolation (PNG/Isolated assets)
  if (params.isIsolated) {
    parts.push('isolated subject on pure white or clean transparent cutout background, crisp defined outer contours, zero extraneous artifacts');
  } else if (params.environment) {
    parts.push(`in ${params.environment}`);
  }

  // Composition
  if (params.composition) {
    parts.push(`composition: ${params.composition}`);
  }

  // Lighting
  if (params.lighting) {
    parts.push(`lighting: ${params.lighting}`);
  }

  // Visual Style
  if (params.visualStyle) {
    parts.push(`style: ${params.visualStyle}`);
  }

  // Strict negative compliance reminders
  parts.push('commercial stock quality, pristine edges, no human faces, no visible brand marks, no logos, no text, no watermarks');

  if (params.aspectRatio && params.aspectRatio !== '1:1') {
    parts.push(`--ar ${params.aspectRatio}`);
  }

  return parts.join(', ');
}

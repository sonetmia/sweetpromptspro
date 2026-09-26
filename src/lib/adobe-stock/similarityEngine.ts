/**
 * Adobe Stock Similarity & Anti-Spam Diversity Engine
 * Prevents mass submissions of near-identical or low-effort prompt variations.
 */

export interface SimilarityPair {
  indexA: number;
  indexB: number;
  score: number; // 0 to 100
  similarityType: 'Duplicate Subject' | 'Minor Wording Change' | 'Only Color/Background Shift' | 'Near-Identical Framing';
  suggestion: string;
}

export interface BatchDiversityResult {
  diversityScore: number; // 0 to 100
  rating: 'HIGH' | 'MEDIUM' | 'LOW';
  warningMessage?: string;
  flaggedPairs: SimilarityPair[];
  summary: string;
}

export function evaluateBatchDiversity(prompts: string[]): BatchDiversityResult {
  if (prompts.length <= 1) {
    return {
      diversityScore: 100,
      rating: 'HIGH',
      flaggedPairs: [],
      summary: 'Single concept. No batch similarity issues detected.'
    };
  }

  const flaggedPairs: SimilarityPair[] = [];
  let totalScore = 0;
  let comparisons = 0;

  for (let i = 0; i < prompts.length; i++) {
    for (let j = i + 1; j < prompts.length; j++) {
      const score = calculateJaccardSimilarity(prompts[i], prompts[j]);
      totalScore += score;
      comparisons++;

      if (score >= 60) {
        let similarityType: SimilarityPair['similarityType'] = 'Duplicate Subject';
        if (score >= 85) {
          similarityType = 'Minor Wording Change';
        } else if (hasColorOnlyDiff(prompts[i], prompts[j])) {
          similarityType = 'Only Color/Background Shift';
        } else if (score >= 70) {
          similarityType = 'Near-Identical Framing';
        }

        flaggedPairs.push({
          indexA: i + 1,
          indexB: j + 1,
          score,
          similarityType,
          suggestion: 'Modify the viewpoint, industry context, or core commercial use-case to ensure meaningful difference.'
        });
      }
    }
  }

  const avgSimilarity = comparisons > 0 ? totalScore / comparisons : 0;
  const diversityScore = Math.max(0, Math.round(100 - avgSimilarity));

  let rating: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  let warningMessage: string | undefined = undefined;

  if (diversityScore < 50 || flaggedPairs.length >= Math.ceil(prompts.length * 0.4)) {
    rating = 'LOW';
    warningMessage = 'High similarity detected across batch. Adobe Stock frequently rejects accounts submitting repetitive or spam-like asset variations. Please curate or introduce different industries/settings.';
  } else if (diversityScore < 75 || flaggedPairs.length > 0) {
    rating = 'MEDIUM';
    warningMessage = 'Some concepts share strong visual and conceptual overlap. Review flagged items before final submission.';
  }

  return {
    diversityScore,
    rating,
    warningMessage,
    flaggedPairs,
    summary: `Batch Concept Diversity is ${rating} (${diversityScore}/100). ${flaggedPairs.length} potential similarity overlap(s) flagged.`
  };
}

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

function calculateJaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return Math.round((intersection / union) * 100);
}

function hasColorOnlyDiff(a: string, b: string): boolean {
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'black', 'white', 'orange', 'pink', 'teal'];
  const strippedA = a.toLowerCase().replace(new RegExp(`\\b(${colors.join('|')})\\b`, 'g'), '');
  const strippedB = b.toLowerCase().replace(new RegExp(`\\b(${colors.join('|')})\\b`, 'g'), '');
  return calculateJaccardSimilarity(strippedA, strippedB) >= 80;
}

const STOP_WORDS = new Set([
  'the', 'and', 'with', 'for', 'a', 'an', 'in', 'on', 'at', 'by', 'from',
  'of', 'to', 'is', 'are', 'clean', 'professional', 'commercial', 'stock',
  'modern', 'high', 'quality', 'photo', 'style', 'lighting'
]);

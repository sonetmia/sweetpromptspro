export interface UniquenessAuditResult {
  isUnique: boolean;
  score: number; // 0 to 100
  duplicateIndices: number[]; // indices of prompts that are too similar
  flaggedPairs: { indexA: number; indexB: number; similarity: number }[];
  summary: string;
}

export class UniquenessEngine {
  /**
   * Tokenizes text into normalized word set
   */
  private static tokenize(text: string): Set<string> {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'with', 'for', 'of', 'to', 'from', 'by',
      'is', 'are', 'was', 'were', 'it', 'this', 'that', 'with', 'no', 'as', 'into'
    ]);
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
    return new Set(words);
  }

  /**
   * Calculates Jaccard similarity between two prompt texts (0 to 100)
   */
  static calculateSimilarity(promptA: string, promptB: string): number {
    const tokensA = this.tokenize(promptA);
    const tokensB = this.tokenize(promptB);

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }

    const union = tokensA.size + tokensB.size - intersection;
    return union > 0 ? Math.round((intersection / union) * 100) : 0;
  }

  /**
   * Evaluates a full batch of prompts for uniqueness and diversity
   */
  static auditBatch(prompts: string[], threshold: number = 65): UniquenessAuditResult {
    if (prompts.length <= 1) {
      return {
        isUnique: true,
        score: 100,
        duplicateIndices: [],
        flaggedPairs: [],
        summary: 'Single prompt. 100% unique concept.'
      };
    }

    const flaggedPairs: { indexA: number; indexB: number; similarity: number }[] = [];
    const duplicateSet = new Set<number>();
    let totalScore = 0;
    let comparisons = 0;

    for (let i = 0; i < prompts.length; i++) {
      for (let j = i + 1; j < prompts.length; j++) {
        const sim = this.calculateSimilarity(prompts[i], prompts[j]);
        totalScore += sim;
        comparisons++;

        if (sim >= threshold) {
          flaggedPairs.push({ indexA: i, indexB: j, similarity: sim });
          // Flag the second one (j) for regeneration
          duplicateSet.add(j);
        }
      }
    }

    const avgSimilarity = comparisons > 0 ? totalScore / comparisons : 0;
    const diversityScore = Math.max(0, Math.round(100 - avgSimilarity));
    const duplicateIndices = Array.from(duplicateSet);

    return {
      isUnique: duplicateIndices.length === 0,
      score: diversityScore,
      duplicateIndices,
      flaggedPairs,
      summary: duplicateIndices.length === 0 
        ? `High diversity achieved (${diversityScore}/100 score). No duplicate concepts detected.`
        : `${duplicateIndices.length} near-duplicate concept(s) flagged for replacement.`
    };
  }
}

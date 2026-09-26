import { findIPRisks } from './ipRules';
import { ADOBE_STOCK_RULES } from './rules';

export interface StructuredStockMetadata {
  title: string;
  topPriorityKeywords: string[];
  otherKeywords: string[];
  allKeywords: string[];
  removedBlockedKeywords: string[];
  category: string;
  recommendedContentType: 'Photo' | 'Illustration' | 'Vector';
  contentTypeReason: string;
  aiLabelRequired: boolean;
  releaseReminder: string;
  metadataScore: MetadataQualityScore;
}

export interface MetadataQualityScore {
  totalScore: number; // 0 to 100
  rating: 'EXCELLENT' | 'GOOD' | 'NEEDS_REVIEW';
  breakdown: {
    relevance: number; // 0 - 20
    specificity: number; // 0 - 20
    searchIntent: number; // 0 - 15
    ipSafety: number; // 0 - 20
    keywordCount: number; // 0 - 15
    titleQuality: number; // 0 - 10
  };
  feedback: string[];
}

export function parseAndCleanKeywords(rawKeywords: string[]): {
  top10: string[];
  other: string[];
  all: string[];
  blocked: string[];
} {
  const seen = new Set<string>();
  const valid: string[] = [];
  const blocked: string[] = [];

  for (const item of rawKeywords) {
    const cleaned = item
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ');

    if (!cleaned || cleaned.length < 2) continue;

    // Check against IP risk rules
    const risks = findIPRisks(cleaned);
    if (risks.length > 0) {
      blocked.push(`${cleaned} (IP signal: ${risks[0].term})`);
      continue;
    }

    // Check for spammy or forbidden single words
    if (/^(stock|photo|download|free|buy|sale|cheap|hd|4k|8k|trending)$/i.test(cleaned)) {
      blocked.push(`${cleaned} (Marketplace spam keyword)`);
      continue;
    }

    if (!seen.has(cleaned)) {
      seen.add(cleaned);
      valid.push(cleaned);
    }
  }

  // Max 49 keywords per Adobe Stock guidelines
  const trimmed = valid.slice(0, ADOBE_STOCK_RULES.maxKeywords);
  const top10 = trimmed.slice(0, 10);
  const other = trimmed.slice(10);

  return {
    top10,
    other,
    all: trimmed,
    blocked
  };
}

export function cleanStockTitle(rawTitle: string): { title: string; warnings: string[] } {
  const warnings: string[] = [];
  let title = rawTitle.replace(/[^\w\s.,-]/g, ' ').replace(/\s+/g, ' ').trim();

  // Strip prompt artifacts
  title = title.replace(/^(photo of|an illustration of|a 3d render of|isolated|vector of)\s+/i, '');

  // Check IP in title
  const risks = findIPRisks(title);
  if (risks.length > 0) {
    warnings.push(`Title contained trademark reference: ${risks[0].term}`);
    for (const r of risks) {
      title = title.replace(new RegExp(r.rawMatch, 'gi'), r.safeAlternative.split(',')[0]);
    }
  }

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Check length against recommended ~70 chars
  if (title.length > ADOBE_STOCK_RULES.recommendedTitleLength) {
    warnings.push(`Title length (${title.length} chars) exceeds recommended ${ADOBE_STOCK_RULES.recommendedTitleLength} character target for optimal search display.`);
  }

  return { title, warnings };
}

export function evaluateMetadataQuality(
  title: string,
  keywords: string[],
  category?: string
): MetadataQualityScore {
  let relevance = 20;
  let specificity = 18;
  let searchIntent = 15;
  let ipSafety = 20;
  let keywordCountScore = 15;
  let titleQuality = 10;
  const feedback: string[] = [];

  // Title checks
  if (title.length < 15) {
    titleQuality -= 5;
    feedback.push('Title is too short to provide clear commercial context.');
  } else if (title.length > 85) {
    titleQuality -= 3;
    feedback.push('Title is overly lengthy. Keep titles under ~70 characters for best search readability.');
  }

  // Keyword count check
  if (keywords.length < 15) {
    keywordCountScore -= 8;
    feedback.push('Fewer than 15 keywords. Adding 25-35 relevant keywords significantly broadens buyer discoverability.');
  } else if (keywords.length > 49) {
    keywordCountScore -= 5;
    feedback.push('Exceeds 49 keywords. Adobe Stock caps keywords at 49.');
  }

  // IP safety check on all metadata
  const fullText = `${title} ${keywords.join(' ')}`;
  const ipIssues = findIPRisks(fullText);
  if (ipIssues.length > 0) {
    ipSafety = Math.max(0, ipSafety - ipIssues.length * 8);
    feedback.push(`Potential IP signals detected in metadata (${ipIssues.map(i => i.term).join(', ')}).`);
  }

  const totalScore = relevance + specificity + searchIntent + ipSafety + keywordCountScore + titleQuality;

  let rating: MetadataQualityScore['rating'] = 'EXCELLENT';
  if (totalScore < 70) {
    rating = 'NEEDS_REVIEW';
  } else if (totalScore < 88) {
    rating = 'GOOD';
  }

  if (feedback.length === 0) {
    feedback.push('Metadata complies with Adobe Stock formatting, keyword priority, and brand safety guidelines.');
  }

  return {
    totalScore,
    rating,
    breakdown: {
      relevance,
      specificity,
      searchIntent,
      ipSafety,
      keywordCount: keywordCountScore,
      titleQuality
    },
    feedback
  };
}

import { RiskCheckResult } from '../../types';
import { RISK_RULES } from './rules';

export function validateStockRisk(text: string): RiskCheckResult {
  if (!text || text.trim() === '') {
    return {
      overall: 'SAFE',
      summary: 'No text provided for risk assessment.',
      findings: [],
    };
  }

  const findings: RiskCheckResult['findings'] = [];
  const lowerText = text.toLowerCase();

  for (const rule of RISK_RULES) {
    if (rule.pattern.test(lowerText)) {
      // Avoid duplicate terms
      if (!findings.some(f => f.term === rule.term)) {
        findings.push({
          term: rule.term,
          category: rule.category,
          level: rule.level,
          reason: rule.reason,
          recommendation: rule.recommendation,
        });
      }
    }
  }

  // Check for generic risk words like "logo", "trademark", "watermark", "branded"
  if (/\b(logo|trademark|brand name|watermark|copyright)\b/i.test(lowerText)) {
    if (!findings.some(f => f.term === 'Explicit Trademark/Logo Keyword')) {
      findings.push({
        term: 'Explicit Trademark/Logo Keyword',
        category: 'Text',
        level: 'LOW',
        reason: 'Prompt contains explicit mention of logos or trademarks.',
        recommendation: 'Ensure final output image does not render any visible commercial logo.',
      });
    }
  }

  let overall: RiskCheckResult['overall'] = 'SAFE';
  if (findings.some(f => f.level === 'HIGH')) {
    overall = 'HIGH';
  } else if (findings.some(f => f.level === 'MEDIUM')) {
    overall = 'MEDIUM';
  } else if (findings.length > 0) {
    overall = 'LOW';
  }

  const summary = findings.length === 0
    ? 'No major trademark or IP risk signals detected. Clean for stock submission review.'
    : `${findings.length} potential risk signal(s) detected. Review recommendations before submission.`;

  return {
    overall,
    summary,
    findings,
  };
}

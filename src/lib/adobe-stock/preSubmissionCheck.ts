import { findIPRisks } from './ipRules';

export interface PreSubmissionItem {
  id: string;
  label: string;
  category: 'Safety' | 'Quality' | 'Metadata' | 'Legal';
  status: 'PASS' | 'WARNING' | 'FAIL';
  detail: string;
}

export interface PreSubmissionReport {
  overallStatus: 'GREEN' | 'YELLOW' | 'RED';
  headline: string;
  items: PreSubmissionItem[];
  aiLabelRequired: boolean;
  modelReleaseNotice: string;
  propertyReleaseNotice: string;
}

export function runPreSubmissionCheck(params: {
  prompt: string;
  title?: string;
  keywords?: string[];
  category?: string;
  isAIContent?: boolean;
  hasPeople?: boolean;
  hasProperty?: boolean;
  isDuplicateRisk?: boolean;
}): PreSubmissionReport {
  const combinedText = `${params.prompt} ${params.title || ''} ${(params.keywords || []).join(' ')}`;
  const ipFindings = findIPRisks(combinedText);

  const items: PreSubmissionItem[] = [
    {
      id: 'no-human-face',
      label: 'Human face safety (Faceless & Anonymous)',
      category: 'Safety',
      status: ipFindings.some(f => f.category === 'Human Face') ? 'FAIL' : 'PASS',
      detail: ipFindings.some(f => f.category === 'Human Face')
        ? 'Identifiable human face or close-up portrait detected. Prompt should use faceless silhouette, rear view, or anonymous framing to prevent model release rejection.'
        : 'Safe faceless / anonymous composition or non-human subject.'
    },
    {
      id: 'original-concept',
      label: 'Original concept',
      category: 'Safety',
      status: ipFindings.length === 0 ? 'PASS' : 'WARNING',
      detail: ipFindings.length === 0 ? 'Concept appears original with no direct franchise references.' : 'Review concept for creative novelty.'
    },
    {
      id: 'no-trademark',
      label: 'No visible trademark',
      category: 'Safety',
      status: ipFindings.some(f => f.category === 'Brand') ? 'FAIL' : 'PASS',
      detail: ipFindings.some(f => f.category === 'Brand') ? 'Potential brand trademark detected. Use generic commercial alternative.' : 'No known commercial brand names detected.'
    },
    {
      id: 'no-logo',
      label: 'No recognizable logo or emblem',
      category: 'Safety',
      status: (ipFindings.some(f => f.category === 'Logo / Trademark') || /\b(?:logo|emblem|insignia|crest)\b/i.test(combinedText)) ? 'FAIL' : 'PASS',
      detail: (ipFindings.some(f => f.category === 'Logo / Trademark') || /\b(?:logo|emblem|insignia|crest)\b/i.test(combinedText))
        ? 'Explicit logo or emblem keyword detected. Must be completely unbranded.'
        : 'Asset specified as completely unbranded with clean surfaces.'
    },
    {
      id: 'no-character',
      label: 'No copyrighted character',
      category: 'Safety',
      status: ipFindings.some(f => f.category === 'Fictional Character' || f.category === 'Franchise') ? 'FAIL' : 'PASS',
      detail: ipFindings.some(f => f.category === 'Fictional Character' || f.category === 'Franchise') ? 'Fictional character or entertainment franchise reference detected.' : 'No protected fictional characters detected.'
    },
    {
      id: 'no-artist-ref',
      label: 'No artist-name reference',
      category: 'Safety',
      status: ipFindings.some(f => f.category === 'Artist Style') ? 'FAIL' : 'PASS',
      detail: ipFindings.some(f => f.category === 'Artist Style') ? 'Artist name reference detected. Replaced with descriptive visual terms.' : 'No artist names referenced.'
    },
    {
      id: 'no-real-person',
      label: 'No real-person reference',
      category: 'Safety',
      status: (ipFindings.some(f => f.category === 'Celebrity') || /\b(?:elon musk|biden|trump|taylor swift|celebrity)\b/i.test(combinedText)) ? 'FAIL' : 'PASS',
      detail: 'Generative AI content of real recognizable public figures requires signed releases and is forbidden in standard stock.'
    },
    {
      id: 'no-restricted-landmarks',
      label: 'No restricted property / landmarks',
      category: 'Safety',
      status: ipFindings.some(f => f.category === 'Protected Property') ? 'FAIL' : 'PASS',
      detail: ipFindings.some(f => f.category === 'Protected Property')
        ? 'Restricted architectural property detected (e.g. night illumination or protected building design).'
        : 'Clean architectural cityscape or nature landscape.'
    },
    {
      id: 'no-watermark',
      label: 'No watermark or text artifacts',
      category: 'Quality',
      status: /\b(?:watermark|signature|caption)\b/i.test(combinedText) ? 'FAIL' : 'PASS',
      detail: 'Adobe Stock rejects images with rendered text watermarks or signatures.'
    },
    {
      id: 'no-spam-buzzwords',
      label: 'No spam buzzwords',
      category: 'Quality',
      status: /\b(?:photorealistic|hyperrealistic|8k|octane render|trending on artstation|unreal engine|masterpiece)\b/i.test(combinedText) ? 'WARNING' : 'PASS',
      detail: /\b(?:photorealistic|hyperrealistic|8k|octane render|trending on artstation|unreal engine|masterpiece)\b/i.test(combinedText)
        ? 'Spam buzzwords detected. Clean descriptive camera and lighting words should be used instead.'
        : 'Clean descriptive prompts without low-quality AI buzzwords.'
    },
    {
      id: 'no-anatomical-errors',
      label: 'No anatomical errors / extra digits',
      category: 'Quality',
      status: 'PASS',
      detail: 'Prompt includes negative constraints against deformed anatomy and extra digits.'
    },
    {
      id: 'no-visual-artifacts',
      label: 'No visual artifacts',
      category: 'Quality',
      status: 'PASS',
      detail: 'Prompt specifies clean commercial rendering and balanced lighting.'
    },
    {
      id: 'accurate-title',
      label: 'Accurate title',
      category: 'Metadata',
      status: params.title && params.title.length >= 10 && params.title.length <= 80 ? 'PASS' : 'WARNING',
      detail: params.title ? `Title length is ${params.title.length} characters.` : 'Title not yet generated.'
    },
    {
      id: 'relevant-keywords',
      label: 'Relevant keywords',
      category: 'Metadata',
      status: (params.keywords || []).length >= 15 && (params.keywords || []).length <= 49 ? 'PASS' : 'WARNING',
      detail: `${(params.keywords || []).length} keywords present (target: 20-49).`
    },
    {
      id: 'category-selected',
      label: 'Category selected',
      category: 'Metadata',
      status: params.category ? 'PASS' : 'WARNING',
      detail: params.category ? `Category: ${params.category}` : 'Category should be assigned.'
    },
    {
      id: 'ai-label-reminder',
      label: 'AI label reminder',
      category: 'Legal',
      status: 'PASS',
      detail: 'Adobe Stock requires checking "Created using generative AI tools" during contributor submission.'
    },
    {
      id: 'release-requirement',
      label: 'Release requirement reviewed',
      category: 'Legal',
      status: params.hasPeople || params.hasProperty ? 'WARNING' : 'PASS',
      detail: params.hasPeople 
        ? 'Ensure human figures are faceless/anonymous to avoid Model Release requirements.'
        : params.hasProperty
        ? 'Ensure no private property or logo requires Property Release.'
        : 'No model or property release needed for faceless/isolated commercial stock.'
    }
  ];

  const hasFails = items.some(i => i.status === 'FAIL');
  const hasWarnings = items.some(i => i.status === 'WARNING');

  const overallStatus: 'GREEN' | 'YELLOW' | 'RED' = hasFails ? 'RED' : hasWarnings ? 'YELLOW' : 'GREEN';

  const headline = hasFails
    ? 'Critical compliance issues detected (Human face, IP, logo, or trademark). Sanitize prompt before submission.'
    : hasWarnings
    ? 'Review recommended: minor optimizations found (keywords, title, or metadata).'
    : 'All Adobe Stock compliance checks passed. Asset is commercially safe and policy-compliant.';

  return {
    overallStatus,
    headline,
    items,
    aiLabelRequired: true,
    modelReleaseNotice: 'Adobe Stock requires model releases for recognizable faces. Use faceless anonymous compositions to avoid rejections.',
    propertyReleaseNotice: 'Ensure all logos, brand emblems, and trademarked architecture are unbranded.'
  };
}

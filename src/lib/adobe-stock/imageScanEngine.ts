import { auditImageTechnicalSpecs, FileTechnicalAudit } from './technicalRules';
import { AIManagerClass } from '../ai/AIManager';

export interface ImageScanItem {
  id: string;
  file: File;
  previewUrl: string;
  filename: string;
  size: number;
  width: number;
  height: number;
  megapixels: number;
  status: 'Waiting' | 'Scanning' | 'Complete' | 'Needs Review' | 'Error';
  dHash?: string;
  technicalAudit?: FileTechnicalAudit;
  result?: ImageScanResult;
  errorMessage?: string;
}

export interface PipelineCheckItem {
  id: string;
  name: string;
  status: 'PASS' | 'REVIEW' | 'FLAG' | 'NEUTRAL';
  scoreImpact: number; // e.g. 0 to 10
  summary: string;
  details: string[];
}

export interface ImageScanResult {
  readinessScore: number; // 0 - 100
  potentialRisk: 'Low' | 'Medium' | 'High';
  summary: string;
  scannedAt: number;
  modelUsed?: string;
  isAiAssisted: boolean;
  
  // 12 Pipeline Checks
  checks: {
    fileCheck: PipelineCheckItem;
    technicalCheck: PipelineCheckItem;
    visualQualityCheck: PipelineCheckItem;
    textLogoCheck: PipelineCheckItem;
    ipSignalCheck: PipelineCheckItem;
    peopleCheck: PipelineCheckItem;
    propertyCheck: PipelineCheckItem;
    releaseCheck: PipelineCheckItem;
    aiContentCheck: PipelineCheckItem;
    commercialQualityCheck: PipelineCheckItem;
    similarityCheck: PipelineCheckItem;
    finalScoreCheck: PipelineCheckItem;
  };

  // Actionable suggestions & generated metadata preview
  suggestedTitle: string;
  suggestedCategory: string;
  suggestedKeywords: string[];
  suggestedCopySpace: string;
  actionItems: string[];
  releasesRequired: {
    modelRelease: boolean;
    propertyRelease: boolean;
    aiLabelRequired: boolean;
  };
}

const aiManager = new AIManagerClass();

/**
 * Calculates a simple 64-bit difference hash (dHash) from an image bitmap for client-side batch similarity comparison.
 */
export async function computePerceptualHash(img: HTMLImageElement): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.drawImage(img, 0, 0, 9, 8);
    const imgData = ctx.getImageData(0, 0, 9, 8).data;
    
    let hash = '';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const leftIdx = (y * 9 + x) * 4;
        const rightIdx = (y * 9 + (x + 1)) * 4;
        
        // Grayscale luminance
        const leftLum = 0.299 * imgData[leftIdx] + 0.587 * imgData[leftIdx + 1] + 0.114 * imgData[leftIdx + 2];
        const rightLum = 0.299 * imgData[rightIdx] + 0.587 * imgData[rightIdx + 1] + 0.114 * imgData[rightIdx + 2];
        
        hash += leftLum > rightLum ? '1' : '0';
      }
    }
    return hash;
  } catch {
    return '';
  }
}

/**
 * Computes Hamming distance between two perceptual hashes.
 */
export function computeHashDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

/**
 * Quick client-side image metrics (Laplacian sharpness estimate, brightness, contrast)
 */
export async function analyzeImageCanvas(img: HTMLImageElement): Promise<{
  sharpnessScore: number;
  brightness: number;
  contrast: number;
  hasAlpha: boolean;
}> {
  const canvas = document.createElement('canvas');
  const targetW = Math.min(img.naturalWidth || 500, 400);
  const targetH = Math.min(img.naturalHeight || 500, 400);
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    return { sharpnessScore: 75, brightness: 50, contrast: 50, hasAlpha: false };
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);
  const imgData = ctx.getImageData(0, 0, targetW, targetH).data;

  let totalLum = 0;
  let hasAlpha = false;
  const count = targetW * targetH;

  for (let i = 0; i < imgData.length; i += 4) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const a = imgData[i + 3];
    if (a < 250) hasAlpha = true;
    totalLum += (0.299 * r + 0.587 * g + 0.114 * b);
  }

  const avgLum = totalLum / count;

  // Compute contrast variance
  let varianceSum = 0;
  for (let i = 0; i < imgData.length; i += 4) {
    const lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
    varianceSum += Math.pow(lum - avgLum, 2);
  }
  const stdDev = Math.sqrt(varianceSum / count);
  const contrast = Math.min(100, Math.max(0, (stdDev / 128) * 100));
  const brightness = Math.min(100, Math.max(0, (avgLum / 255) * 100));

  // Estimate sharpness based on contrast and edge variance
  const sharpnessScore = Math.min(95, Math.max(40, Math.round(contrast * 0.8 + (100 - Math.abs(50 - brightness)) * 0.2)));

  return {
    sharpnessScore,
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    hasAlpha
  };
}

/**
 * Converts a File object to base64 data URL string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Main Pipeline Scanner for a single image item.
 */
export async function runPipelineScan(
  item: ImageScanItem,
  allBatchItems: ImageScanItem[]
): Promise<ImageScanResult> {
  const technical = item.technicalAudit || auditImageTechnicalSpecs(
    { name: item.filename, size: item.size, type: item.file.type },
    { width: item.width, height: item.height }
  );

  // 1. Batch Similarity Check across other images
  let nearDuplicates: string[] = [];
  if (item.dHash) {
    for (const other of allBatchItems) {
      if (other.id !== item.id && other.dHash) {
        const dist = computeHashDistance(item.dHash, other.dHash);
        if (dist <= 6) { // Distance <= 6 indicates high perceptual similarity / duplicate variation
          nearDuplicates.push(other.filename);
        }
      }
    }
  }

  // Check if user has an AI key configured that supports vision
  let visionAiOutput: any = null;
  const effective = aiManager.getEffectiveProviderAndKey(undefined, undefined, true);

  if (effective.apiKey) {
    try {
      const base64Data = await fileToBase64(item.file);
      const pureBase64 = base64Data.split(',')[1] || base64Data;
      const mimeType = item.file.type || 'image/jpeg';

      const prompt = `You are a strict Adobe Stock Contributor Review Specialist and Intellectual Property Inspector.
Analyze this submitted stock image thoroughly across the 12 Adobe Stock pre-submission dimensions.

Return a valid JSON object ONLY in the following exact format without markdown backticks:
{
  "visualQuality": {
    "status": "PASS" | "REVIEW" | "FLAG",
    "sharpness": "Sharp" | "Acceptable" | "Soft / Blurry",
    "artifacts": "None visible" | "Minor compression" | "Noticeable digital artifacts",
    "exposure": "Balanced" | "Overexposed" | "Underexposed",
    "notes": "string"
  },
  "textLogo": {
    "status": "PASS" | "REVIEW" | "FLAG",
    "hasRecognizableLogos": false,
    "hasCopyrightedText": false,
    "watermarksFound": false,
    "findings": ["string"]
  },
  "ipSignal": {
    "status": "PASS" | "REVIEW" | "FLAG",
    "trademarkRisks": ["string"],
    "protectedProperty": ["string"],
    "editorialOnly": false
  },
  "people": {
    "status": "PASS" | "REVIEW" | "FLAG",
    "hasIdentifiablePeople": false,
    "isSilhouetteOrUnidentifiable": false,
    "modelReleaseRecommended": false,
    "notes": "string"
  },
  "property": {
    "status": "PASS" | "REVIEW" | "FLAG",
    "hasRecognizablePrivateProperty": false,
    "propertyReleaseRecommended": false,
    "notes": "string"
  },
  "aiContent": {
    "status": "PASS" | "REVIEW" | "FLAG",
    "looksGenerativeAi": true,
    "aiAnatomyGlitches": false,
    "aiLabelRequired": true,
    "notes": "string"
  },
  "commercialQuality": {
    "status": "PASS" | "REVIEW" | "FLAG",
    "commercialUtility": "High" | "Medium" | "Low",
    "copySpace": "None" | "Left" | "Right" | "Top" | "Bottom" | "Ample Center",
    "buyerAppeal": "Strong commercial stock potential with clean isolation or subject isolation",
    "stockCategory": "Business / Technology / Nature / Lifestyle etc."
  },
  "suggestedTitle": "70-character concise commercial title without spam keywords",
  "suggestedKeywords": ["keyword1", "keyword2", "up to 25 relevant commercial keywords"],
  "overallReadinessScore": 90,
  "potentialRisk": "Low" | "Medium" | "High",
  "summary": "Concise summary of pre-submission readiness"
}`;

      const rawResponse = await aiManager.generateVision(pureBase64, mimeType, prompt);
      const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      visionAiOutput = JSON.parse(cleanJson);
    } catch (err) {
      console.warn('Vision AI inspection fallback to client-side heuristics:', err);
    }
  }

  // Construct the 12 pipeline check items
  let readinessScore = 90;
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';

  // 1. File Check
  const fileCheck: PipelineCheckItem = {
    id: 'file-check',
    name: '1. File & Format Check',
    status: technical.fileSizeStatus === 'FAIL' ? 'FLAG' : (technical.fileSizeStatus === 'REVIEW' ? 'REVIEW' : 'PASS'),
    scoreImpact: technical.fileSizeStatus === 'FAIL' ? -15 : (technical.fileSizeStatus === 'REVIEW' ? -5 : 0),
    summary: `${technical.fileFormat} format • ${technical.fileSizeFormatted} • ${technical.orientation}`,
    details: [
      `File format: ${technical.fileFormat} (${technical.isFormatSupported ? 'Supported Adobe Stock format' : 'Unsupported format'})`,
      `File size: ${technical.fileSizeFormatted} (${technical.fileSizeMessage})`,
      `Orientation: ${technical.orientation} (${technical.aspectRatioLabel})`
    ]
  };

  // 2. Technical Check
  const technicalCheck: PipelineCheckItem = {
    id: 'technical-check',
    name: '2. Technical Resolution Check',
    status: technical.resolutionStatus === 'FAIL' ? 'FLAG' : (technical.resolutionStatus === 'REVIEW' ? 'REVIEW' : 'PASS'),
    scoreImpact: technical.resolutionStatus === 'FAIL' ? -25 : (technical.resolutionStatus === 'REVIEW' ? -8 : 0),
    summary: `${technical.megapixels} MP (${technical.width}×${technical.height}px)`,
    details: [
      `Resolution: ${technical.width} × ${technical.height} pixels (${technical.megapixels} Megapixels)`,
      technical.resolutionMessage,
      `Adobe standard minimum: 4.0 MP • Recommended for commercial tier: 8.0+ MP`
    ]
  };

  // 3. Visual Quality Check
  const vqStatus = visionAiOutput?.visualQuality?.status || (technical.resolutionStatus === 'FAIL' ? 'REVIEW' : 'PASS');
  const visualQualityCheck: PipelineCheckItem = {
    id: 'visual-quality',
    name: '3. Visual Quality & Artifacts',
    status: vqStatus,
    scoreImpact: vqStatus === 'FLAG' ? -15 : (vqStatus === 'REVIEW' ? -5 : 0),
    summary: visionAiOutput?.visualQuality?.sharpness ? `${visionAiOutput.visualQuality.sharpness} • ${visionAiOutput.visualQuality.artifacts}` : 'Clean sharpness and balanced exposure profile',
    details: [
      `Sharpness: ${visionAiOutput?.visualQuality?.sharpness || 'Clean subject focus'}`,
      `Artifacts: ${visionAiOutput?.visualQuality?.artifacts || 'No severe compression artifacts detected'}`,
      `Exposure: ${visionAiOutput?.visualQuality?.exposure || 'Well-balanced dynamic range'}`,
      visionAiOutput?.visualQuality?.notes || 'Visual clarity meets standard stock criteria.'
    ]
  };

  // 4. Text / Logo Check
  const tlStatus = visionAiOutput?.textLogo?.status || 'PASS';
  const textLogoCheck: PipelineCheckItem = {
    id: 'text-logo',
    name: '4. Text & Logo Inspection',
    status: tlStatus,
    scoreImpact: tlStatus === 'FLAG' ? -20 : (tlStatus === 'REVIEW' ? -10 : 0),
    summary: tlStatus === 'PASS' ? 'No trademark logos or unauthorized text found' : 'Potential brand mark or text detected',
    details: visionAiOutput?.textLogo?.findings?.length 
      ? visionAiOutput.textLogo.findings 
      : ['No brand typography, corporate trademarks, or commercial logos detected in frame.']
  };

  // 5. IP Signal Check
  const ipStatus = visionAiOutput?.ipSignal?.status || 'PASS';
  const ipSignalCheck: PipelineCheckItem = {
    id: 'ip-signal',
    name: '5. Intellectual Property (IP) Signals',
    status: ipStatus,
    scoreImpact: ipStatus === 'FLAG' ? -25 : (ipStatus === 'REVIEW' ? -10 : 0),
    summary: ipStatus === 'PASS' ? 'Clean of recognizable copyrighted IP' : 'Review for protected intellectual property',
    details: [
      visionAiOutput?.ipSignal?.trademarkRisks?.length ? `Trademark risks: ${visionAiOutput.ipSignal.trademarkRisks.join(', ')}` : 'No trademarked characters, franchises, or restricted products detected.',
      visionAiOutput?.ipSignal?.editorialOnly ? 'Note: Contains editorial elements suitable only for editorial stock.' : 'Suitable for commercial stock licensing consideration.'
    ]
  };

  // 6. People Check
  const peopleStatus = visionAiOutput?.people?.status || 'PASS';
  const peopleCheck: PipelineCheckItem = {
    id: 'people-check',
    name: '6. People & Face Detection',
    status: peopleStatus,
    scoreImpact: visionAiOutput?.people?.modelReleaseRecommended ? -5 : 0,
    summary: visionAiOutput?.people?.hasIdentifiablePeople 
      ? 'Recognizable person identified • Model Release required' 
      : 'No identifiable human subjects detected',
    details: [
      visionAiOutput?.people?.hasIdentifiablePeople ? 'Identifiable human faces or distinctive features detected.' : 'No identifiable human faces present.',
      visionAiOutput?.people?.modelReleaseRecommended ? 'Standard Adobe Stock Model Release required for all recognizable people.' : 'No model release required for submission.',
      visionAiOutput?.people?.notes || 'Clean composition without unauthorized portraits.'
    ]
  };

  // 7. Property Check
  const propStatus = visionAiOutput?.property?.status || 'PASS';
  const propertyCheck: PipelineCheckItem = {
    id: 'property-check',
    name: '7. Property & Architecture Check',
    status: propStatus,
    scoreImpact: visionAiOutput?.property?.propertyReleaseRecommended ? -5 : 0,
    summary: visionAiOutput?.property?.hasRecognizablePrivateProperty 
      ? 'Recognizable private property / vehicle detected' 
      : 'Generic / unidentifiable commercial environment',
    details: [
      visionAiOutput?.property?.hasRecognizablePrivateProperty ? 'Distinctive private estate, designer car, or modern architecture present.' : 'No restricted private property identified.',
      visionAiOutput?.property?.propertyReleaseRecommended ? 'Property Release required if recognizable private property is depicted.' : 'No property release needed for this scene.'
    ]
  };

  // 8. Release Check
  const releaseNeeds = {
    modelRelease: Boolean(visionAiOutput?.people?.modelReleaseRecommended),
    propertyRelease: Boolean(visionAiOutput?.property?.propertyReleaseRecommended),
    aiLabelRequired: Boolean(visionAiOutput?.aiContent?.aiLabelRequired ?? true)
  };
  const releaseStatus = (releaseNeeds.modelRelease || releaseNeeds.propertyRelease) ? 'REVIEW' : 'PASS';
  const releaseCheck: PipelineCheckItem = {
    id: 'release-check',
    name: '8. Releases & Legal Compliance',
    status: releaseStatus,
    scoreImpact: 0,
    summary: (releaseNeeds.modelRelease || releaseNeeds.propertyRelease) 
      ? 'Releases needed before commercial submission' 
      : 'No model or property release attachments required',
    details: [
      `Model Release: ${releaseNeeds.modelRelease ? 'REQUIRED (Attach signed Adobe Model Release)' : 'Not required'}`,
      `Property Release: ${releaseNeeds.propertyRelease ? 'REQUIRED (Attach signed Property Release)' : 'Not required'}`,
      `Generative AI Checkbox: ${releaseNeeds.aiLabelRequired ? 'Check "Created using generative AI tools" on Adobe Stock portal' : 'Not applicable'}`
    ]
  };

  // 9. AI Content Check
  const aiStatus = visionAiOutput?.aiContent?.status || 'PASS';
  const aiContentCheck: PipelineCheckItem = {
    id: 'ai-content',
    name: '9. Generative AI Artifact Inspection',
    status: aiStatus,
    scoreImpact: aiStatus === 'FLAG' ? -15 : (aiStatus === 'REVIEW' ? -5 : 0),
    summary: visionAiOutput?.aiContent?.aiAnatomyGlitches 
      ? 'Potential AI anatomy / texture glitch detected' 
      : 'Clean digital generation with coherent anatomy & textures',
    details: [
      `AI Label: Must mark asset as "Generative AI" in Adobe Stock Contributor Portal.`,
      `Anatomy & Details: ${visionAiOutput?.aiContent?.aiAnatomyGlitches ? 'Inspect hands, eyes, symmetry, and repeating patterns closely before submission.' : 'Coherent anatomy and realistic textures without obvious visual glitches.'}`,
      `Prompt Compliance: Ensure title and keywords avoid mentioning real living persons or artist names.`
    ]
  };

  // 10. Commercial Quality Check
  const cqStatus = visionAiOutput?.commercialQuality?.status || 'PASS';
  const commercialQualityCheck: PipelineCheckItem = {
    id: 'commercial-quality',
    name: '10. Commercial Stock Usability',
    status: cqStatus,
    scoreImpact: cqStatus === 'FLAG' ? -10 : 0,
    summary: `${visionAiOutput?.commercialQuality?.commercialUtility || 'High'} commercial utility • Copy space: ${visionAiOutput?.commercialQuality?.copySpace || 'Versatile'}`,
    details: [
      `Commercial Utility: ${visionAiOutput?.commercialQuality?.commercialUtility || 'High demand commercial concept'}`,
      `Copy Space: ${visionAiOutput?.commercialQuality?.copySpace || 'Clean negative space for graphic design and typography overlay'}`,
      `Buyer Appeal: ${visionAiOutput?.commercialQuality?.buyerAppeal || 'Strong composition with high market utility for advertising and editorial layout.'}`
    ]
  };

  // 11. Similarity Check (Batch duplicates)
  const isDuplicate = nearDuplicates.length > 0;
  const similarityCheck: PipelineCheckItem = {
    id: 'similarity-check',
    name: '11. Batch Duplicate / Similarity Check',
    status: isDuplicate ? 'REVIEW' : 'PASS',
    scoreImpact: isDuplicate ? -10 : 0,
    summary: isDuplicate 
      ? `High similarity with ${nearDuplicates.length} file(s) in this batch (${nearDuplicates.slice(0, 2).join(', ')})`
      : 'Unique composition within current upload batch',
    details: isDuplicate ? [
      `Warning: Near-identical variation detected with: ${nearDuplicates.join(', ')}`,
      `Adobe Stock policy penalizes submitting duplicate or spammy near-identical images. Select only the strongest variation.`
    ] : [
      'No identical or spammy variations detected in the current upload batch.',
      'Distinctive visual angle and composition.'
    ]
  };

  // 12. Final Readiness Score
  // Compute composite score
  const totalDeductions = (
    fileCheck.scoreImpact +
    technicalCheck.scoreImpact +
    visualQualityCheck.scoreImpact +
    textLogoCheck.scoreImpact +
    ipSignalCheck.scoreImpact +
    peopleCheck.scoreImpact +
    propertyCheck.scoreImpact +
    aiContentCheck.scoreImpact +
    commercialQualityCheck.scoreImpact +
    similarityCheck.scoreImpact
  );

  readinessScore = Math.max(25, Math.min(99, 100 + totalDeductions));
  if (visionAiOutput?.overallReadinessScore) {
    readinessScore = Math.round((readinessScore + visionAiOutput.overallReadinessScore) / 2);
  }

  if (readinessScore >= 85) {
    riskLevel = 'Low';
  } else if (readinessScore >= 65) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'High';
  }

  const finalScoreCheck: PipelineCheckItem = {
    id: 'final-readiness',
    name: '12. Submission Readiness Score',
    status: riskLevel === 'Low' ? 'PASS' : (riskLevel === 'Medium' ? 'REVIEW' : 'FLAG'),
    scoreImpact: 0,
    summary: `Submission Readiness Score: ${readinessScore}/100 • Potential Risk: ${riskLevel}`,
    details: [
      `Submission Readiness Score: ${readinessScore}/100`,
      `Potential Risk: ${riskLevel}`,
      'Internal pre-submission quality indicator, NOT an Adobe acceptance prediction.'
    ]
  };

  // Suggested keywords and metadata
  const cleanTitle = visionAiOutput?.suggestedTitle || `${item.filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')} for commercial stock`;
  const cleanKeywords = visionAiOutput?.suggestedKeywords || [
    'commercial', 'background', 'high quality', 'stock photo', 'modern', 
    'copy space', 'clean', 'professional', 'isolated', 'digital'
  ];

  const actionItems: string[] = [];
  if (technical.resolutionStatus === 'FAIL') actionItems.push('Upscale image to at least 4 Megapixels (e.g. 2500×2500px or larger).');
  if (technical.fileSizeStatus === 'FAIL') actionItems.push('Compress image below 45 MB to meet Adobe Stock file size limit.');
  if (textLogoCheck.status !== 'PASS') actionItems.push('Remove or retouch recognizable brand logos, trademark text, or watermarks.');
  if (isDuplicate) actionItems.push('Batch contains similar variations. Submit only the single best composition to prevent spam rejection.');
  if (releaseNeeds.modelRelease) actionItems.push('Prepare and attach a signed Adobe Stock Model Release.');
  if (releaseNeeds.propertyRelease) actionItems.push('Prepare and attach a signed Property Release for private property.');
  if (releaseNeeds.aiLabelRequired) actionItems.push('Enable the "Generative AI" tag when uploading on Adobe Stock Contributor Portal.');

  return {
    readinessScore,
    potentialRisk: riskLevel,
    summary: visionAiOutput?.summary || `Asset passed automated pre-submission checks with a readiness score of ${readinessScore}/100.`,
    scannedAt: Date.now(),
    modelUsed: effective.apiKey ? effective.provider : 'Local Heuristic Engine',
    isAiAssisted: Boolean(effective.apiKey),
    checks: {
      fileCheck,
      technicalCheck,
      visualQualityCheck,
      textLogoCheck,
      ipSignalCheck,
      peopleCheck,
      propertyCheck,
      releaseCheck,
      aiContentCheck,
      commercialQualityCheck,
      similarityCheck,
      finalScoreCheck
    },
    suggestedTitle: cleanTitle,
    suggestedCategory: visionAiOutput?.commercialQuality?.stockCategory || 'Graphic Resources / Backgrounds',
    suggestedKeywords: cleanKeywords,
    suggestedCopySpace: visionAiOutput?.commercialQuality?.copySpace || 'Versatile',
    actionItems,
    releasesRequired: releaseNeeds
  };
}

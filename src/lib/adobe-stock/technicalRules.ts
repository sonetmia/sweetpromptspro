/**
 * Adobe Stock Technical Requirements & Pre-Submission Compliance Rules
 * Centralized rule-set for client-side and vision pipeline audits.
 */

export interface TechnicalThresholds {
  minMegapixels: number;
  recommendedMinMegapixels: number;
  maxMegapixels: number;
  minDimensionPx: number;
  maxFileSizeMB: number;
  minFileSizeKB: number;
  supportedMimeTypes: string[];
  supportedExtensions: string[];
  recommendedColorSpaces: string[];
  standardAspectRatios: { name: string; ratio: number; tolerance: number }[];
}

export const ADOBE_TECHNICAL_RULES: TechnicalThresholds = {
  minMegapixels: 4.0, // Adobe Stock absolute minimum is 4MP
  recommendedMinMegapixels: 8.0, // Commercial buyers prefer 8MP - 24MP+
  maxMegapixels: 100.0, // Adobe Stock maximum
  minDimensionPx: 1000, // Absolute minimum edge length
  maxFileSizeMB: 45.0, // Adobe Stock standard maximum for JPEGs
  minFileSizeKB: 300, // Below this usually signifies heavy compression artifacts
  supportedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  supportedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  recommendedColorSpaces: ['sRGB', 'Adobe RGB (1998)', 'Display P3'],
  standardAspectRatios: [
    { name: '3:2 (Standard Photo)', ratio: 3 / 2, tolerance: 0.05 },
    { name: '2:3 (Portrait)', ratio: 2 / 3, tolerance: 0.05 },
    { name: '4:3 (Traditional)', ratio: 4 / 3, tolerance: 0.05 },
    { name: '3:4 (Portrait)', ratio: 3 / 4, tolerance: 0.05 },
    { name: '16:9 (Widescreen Hero)', ratio: 16 / 9, tolerance: 0.05 },
    { name: '9:16 (Vertical Story)', ratio: 9 / 16, tolerance: 0.05 },
    { name: '1:1 (Square)', ratio: 1, tolerance: 0.03 },
    { name: '5:4 (Large Format)', ratio: 5 / 4, tolerance: 0.05 },
    { name: '4:5 (Instagram/Social)', ratio: 4 / 5, tolerance: 0.05 },
    { name: '21:9 (Ultrawide Banner)', ratio: 21 / 9, tolerance: 0.08 },
  ]
};

export interface FileTechnicalAudit {
  fileFormat: string;
  isFormatSupported: boolean;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  fileSizeStatus: 'PASS' | 'REVIEW' | 'FAIL';
  fileSizeMessage: string;
  width: number;
  height: number;
  megapixels: number;
  resolutionStatus: 'PASS' | 'REVIEW' | 'FAIL';
  resolutionMessage: string;
  aspectRatio: string;
  aspectRatioLabel: string;
  orientation: 'Landscape' | 'Portrait' | 'Square';
  hasTransparency?: boolean;
}

/**
 * Evaluates file size and image resolution against current Adobe Stock guidelines.
 */
export function auditImageTechnicalSpecs(
  file: { name: string; size: number; type: string },
  dimensions: { width: number; height: number; hasTransparency?: boolean }
): FileTechnicalAudit {
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const isFormatSupported = ADOBE_TECHNICAL_RULES.supportedExtensions.includes(ext) ||
    ADOBE_TECHNICAL_RULES.supportedMimeTypes.includes(file.type.toLowerCase());

  const sizeMB = file.size / (1024 * 1024);
  const sizeKB = file.size / 1024;
  const fileSizeFormatted = sizeMB >= 1 ? `${sizeMB.toFixed(2)} MB` : `${sizeKB.toFixed(0)} KB`;

  let fileSizeStatus: 'PASS' | 'REVIEW' | 'FAIL' = 'PASS';
  let fileSizeMessage = 'File size is optimal for Adobe Stock JPEG/PNG submission.';

  if (sizeMB > ADOBE_TECHNICAL_RULES.maxFileSizeMB) {
    fileSizeStatus = 'FAIL';
    fileSizeMessage = `File size (${fileSizeFormatted}) exceeds Adobe Stock limit of ${ADOBE_TECHNICAL_RULES.maxFileSizeMB} MB.`;
  } else if (sizeKB < ADOBE_TECHNICAL_RULES.minFileSizeKB) {
    fileSizeStatus = 'REVIEW';
    fileSizeMessage = `File size is quite small (${fileSizeFormatted}). Verify image does not suffer from aggressive JPEG compression.`;
  }

  const megapixels = Number(((dimensions.width * dimensions.height) / 1_000_000).toFixed(2));
  let resolutionStatus: 'PASS' | 'REVIEW' | 'FAIL' = 'PASS';
  let resolutionMessage = `Resolution (${dimensions.width}×${dimensions.height}px, ${megapixels} MP) meets commercial requirements.`;

  if (megapixels < ADOBE_TECHNICAL_RULES.minMegapixels) {
    resolutionStatus = 'FAIL';
    resolutionMessage = `Resolution (${megapixels} MP) is below Adobe Stock's minimum threshold of ${ADOBE_TECHNICAL_RULES.minMegapixels} MP. Upscale before submission.`;
  } else if (megapixels > ADOBE_TECHNICAL_RULES.maxMegapixels) {
    resolutionStatus = 'FAIL';
    resolutionMessage = `Resolution (${megapixels} MP) exceeds Adobe Stock's maximum limit of ${ADOBE_TECHNICAL_RULES.maxMegapixels} MP.`;
  } else if (megapixels < ADOBE_TECHNICAL_RULES.recommendedMinMegapixels) {
    resolutionStatus = 'REVIEW';
    resolutionMessage = `Resolution (${megapixels} MP) meets minimum (4 MP) but falls below the recommended commercial benchmark (8+ MP).`;
  }

  const rawRatio = dimensions.width / (dimensions.height || 1);
  let orientation: 'Landscape' | 'Portrait' | 'Square' = 'Landscape';
  if (Math.abs(rawRatio - 1) < 0.05) {
    orientation = 'Square';
  } else if (rawRatio < 0.95) {
    orientation = 'Portrait';
  }

  // Detect matching standard aspect ratio
  let matchedRatioLabel = `${dimensions.width}:${dimensions.height}`;
  for (const std of ADOBE_TECHNICAL_RULES.standardAspectRatios) {
    if (Math.abs(rawRatio - std.ratio) <= std.tolerance) {
      matchedRatioLabel = std.name;
      break;
    }
  }

  return {
    fileFormat: ext.replace('.', '').toUpperCase() || 'JPEG',
    isFormatSupported,
    fileSizeBytes: file.size,
    fileSizeFormatted,
    fileSizeStatus,
    fileSizeMessage,
    width: dimensions.width,
    height: dimensions.height,
    megapixels,
    resolutionStatus,
    resolutionMessage,
    aspectRatio: `${dimensions.width}×${dimensions.height}`,
    aspectRatioLabel: matchedRatioLabel,
    orientation,
    hasTransparency: dimensions.hasTransparency
  };
}

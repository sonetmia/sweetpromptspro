import { AIManagerClass } from './AIManager';
import { validateStockRisk } from '../risk/validator';
import { AIProviderName } from '../../types';

export interface ImageReferenceItem {
  id: string;
  file: File;
  previewUrl: string;
  filename: string;
  size: number;
  width: number;
  height: number;
  base64: string;
  mimeType: string;
  status: 'Waiting' | 'Analyzing' | 'Analyzed' | 'Failed';
  analysis?: ReferenceImageAnalysis;
  errorMessage?: string;
}

export interface ReferenceImageAnalysis {
  subject: string;
  objects: string[];
  environment: string;
  composition: string;
  viewpoint: string;
  framing: string;
  lighting: string;
  colorPalette: string[];
  mood: string;
  materials: string[];
  textures: string[];
  background: string;
  negativeSpace: string;
  copySpace: string;
  visualHierarchy: string;
  styleCharacteristics: string;
  commercialUse: string;
  
  // Detection Signals
  detectedBrands: string[];
  detectedPeople: {
    hasIdentifiablePerson: boolean;
    personCount: number;
    description: string;
  };
  detectedProperty: {
    hasRecognizableProperty: boolean;
    description: string;
  };
  detectedText: {
    hasText: boolean;
    textClassification: 'None' | 'Generic' | 'Decorative' | 'Possible Brand' | 'Trademark' | 'Watermark';
    sampleText: string;
  };
  detectedCharacters: {
    hasFictionalCharacter: boolean;
    description: string;
  };
  artistStyleReferences: string[];
}

export interface ImageToPromptRequest {
  references: ImageReferenceItem[];
  referenceMode: 'Single Image' | 'Multiple References' | 'Style + Subject' | 'Composition References' | 'Mixed References';
  instructions: string;
  promptCount: number; // 1, 5, 10, 15, 20, 30
  commercialIntent: string;
  contentType: string;
  negativeSpace: string; // None, Left, Right, Top, Bottom, Center
  aspectRatio: string; // 1:1, 4:5, 3:2, 4:3, 16:9, 9:16
  humanPresence: 'No People' | 'Generic People' | 'Specific Type of Person' | 'Automatic';
  originalityLevel: 'Balanced' | 'High' | 'Very High';
  safeLogoTransformation: boolean;
}

export interface GeneratedStockPromptItem {
  id: string;
  promptNumber: number;
  sourceImageName?: string;
  promptText: string;
  subject: string;
  composition: string;
  visualStyle: string;
  colorPalette: string;
  commercialIntent: string;
  ipStatus: 'Low Risk' | 'Review Recommended' | 'Potential IP Signal';
  ipReasoning: string;
  originalityLevel: 'Balanced' | 'High' | 'Very High';
  referenceInfluence: {
    imageId: string;
    filename: string;
    contribution: string; // e.g., "Composition & Spatial Framing"
  }[];
}

export interface ImageToPromptResult {
  generatedPrompts: GeneratedStockPromptItem[];
  overallReferenceSummary: {
    combinedSubject: string;
    combinedComposition: string;
    combinedStyle: string;
    combinedColor: string;
    detectedRiskWarnings: string[];
  };
  modelUsed: string;
  providerUsed: AIProviderName;
}

const aiManager = new AIManagerClass();

/**
 * Analyzes a single reference image using Vision AI
 */
export async function analyzeReferenceImage(
  item: ImageReferenceItem
): Promise<ReferenceImageAnalysis> {
  const effective = aiManager.getEffectiveProviderAndKey(undefined, undefined, true);
  if (!effective.apiKey) {
    throw new Error('Image-to-prompt requires a vision-capable provider (Google Gemini, Groq, or OpenRouter). Please configure your API key in Settings.');
  }

  const prompt = `You are a strict Commercial Stock Inspector and Visual Director. Analyze this reference image and output a valid JSON object ONLY (without markdown backticks) in this exact format:
{
  "subject": "Main subject description",
  "objects": ["object1", "object2"],
  "environment": "Environment and setting",
  "composition": "Framing, perspective, and rule of thirds placement",
  "viewpoint": "Eye-level / Low angle / High angle / Overhead",
  "framing": "Wide / Medium / Close-up / Macro",
  "lighting": "Soft natural lighting / Studio directional / High contrast",
  "colorPalette": ["warm ivory", "deep terracotta", "charcoal"],
  "mood": "Minimalist, professional, serene",
  "materials": ["brushed aluminum", "natural linen"],
  "textures": ["matte finish", "subtle grain"],
  "background": "Clean neutral backdrop",
  "negativeSpace": "Ample left copy space",
  "copySpace": "Left side",
  "visualHierarchy": "Subject primary, backdrop secondary",
  "styleCharacteristics": "Editorial commercial photograph",
  "commercialUse": "Website Hero, Advertising Banner",
  "detectedBrands": ["brand names or logos if visible"],
  "detectedPeople": {
    "hasIdentifiablePerson": false,
    "personCount": 0,
    "description": "No human faces"
  },
  "detectedProperty": {
    "hasRecognizableProperty": false,
    "description": "None"
  },
  "detectedText": {
    "hasText": false,
    "textClassification": "None",
    "sampleText": ""
  },
  "detectedCharacters": {
    "hasFictionalCharacter": false,
    "description": "None"
  },
  "artistStyleReferences": []
}`;

  const raw = await aiManager.generateVision(
    item.base64,
    item.mimeType || 'image/jpeg',
    prompt
  );

  const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  return {
    subject: parsed.subject || 'Commercial subject',
    objects: parsed.objects || [],
    environment: parsed.environment || 'Professional setting',
    composition: parsed.composition || 'Balanced framing',
    viewpoint: parsed.viewpoint || 'Eye-level',
    framing: parsed.framing || 'Medium shot',
    lighting: parsed.lighting || 'Balanced natural lighting',
    colorPalette: parsed.colorPalette || ['neutral tones'],
    mood: parsed.mood || 'Commercial & modern',
    materials: parsed.materials || [],
    textures: parsed.textures || [],
    background: parsed.background || 'Clean backdrop',
    negativeSpace: parsed.negativeSpace || 'Generative copy space',
    copySpace: parsed.copySpace || 'None',
    visualHierarchy: parsed.visualHierarchy || 'Clear subject focus',
    styleCharacteristics: parsed.styleCharacteristics || 'Photographic',
    commercialUse: parsed.commercialUse || 'Advertising & Marketing',
    detectedBrands: parsed.detectedBrands || [],
    detectedPeople: parsed.detectedPeople || { hasIdentifiablePerson: false, personCount: 0, description: 'None' },
    detectedProperty: parsed.detectedProperty || { hasRecognizableProperty: false, description: 'None' },
    detectedText: parsed.detectedText || { hasText: false, textClassification: 'None', sampleText: '' },
    detectedCharacters: parsed.detectedCharacters || { hasFictionalCharacter: false, description: 'None' },
    artistStyleReferences: parsed.artistStyleReferences || []
  };
}

/**
 * Generates ORIGINAL, commercially viable, Adobe Stock-aware prompts from reference image analyses.
 */
export async function generatePromptsFromReferences(
  req: ImageToPromptRequest
): Promise<ImageToPromptResult> {
  const effective = aiManager.getEffectiveProviderAndKey();
  if (!effective.apiKey) {
    throw new Error('API Key required to generate prompts. Please configure your key in Settings.');
  }

  // Gather analyses from uploaded reference images
  const analyzedRefs = req.references.filter((r) => r.analysis);
  if (analyzedRefs.length === 0) {
    throw new Error('No analyzed reference images found. Please upload at least one image.');
  }

  // Aggregate detected IP / risk warnings
  const warnings: string[] = [];
  analyzedRefs.forEach((r, idx) => {
    const a = r.analysis!;
    if (a.detectedBrands.length > 0) {
      warnings.push(`Image ${idx + 1} (${r.filename}): Potential brand signal detected (${a.detectedBrands.join(', ')}). Automatically transformed into generic unbranded visual concepts.`);
    }
    if (a.detectedPeople.hasIdentifiablePerson) {
      warnings.push(`Image ${idx + 1} (${r.filename}): Potential identifiable person detected. Transformed to generic persona description; review model release rules if recreating specific people.`);
    }
    if (a.detectedProperty.hasRecognizableProperty) {
      warnings.push(`Image ${idx + 1} (${r.filename}): Potential private property/architecture reference detected. Transformed to generic visual setting.`);
    }
    if (a.detectedText.hasText && a.detectedText.textClassification !== 'None') {
      warnings.push(`Image ${idx + 1} (${r.filename}): Visible text detected (${a.detectedText.textClassification}). Replaced with generic typography or clean copy space.`);
    }
    if (a.detectedCharacters.hasFictionalCharacter) {
      warnings.push(`Image ${idx + 1} (${r.filename}): Character/franchise design detected. Transformed into generic original fictional figure.`);
    }
  });

  // Construct system prompt for AI Provider
  const refSummaries = analyzedRefs.map((r, i) => `
REFERENCE IMAGE [${i + 1}] (Filename: "${r.filename}"):
- Subject: ${r.analysis?.subject}
- Composition & Framing: ${r.analysis?.composition} (${r.analysis?.viewpoint}, ${r.analysis?.framing})
- Environment & Background: ${r.analysis?.environment} / ${r.analysis?.background}
- Lighting: ${r.analysis?.lighting}
- Color Palette: ${r.analysis?.colorPalette.join(', ')}
- Mood & Style: ${r.analysis?.mood} (${r.analysis?.styleCharacteristics})
- Detected Brands/Text: ${r.analysis?.detectedBrands.join(', ') || 'None'}
`).join('\n');

  const targetCount = analyzedRefs.length;

  const systemInstruction = `You are a Senior Commercial Stock Prompt Architect specializing strictly in Adobe Stock contributor compliance.
Your task is to generate EXACTLY ONE original, highly detailed image generation prompt for EACH reference image provided in the list (Total ${targetCount} prompt(s)).
If 1 image is provided, generate 1 prompt. If 3 images are provided, generate 3 prompts (1 prompt specifically describing Image 1, 1 prompt specifically describing Image 2, 1 prompt specifically describing Image 3).

STRICT ADOBE STOCK COMPLIANCE & QUALITY RULES:
1. NO HUMAN FACES: NEVER generate recognizable human faces, close-up portraits, or direct facial gaze. If human subjects are present in the scene, ALWAYS depict them anonymously (faceless silhouette, viewed from behind/back-view, cropped headless, over-the-shoulder perspective, or hands-only interaction) to prevent model-release rejections and AI facial distortion.
2. NO LOGOS & NO TRADEMARKS: Convert all brand names or corporate trademarks (Nike, Apple, Rolex, BMW, Starbucks, etc.) into generic unbranded visual descriptions ("sleek digital tablet", "unbranded running shoes").
3. NO REAL PEOPLE OR ARTIST STYLES: Never name real celebrities, politicians, athletes, or living artists.
4. NO COPYRIGHTED CHARACTERS: Never include fictional entertainment franchises (Disney, Marvel, DC, Pokémon, Star Wars, Harry Potter).
5. NO SPAM BUZZWORDS: Never use forbidden AI buzzwords ("4k", "8k", "photorealistic", "hyperrealistic", "trending on artstation", "octane render").
6. HIGH COMMERCIAL UTILITY: Create rich, detailed descriptions covering subject, environment, lighting, framing, materials, color palette, and copy space for Adobe Stock buyers.`;

  const userPrompt = `Generate EXACTLY ${targetCount} original commercial prompt(s) (1 prompt corresponding to EACH reference image below):

${refSummaries}

Return a valid JSON array ONLY (without markdown backticks) containing EXACTLY ${targetCount} object(s):
[
  {
    "promptNumber": 1,
    "sourceImageName": "${analyzedRefs[0]?.filename || 'image_1.jpg'}",
    "promptText": "Full detailed original prompt text describing Image 1...",
    "subject": "Short summary of subject",
    "composition": "Short summary of framing/perspective",
    "visualStyle": "Short summary of visual style",
    "colorPalette": "Short color description",
    "ipStatus": "Low Risk",
    "ipReasoning": "Clean unbranded original concept"
  }
]`;

  const rawResponse = await aiManager.generateText(userPrompt, {
    systemInstruction,
    temperature: 0.75,
    maxTokens: Math.min(8192, 1000 + targetCount * 400)
  });

  const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsedPrompts: any[] = JSON.parse(cleanJson);

  const formattedPrompts: GeneratedStockPromptItem[] = parsedPrompts.map((p, idx) => {
    const matchedRef = analyzedRefs[idx] || analyzedRefs[0];
    const riskCheck = validateStockRisk(p.promptText || '');
    let finalIpStatus: GeneratedStockPromptItem['ipStatus'] = 'Low Risk';
    if (riskCheck.overall === 'HIGH') {
      finalIpStatus = 'Potential IP Signal';
    } else if (riskCheck.overall === 'MEDIUM') {
      finalIpStatus = 'Review Recommended';
    }

    return {
      id: `itp_prompt_${Date.now()}_${idx + 1}`,
      promptNumber: idx + 1,
      sourceImageName: matchedRef?.filename || p.sourceImageName || `Image ${idx + 1}`,
      promptText: p.promptText || `Original commercial concept for ${matchedRef?.filename || idx + 1}`,
      subject: p.subject || matchedRef?.analysis?.subject || 'Commercial subject',
      composition: p.composition || matchedRef?.analysis?.composition || 'Balanced framing',
      visualStyle: p.visualStyle || matchedRef?.analysis?.styleCharacteristics || 'Photo',
      colorPalette: p.colorPalette || matchedRef?.analysis?.colorPalette.join(', ') || 'Natural commercial tones',
      commercialIntent: 'Advertising',
      ipStatus: finalIpStatus,
      ipReasoning: p.ipReasoning || 'Transformed into generic original concept',
      originalityLevel: 'High',
      referenceInfluence: [
        {
          imageId: matchedRef?.id || `ref_${idx}`,
          filename: matchedRef?.filename || `image_${idx + 1}`,
          contribution: 'Visual concept & composition'
        }
      ]
    };
  });

  return {
    generatedPrompts: formattedPrompts,
    overallReferenceSummary: {
      combinedSubject: analyzedRefs.map((r) => r.analysis?.subject).filter(Boolean).join('; '),
      combinedComposition: analyzedRefs[0]?.analysis?.composition || 'Balanced commercial arrangement',
      combinedStyle: analyzedRefs[0]?.analysis?.styleCharacteristics || 'Clean commercial aesthetic',
      combinedColor: analyzedRefs.map((r) => r.analysis?.colorPalette.join(', ')).filter(Boolean).join(' | '),
      detectedRiskWarnings: warnings
    },
    modelUsed: effective.provider + ' Vision Engine',
    providerUsed: effective.provider
  };
}

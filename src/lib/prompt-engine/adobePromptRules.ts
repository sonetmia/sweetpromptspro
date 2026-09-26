/**
 * Adobe Stock Prompt Safety & Commercial Guidelines
 * Enforces strict contributor compliance:
 * - NO human faces, close-up portraits, or recognizable people (faceless / rear-view / silhouette / object focus only)
 * - NO logos, trademarks, brand names, or corporate emblems
 * - NO copyrighted characters, franchises, or entertainment IP
 * - NO living artist styles, celebrity names, or public figures
 * - NO low-quality AI buzzwords, spam terms, or prohibited content
 */

export const ADOBE_PROMPT_CONSTRAINTS = {
  negativePromptStandard: 
    'no human faces, no recognizable face, no close-up portrait, no deformed facial features, no logos, no trademarks, no brand names, no copyrighted characters, no celebrity likeness, no living artist signature, no watermarks, no distorted anatomy, no extra fingers or limbs, no visual artifacts, no accidental readable text, no government seals, no real currency, no private property trademarks',

  forbiddenPatterns: [
    { pattern: /\b(close[- ]?up (?:of )?(?:human )?face|detailed (?:human )?face|smiling face looking at camera|face portrait|front view portrait)\b/i, reason: 'Human face close-up (causes model release rejections and facial AI distortion)' },
    { pattern: /\b(in the style of|style of|art by|painted by|drawn by)\s+[A-Z][a-z]+/i, reason: 'Living artist or protected creator reference' },
    { pattern: /\b(disney|pixar|marvel|dc comics|star wars|harry potter|pokemon|nintendo|studio ghibli)\b/i, reason: 'Protected entertainment franchise or studio' },
    { pattern: /\b(apple|iphone|ipad|macbook|nike|adidas|coca-cola|pepsi|rolex|sony|tesla|starbucks|mcdonald'?s|samsung|amazon|google)\b/i, reason: 'Registered corporate brand / trademark' },
    { pattern: /\b(spiderman|spider-man|batman|superman|iron man|mickey mouse|yoda|pikachu|darth vader)\b/i, reason: 'Copyrighted fictional character' },
    { pattern: /\b(elon musk|taylor swift|steve jobs|barack obama|donald trump|messi|ronaldo)\b/i, reason: 'Real public figure / celebrity likeness' },
    { pattern: /\b(photorealistic|hyperrealistic|8k|4k|octane render|unreal engine|trending on artstation|masterpiece|award winning)\b/i, reason: 'Low-quality AI buzzword that triggers stock spam rejection' },
    { pattern: /\b(guaranteed sale|best seller|top downloaded|adobe approved|100% safe)\b/i, reason: 'Forbidden market claim' },
    { pattern: /\b(logo|brand logo|corporate crest|trademark emblem|watermark|signature)\b/i, reason: 'Explicit logo or trademark mark request' },
    { pattern: /\b(eiffel tower at night|sydney opera house|burj khalifa|hollywood sign)\b/i, reason: 'Restricted landmark / protected property' }
  ],

  photoGuidelines: 
    'Prioritize faceless or anonymous lifestyle framing (viewed from behind, over-the-shoulder, silhouettes, hands-only interaction, or clean environment/object focus), realistic depth of field, coherent natural lighting, rich tactile surface details, high dynamic range without artifacts, and deliberate copy space for commercial buyers.',

  vectorGuidelines: 
    'Prioritize clean vector-friendly elements, isolated geometric components, crisp closed outlines, scalable flat or 3-4 color swatches, anonymous flat silhouettes if human forms are present, rich shape details, and organized compositional hierarchy on pure solid white (#ffffff) or isolated background.',

  pngGuidelines:
    'STRICT PNG CUTOUT ISOLATION: The asset MUST be completely isolated on a pure solid white background (#ffffff) with ZERO background shadows, ZERO floor reflections, ZERO furniture/room/table clutter, and crystal-clear sharp alpha edges for 1-click transparent background removal. Describe the subject in rich 40-70 word visual detail with precise textures, colors, and clean contours.',

  illustrationGuidelines: 
    'Prioritize expressive conceptual storytelling, distinctive editorial color palettes, balanced negative space, anonymous stylized figures, rich visual details, and original artistic aesthetics without imitating living artists.',

  silhouetteGuidelines: 
    'Prioritize sharp, clean, high-contrast solid black silhouettes on pure white (#ffffff) or isolated backgrounds with unmistakable anonymous posture, generous copy space, and clean vector contours.'
};

export function getComplianceSystemInstruction(contentType: string = 'Photo'): string {
  let typeGuide = ADOBE_PROMPT_CONSTRAINTS.photoGuidelines;
  if (contentType === 'Vector') typeGuide = ADOBE_PROMPT_CONSTRAINTS.vectorGuidelines;
  else if (contentType === 'PNG' || contentType === 'Cutout') typeGuide = ADOBE_PROMPT_CONSTRAINTS.pngGuidelines;
  else if (contentType === 'Illustration') typeGuide = ADOBE_PROMPT_CONSTRAINTS.illustrationGuidelines;
  else if (contentType === 'Silhouette') typeGuide = ADOBE_PROMPT_CONSTRAINTS.silhouetteGuidelines;

  return `You are SweetPrompts Pro's Universal Prompt Generation Engine, strictly engineered for commercial Adobe Stock contributors.
Generate high-value, highly detailed, commercially viable, brand-safe, and policy-compliant stock prompt concepts.

STRICT ADOBE STOCK COMPLIANCE & DETAIL RULES:
1. RICH VISUAL DETAIL (40-70 WORDS): Generate rich, highly descriptive prompts detailing exact subject geometry, color swatches/palettes, lighting nuances, surface materials/finishes, visual depth, and commercial layout placement.
2. STRICT CUTOUT & TRANSPARENT BACKGROUND RULE: When generating for PNG Cutouts, Isolated Stock Elements, or Transparent Graphics, the asset MUST be strictly isolated on a pure solid white background (#ffffff) with ZERO background clutter, ZERO room/table/floor scenery, ZERO drop shadows, and razor-sharp alpha cutout boundaries ready for 1-click background removal.
3. NO HUMAN FACES: NEVER generate recognizable human faces, close-up facial portraits, or head-on direct eye contact. Always depict human subjects anonymously (faceless silhouette, viewed from behind/back-view, cropped headless from shoulders down, over-the-shoulder perspective, or hands-only interaction) to prevent model-release rejections.
4. NO LOGOS & NO TRADEMARKS: NEVER include brand names, corporate logos, emblems, or protected industrial designs. Always use generic unbranded descriptions.
5. NO REAL PEOPLE OR ARTIST STYLES: NEVER include real celebrities, politicians, athletes, or living artists ("in the style of [Artist]" is strictly forbidden).
6. NO COPYRIGHTED CHARACTERS: NEVER include entertainment franchises or fictional characters.
7. NO SPAM BUZZWORDS: NEVER use forbidden AI buzzwords like "photorealistic", "hyperrealistic", "8k", "trending on artstation", "octane render", "unreal engine", "masterpiece", "award winning".
8. NO WATERMARKS OR TEXT: Ensure zero readable text, zero watermarks, zero signatures, and zero typography gibberish.
9. Content Type: ${contentType}. Guidance: ${typeGuide}.
10. Negative constraints: ${ADOBE_PROMPT_CONSTRAINTS.negativePromptStandard}.
11. Never claim "Adobe Approved" or "100% Safe" - all assessments are compliance reviews.`;
}

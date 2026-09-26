import { UniversalPromptRequest } from './promptSchema';

export interface ConceptStrategy {
  angle: string;
  environment: string;
  lighting: string;
  composition: string;
  commercialUse: string;
  focus: string;
}

export class PromptVariationEngine {
  private static ENVIRONMENTS = [
    'minimalist modern architectural studio with neutral concrete texture',
    'warm Scandinavian interior bathed in soft morning natural daylight',
    'high-end commercial tabletop studio with clean geometric stone podium',
    'vibrant urban outdoor setting with shallow depth of field and soft bokeh',
    'clean seamless studio sweep with subtle graduated pastel shadow',
    'sleek corporate executive boardroom with floor-to-ceiling glass vista',
    'cozy artisan workshop with authentic tactile textures and natural materials',
    'crisp pristine isolated studio environment on pure neutral background',
    'contemporary high-tech laboratory interior with ambient neon accents',
    'lush serene natural botanical landscape with dappled golden hour sunlight'
  ];

  private static COMPOSITIONS = [
    'wide-angle editorial hero layout with generous copy space on the left',
    'dynamic diagonal composition with subject placed on the rule-of-thirds',
    'centered high-impact macro close-up highlighting intricate tactile details',
    'flat lay overhead perspective with organized geometric knolling arrangement',
    'low-angle cinematic perspective giving monumental presence to the subject',
    'balanced three-quarter perspective with deliberate right-side negative space',
    'intimate close-up with soft defocused foreground elements framing the subject',
    'spacious minimalist panoramic framing with vast clean negative space top'
  ];

  private static LIGHTINGS = [
    'soft diffused directional window light with gentle natural falloff',
    'dramatic commercial rim lighting emphasizing crisp silhouette edges',
    'bright high-key advertising studio strobe with crystal clear clarity',
    'warm late-afternoon golden hour side lighting with long elegant shadows',
    'clean cool overcast daylight rendering accurate true-to-life colors',
    'moody cinematic ambient lighting with subtle specular highlights'
  ];

  private static COMMERCIAL_APPLICATIONS = [
    'high-converting e-commerce product hero banner',
    'modern corporate technology annual report cover',
    'engaging social media advertising campaign visual',
    'premium lifestyle magazine editorial spread',
    'clean marketing presentation slide background',
    'sustainable eco-friendly packaging mockup design',
    'healthcare and wellness educational campaign',
    'innovative startup landing page hero graphic'
  ];

  /**
   * Generates N distinct concept dimension seeds to guide multi-prompt generation
   */
  static generateConceptStrategies(count: number, request: UniversalPromptRequest): ConceptStrategy[] {
    const strategies: ConceptStrategy[] = [];

    for (let i = 0; i < count; i++) {
      const envIndex = (i * 3 + 1) % this.ENVIRONMENTS.length;
      const compIndex = (i * 2 + 3) % this.COMPOSITIONS.length;
      const lightIndex = (i + 4) % this.LIGHTINGS.length;
      const commIndex = (i * 5 + 2) % this.COMMERCIAL_APPLICATIONS.length;

      // Honor user-specified composition or negative space if present
      let chosenComp = this.COMPOSITIONS[compIndex];
      if (request.negativeSpace && request.negativeSpace !== 'None') {
        chosenComp = `${chosenComp}, dedicated negative space on the ${request.negativeSpace.toLowerCase()} for commercial text`;
      }

      let chosenEnv = this.ENVIRONMENTS[envIndex];
      if (request.contentType === 'Vector' || request.contentType === 'Silhouette') {
        chosenEnv = 'clean vector-friendly isolated background with zero clutter';
      }

      strategies.push({
        angle: `Perspective Variation ${i + 1}`,
        environment: chosenEnv,
        lighting: this.LIGHTINGS[lightIndex],
        composition: chosenComp,
        commercialUse: request.commercialIntent || this.COMMERCIAL_APPLICATIONS[commIndex],
        focus: `Concept ${i + 1}: Distinctive visual facet of ${request.subject}`
      });
    }

    return strategies;
  }
}

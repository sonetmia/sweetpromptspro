import { autoSanitizePrompt } from '../adobe-stock/promptSanitizer';

export interface PromptSanitizationResult {
  originalText: string;
  sanitizedText: string;
  hasReplaced: boolean;
  replacements: { original: string; replacement: string; reason: string }[];
  notice?: string;
}

const COMMON_GENERIC_REPLACEMENTS: Record<string, string> = {
  // Human Face & Portrait terms -> Safe Faceless / Lifestyle equivalents
  'close-up face': 'anonymous faceless perspective with clean negative space',
  'detailed face': 'faceless minimalist silhouette composition',
  'human face': 'faceless anonymous lifestyle composition',
  'face portrait': 'over-the-shoulder lifestyle composition',
  'front portrait': 'anonymous back-view lifestyle scene',
  'smiling face': 'warm candid scene seen from behind',
  'headshot portrait': 'anonymous professional in modern workspace seen from over-the-shoulder',

  // Brands & Electronics
  iphone: 'modern sleek smartphone',
  ipad: 'digital touchscreen tablet',
  macbook: 'modern aluminum laptop with blank lid',
  imac: 'all-in-one desktop workstation',
  airpods: 'minimalist wireless earbuds',
  'apple watch': 'modern digital smartwatch with blank screen',
  samsung: 'sleek unbranded smartphone',
  'galaxy s24': 'modern sleek bezel-less smartphone',
  nike: 'athletic performance sportswear',
  adidas: 'modern athletic sneakers without logos',
  puma: 'technical athletic footwear',
  'under armour': 'performance training apparel',
  gucci: 'bespoke designer handcrafted bag',
  prada: 'luxury Italian-style leather accessory',
  'louis vuitton': 'premium textured leather travel bag',
  chanel: 'elegant classic luxury handbag',
  rolex: 'luxury mechanical watch with unbranded dial',
  cartier: 'fine artisan jewelry piece',
  starbucks: 'artisan cafe paper cup',
  mcdonalds: 'fast food meal packaging',
  'mcdonald\'s': 'fast food meal packaging',
  'burger king': 'gourmet burger on unbranded paper liner',
  tesla: 'modern streamlined electric vehicle',
  cybertruck: 'futuristic geometric electric concept truck',
  coca_cola: 'effervescent cola soda can',
  'coca-cola': 'effervescent cola soda can',
  coke: 'effervescent cola soda can',
  pepsi: 'refreshing cold soda can',
  sony: 'professional mirrorless camera',
  canon: 'professional DSLR camera',
  nikon: 'professional photography camera',
  playstation: 'modern ergonomic wireless gaming controller',
  ps5: 'next-gen sleek home gaming console',
  xbox: 'contemporary minimalist gaming console',
  'windows 11': 'modern desktop user interface',
  ferrari: 'high-performance red concept sports car',
  lamborghini: 'aerodynamic luxury concept supercar',
  porsche: 'sleek aerodynamic performance coupe',
  bmw: 'modern executive luxury sedan',
  mercedes: 'premium executive automobile',
  'mercedes-benz': 'premium executive automobile',
  lego: 'colorful interlocking plastic toy bricks',
  barbie: 'stylized fashion doll',

  // Logos & Emblems
  'brand logo': 'unbranded clean surface',
  'corporate logo': 'minimalist unbranded geometry',
  'car logo': 'unbranded front grille',
  watermark: 'pristine high-resolution render',
  watermarks: 'pristine high-resolution render',

  // Characters & Franchises
  'spider-man': 'athletic comic-inspired hero in generic red and blue suit without emblems',
  spiderman: 'athletic comic-inspired hero in generic red and blue suit without emblems',
  batman: 'armored nocturnal vigilante in dark textured tactical suit without logos',
  superman: 'powerful heroic figure in classic cape and suit without emblems',
  'iron man': 'futuristic robotic armored hero with glowing chest core',
  ironman: 'futuristic robotic armored hero with glowing chest core',
  'mickey mouse': 'cheerful animated cartoon mouse character with large ears',
  disney: 'whimsical high-quality fairytale 3D animation',
  marvel: 'action-packed graphic novel hero aesthetic',
  pikachu: 'cute electric animal creature with yellow fur',
  pokemon: 'fantastical companion creatures',
  yoda: 'wise small alien sage with pointed ears',
  'darth vader': 'intimidating armored sci-fi villain in black mechanical helmet',
  'harry potter': 'young spellcaster scholar with simple wooden wand',
  hogwarts: 'vintage gothic fantasy castle library',

  // Celebrities & Real Public Figures
  'elon musk': 'visionary tech entrepreneur executive in casual blazer',
  'steve jobs': 'charismatic technology founder presenting on minimalist stage',
  'taylor swift': 'talented pop female singer performing with acoustic guitar',
  'barack obama': 'distinguished orator statesman in tailored dark suit',
  'donald trump': 'senior business executive with red tie at press podium',
  messi: 'elite professional soccer player in generic dual-tone jersey',
  ronaldo: 'athletic professional football player in unmarked jersey',

  // Restricted landmarks
  'eiffel tower at night': 'illuminated European metropolis tower at twilight',
  'sydney opera house': 'modern coastal architectural sail-shaped auditorium',
  'burj khalifa': 'futuristic soaring architectural glass tower',
  'hollywood sign': 'scenic hillside overlooking sunlit California city'
};

export class UniversalPromptSanitizer {
  /**
   * Scans text for Human Face requests, IP risks, logos, and buzzwords, converting them into safe generic descriptions
   */
  static sanitize(text: string): PromptSanitizationResult {
    if (!text || typeof text !== 'string') {
      return { originalText: '', sanitizedText: '', hasReplaced: false, replacements: [] };
    }

    let working = text;
    const replacements: { original: string; replacement: string; reason: string }[] = [];

    // 1. Run common dictionary replacement
    for (const [key, replacement] of Object.entries(COMMON_GENERIC_REPLACEMENTS)) {
      const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(working)) {
        working = working.replace(regex, replacement);
        replacements.push({
          original: key,
          replacement,
          reason: 'Protected brand, trademark, logo, human face, or copyrighted character converted to safe commercial asset'
        });
      }
    }

    // 2. Artist reference stripping ("in the style of [Artist]")
    const artistRegex = /\b(?:in the style of|style of|art by|painted by|drawn by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi;
    working = working.replace(artistRegex, (_match, artistName) => {
      replacements.push({
        original: artistName,
        replacement: 'in a refined expressive artistic aesthetic',
        reason: 'Living artist or protected creator reference removed to comply with stock IP standards'
      });
      return 'in a refined expressive artistic aesthetic';
    });

    // 3. Human face requests cleanup
    const faceRegex = /\b(?:close[- ]?up (?:of )?(?:a )?(?:human )?face|looking directly at (?:the )?camera|detailed face|front view portrait|headshot portrait)\b/gi;
    if (faceRegex.test(working)) {
      working = working.replace(faceRegex, 'faceless anonymous lifestyle composition, seen from behind or over-the-shoulder');
      replacements.push({
        original: 'human face / portrait request',
        replacement: 'faceless anonymous lifestyle composition',
        reason: 'Human face close-ups removed to prevent model release rejections and AI facial distortion'
      });
    }

    // 4. Run built-in Adobe Stock prompt sanitizer for spam buzzwords and rule violations
    const stockSanitize = autoSanitizePrompt(working);
    working = stockSanitize.sanitizedPrompt;
    for (const rep of stockSanitize.replacedTerms) {
      if (!replacements.some(r => r.original.toLowerCase() === rep.original.toLowerCase())) {
        replacements.push(rep);
      }
    }

    const hasReplaced = replacements.length > 0;
    const notice = hasReplaced 
      ? 'Protected brand, human face, logo, or stock spam term converted to safe commercial equivalent.'
      : undefined;

    return {
      originalText: text,
      sanitizedText: working.trim(),
      hasReplaced,
      replacements,
      notice
    };
  }
}

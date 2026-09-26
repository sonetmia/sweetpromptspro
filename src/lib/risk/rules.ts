export interface RiskRule {
  pattern: RegExp;
  term: string;
  category: 'Human Face' | 'Brand' | 'Entertainment' | 'Technology' | 'Celebrity' | 'Property' | 'Text' | 'Artist Style' | 'Prohibited Content';
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  recommendation: string;
}

export const RISK_RULES: RiskRule[] = [
  // Human Face & Model Release Safety
  { 
    pattern: /\b(close[- ]?up (?:of )?(?:human )?face|detailed (?:human )?face|portrait of (?:a )?face|smiling face looking at camera|face portrait|front view portrait|headshot portrait)\b/i, 
    term: 'Recognizable Human Face / Portrait', 
    category: 'Human Face', 
    level: 'HIGH', 
    reason: 'Identifiable human faces require signed model releases and frequently suffer AI facial distortion.', 
    recommendation: 'Use faceless anonymous compositions (seen from behind, silhouette, cropped from shoulders down, or hands-only).' 
  },

  // Logos, Trademarks, Emblems
  { 
    pattern: /\b(logo|brand logo|corporate logo|car logo|brand emblem|trademark logo|branded watermark)\b/i, 
    term: 'Visible Corporate Logo / Trademark', 
    category: 'Brand', 
    level: 'HIGH', 
    reason: 'Prompts explicitly requesting logos or commercial emblems cause immediate stock rejection.', 
    recommendation: 'Remove logo references; specify clean unbranded surfaces with no emblems or typography.' 
  },
  { 
    pattern: /\b(watermark|watermarked|copyright stamp|stock signature)\b/i, 
    term: 'Watermark or Signature Artifact', 
    category: 'Text', 
    level: 'HIGH', 
    reason: 'Watermarks and signatures are strictly forbidden on Adobe Stock.', 
    recommendation: 'Remove watermark terms and specify pristine render quality with zero text.' 
  },

  // Brands & Sportswear
  { 
    pattern: /\b(nike|adidas|puma|reebok|under armour|gucci|prada|louis vuitton|chanel|hermès|rolex|cartier|tiffany|dior|balenciaga|versace|burberry)\b/i, 
    term: 'Luxury / Sportswear Brand', 
    category: 'Brand', 
    level: 'HIGH', 
    reason: 'Contains protected commercial brand name, monogram, or trademark.', 
    recommendation: 'Replace with generic description (e.g. "unbranded performance athletic footwear", "bespoke designer leather bag").' 
  },
  { 
    pattern: /\b(ferrari|lamborghini|porsche|bmw|mercedes|audi|tesla|toyota|ford|chevrolet|bugatti|mclaren)\b/i, 
    term: 'Automotive Brand / Trademark', 
    category: 'Brand', 
    level: 'HIGH', 
    reason: 'Contains recognizable vehicle manufacturer trademark or distinctive body design.', 
    recommendation: 'Use generic concept sports car, modern executive sedan, or streamlined electric vehicle.' 
  },
  
  // Entertainment & Characters
  { 
    pattern: /\b(marvel|disney|pixar|star wars|harry potter|spider-man|spiderman|batman|superman|iron man|captain america|pikachu|pokemon|mickey mouse|elsa|darth vader|yoda|nintendo|mario|zelda)\b/i, 
    term: 'Copyrighted Character / Franchise', 
    category: 'Entertainment', 
    level: 'HIGH', 
    reason: 'Reference to copyrighted fictional character, movie studio, or entertainment franchise.', 
    recommendation: 'Describe original fantasy hero, futuristic tactical armor, or whimsical creature without copyrighted traits.' 
  },
  
  // Technology
  { 
    pattern: /\b(iphone|macbook|ipad|airpods|apple watch|playstation|ps5|xbox|nintendo switch|samsung galaxy)\b/i, 
    term: 'Branded Hardware Device', 
    category: 'Technology', 
    level: 'HIGH', 
    reason: 'Specific consumer electronics trademark and industrial design.', 
    recommendation: 'Use generic sleek smartphone, modern aluminum ultrabook, or wireless gaming controller.' 
  },
  { 
    pattern: /\b(windows 11|macos|ios|android os)\b/i, 
    term: 'Operating System Trademark', 
    category: 'Technology', 
    level: 'LOW', 
    reason: 'Proprietary software and UI name.', 
    recommendation: 'Use "modern computer desktop interface" or "mobile operating screen".' 
  },

  // Living Artists & Creator Styles
  { 
    pattern: /\b(in the style of|style of|art by|painted by)\s+[A-Z][a-z]+/i, 
    term: 'Living Artist / Creator Style Reference', 
    category: 'Artist Style', 
    level: 'HIGH', 
    reason: 'Directly imitating living artists violates marketplace copyright policies.', 
    recommendation: 'Describe concrete visual elements: color palettes, brushstroke textures, and volumetric lighting.' 
  },
  
  // Celebrity & Sports Figures
  { 
    pattern: /\b(lebron|messi|ronaldo|taylor swift|beyoncé|tom cruise|brad pitt|elon musk|steve jobs|biden|trump|obama)\b/i, 
    term: 'Celebrity Likeness / Public Figure', 
    category: 'Celebrity', 
    level: 'HIGH', 
    reason: 'Reference to real living celebrity name or likeness without signed release.', 
    recommendation: 'Use generic professional athlete, singer, executive, or statesman in tailored attire.' 
  },

  // Restricted Landmarks
  { 
    pattern: /\b(eiffel tower at night|sydney opera house|burj khalifa|hollywood sign)\b/i, 
    term: 'Restricted Architectural Landmark', 
    category: 'Property', 
    level: 'HIGH', 
    reason: 'Recognizable landmark with protected night lighting copyright or strict property trademark.', 
    recommendation: 'Use modern illuminated metropolitan skyline or abstract architectural glass towers.' 
  },
  
  // Government / Symbols / Currency
  { 
    pattern: /\b(fbi|cia|police badge|military insignia|passport|driver license|dollar bill|100 dollar bill|real currency|banknote)\b/i, 
    term: 'Official Government Emblem / Currency', 
    category: 'Prohibited Content', 
    level: 'HIGH', 
    reason: 'Protected official symbols, sensitive identity documents, or prohibited currency reproduction.', 
    recommendation: 'Use generic security access badge or conceptual glowing fintech digital graphics.' 
  },

  // Stock Spam Buzzwords
  { 
    pattern: /\b(photorealistic|hyperrealistic|8k|octane render|unreal engine|trending on artstation|masterpiece|guaranteed sales|100% safe)\b/i, 
    term: 'AI Buzzword Spam Filter Trigger', 
    category: 'Text', 
    level: 'MEDIUM', 
    reason: 'Low-quality buzzwords trigger stock marketplace spam filters and quality rejections.', 
    recommendation: 'Remove buzzwords; rely on specific camera lens, lighting, and composition attributes.' 
  }
];

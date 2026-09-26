/**
 * Comprehensive IP, Trademark, Logo, Human Face & Copyright Safety Rules
 * With automatic generic commercial alternatives conforming to Adobe Stock Guidelines.
 */

export interface IPRule {
  pattern: RegExp;
  term: string;
  category: 'Human Face' | 'Brand' | 'Artist Style' | 'Fictional Character' | 'Franchise' | 'Celebrity' | 'Protected Property' | 'Prohibited Content' | 'Logo / Trademark';
  level: 'HIGH' | 'MEDIUM';
  reason: string;
  safeAlternative: string;
}

export const IP_RULES: IPRule[] = [
  // --- 1. HUMAN FACE & PORTRAIT SAFETY (Prevent model-release rejections & facial AI distortion) ---
  {
    pattern: /\b(?:close[- ]?up (?:of )?(?:human )?face|detailed (?:human )?face|portrait of (?:a )?face|smiling face looking at (?:the )?camera|face portrait|front view portrait|pretty face|handsome face|human face close[- ]?up)\b/i,
    term: 'Recognizable Human Face / Close-up Portrait',
    category: 'Human Face',
    level: 'HIGH',
    reason: 'Close-up recognizable human faces trigger model release rejections, likeness concerns, and AI facial distortion. Stock guidelines favor anonymous, faceless, or rear-view lifestyle compositions.',
    safeAlternative: 'faceless anonymous lifestyle composition, seen from behind (back-view) or over-the-shoulder, modern aesthetic with dedicated copy space'
  },
  {
    pattern: /\b(?:looking directly at (?:the )?camera|staring into camera|eye contact with camera)\b/i,
    term: 'Direct Eye Contact / Head-on Portrait',
    category: 'Human Face',
    level: 'HIGH',
    reason: 'Direct eye contact poses model likeness and release requirements.',
    safeAlternative: 'candid scene viewed from behind or silhouette, natural ambient lighting'
  },
  {
    pattern: /\b(?:headshot portrait|corporate headshot|studio portrait of a man|studio portrait of a woman)\b/i,
    term: 'Studio Headshot Portrait',
    category: 'Human Face',
    level: 'MEDIUM',
    reason: 'Headshots require model releases and frequently suffer from AI micro-distortion.',
    safeAlternative: 'anonymous professional in modern Scandinavian workspace seen from over-the-shoulder, clean negative space'
  },

  // --- 2. LOGOS, EMBLEMS & TRADEMARKS ---
  {
    pattern: /\b(?:brand logo|corporate logo|company logo|car logo|brand emblem|trademark logo|branded watermark|app icon logo)\b/i,
    term: 'Visible Corporate Logo / Trademark',
    category: 'Logo / Trademark',
    level: 'HIGH',
    reason: 'Prompts explicitly requesting logos or commercial emblems cause immediate Adobe Stock rejection for IP infringement.',
    safeAlternative: 'clean minimalist unbranded surface with zero emblems, zero lettering, and zero commercial badges'
  },
  {
    pattern: /\b(?:watermark|watermarked|copyright stamp|stock signature|artist signature|getty watermark|shutterstock watermark)\b/i,
    term: 'Watermark / Signature / Stamp',
    category: 'Logo / Trademark',
    level: 'HIGH',
    reason: 'Watermarks and signatures are strictly forbidden on microstock marketplaces.',
    safeAlternative: 'pristine high-resolution render with flawless edge definition and zero text overlay'
  },

  // --- 3. TECH & CONSUMER BRANDS ---
  {
    pattern: /\b(?:apple|iphone(?: \d+)?(?: pro)?(?: max)?|ipad|macbook(?: pro)?|airpods|imac|apple watch|ios|magsafe)\b/i,
    term: 'Apple Brand & Devices',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Registered hardware trademarks and patented industrial designs.',
    safeAlternative: 'minimalist unbranded aluminum ultrabook with blank lid and edge-to-edge display on modern wooden desk'
  },
  {
    pattern: /\b(?:samsung|galaxy s\d+|galaxy fold|galaxy flip)\b/i,
    term: 'Samsung Mobile Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Registered smartphone trademark.',
    safeAlternative: 'sleek unbranded bezel-less smartphone with modern dark glass screen'
  },
  {
    pattern: /\b(?:sony|playstation|ps4|ps5|dualshock|dualsense)\b/i,
    term: 'Sony / PlayStation Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected consumer electronics and gaming trademarks.',
    safeAlternative: 'modern ergonomic wireless gaming controller on minimalist desk setup'
  },
  {
    pattern: /\b(?:microsoft|xbox(?: series [xs])?|windows 11|surface pro)\b/i,
    term: 'Microsoft / Xbox Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected computing and gaming brand.',
    safeAlternative: 'contemporary wireless gaming console and sleek workstation'
  },
  {
    pattern: /\b(?:canon|nikon|fujifilm|leica|hasselblad|gopro)\b/i,
    term: 'Camera Brand Trademark',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected camera manufacturer trademark.',
    safeAlternative: 'professional black mirrorless camera with clean unmarked body'
  },
  {
    pattern: /\b(?:amazon|alexa|kindle|echo dot|google|android os|pixel 8|pixel 9)\b/i,
    term: 'Big Tech Trademarks',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected multinational technology trademarks.',
    safeAlternative: 'contemporary smart home hub device with subtle ambient indicator'
  },

  // --- 4. APPAREL, FOOTWEAR & LUXURY BRANDS ---
  {
    pattern: /\b(?:nike|swoosh|air jordan|just do it)\b/i,
    term: 'Nike Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected athletic apparel trademark and iconic swoosh logo.',
    safeAlternative: 'unbranded aerodynamic athletic performance sneakers with breathable mesh'
  },
  {
    pattern: /\b(?:adidas|three stripes|yeezy|trefoil)\b/i,
    term: 'Adidas Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected sportswear trademark.',
    safeAlternative: 'generic modern training shoes with clean geometric styling and no logo'
  },
  {
    pattern: /\b(?:puma|under armour|reebok|new balance|lululemon|patagonia|the north face)\b/i,
    term: 'Sportswear & Outdoor Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected sports apparel trademark.',
    safeAlternative: 'high-performance technical activewear with clean unbranded seams'
  },
  {
    pattern: /\b(?:gucci|prada|louis vuitton|lv monogram|chanel|herm[eè]s|dior|balenciaga|versace|burberry|fendi)\b/i,
    term: 'Haute Couture / Luxury Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected luxury brand name, pattern monogram, and trade dress.',
    safeAlternative: 'bespoke handcrafted luxury leather goods with minimalist neutral stitching and unbranded hardware'
  },
  {
    pattern: /\b(?:rolex|cartier|omega|patek philippe|tag heuer|audemars piguet|tiffany(?: & co)?)\b/i,
    term: 'Luxury Watch / Jewelry Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected luxury timepiece and jewelry brand.',
    safeAlternative: 'master-crafted mechanical luxury chronograph watch with unbranded dial'
  },

  // --- 5. AUTOMOTIVE & VEHICLE BRANDS ---
  {
    pattern: /\b(?:tesla|cybertruck|model s|model 3|model x|model y)\b/i,
    term: 'Tesla Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected automotive trademark and vehicle body patents.',
    safeAlternative: 'futuristic aerodynamic luxury electric vehicle with continuous LED light strip and unbranded front grille'
  },
  {
    pattern: /\b(?:ferrari|lamborghini|porsche|bugatti|mclaren|aston martin)\b/i,
    term: 'Supercar Manufacturer Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected luxury supercar trademarks and iconic body shapes.',
    safeAlternative: 'sculpted high-performance concept sports car with aerodynamic curves and unbranded emblem'
  },
  {
    pattern: /\b(?:bmw|mercedes(?:-benz)?|audi|volkswagen|toyota|honda|ford|chevrolet|jeep|land rover)\b/i,
    term: 'Automobile Manufacturer Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected automotive maker names and grille designs.',
    safeAlternative: 'modern executive sedan with sleek aerodynamic silhouette and unbranded details'
  },

  // --- 6. FOOD, BEVERAGE & RESTAURANT BRANDS ---
  {
    pattern: /\b(?:coca-?cola|coke|pepsi|sprite|red bull|monster energy)\b/i,
    term: 'Beverage Trademark',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected soda/energy drink brand name and packaging.',
    safeAlternative: 'refreshing sparkling soda can with chilled condensation droplets and blank minimalist exterior'
  },
  {
    pattern: /\b(?:starbucks|costa coffee|dunkin(?:'? donuts)?|nespresso)\b/i,
    term: 'Coffeehouse Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected coffee franchise trademark.',
    safeAlternative: 'artisan disposable craft paper coffee cup on natural rustic wooden cafe counter'
  },
  {
    pattern: /\b(?:mcdonald'?s|golden arches|burger king|kfc|subway|domino'?s|pizza hut)\b/i,
    term: 'Fast Food Franchise',
    category: 'Brand',
    level: 'HIGH',
    reason: 'Protected fast food restaurant brand.',
    safeAlternative: 'gourmet smash burger with crisp lettuce on neutral unbranded paper liner'
  },

  // --- 7. ENTERTAINMENT, CHARACTERS & FRANCHISES ---
  {
    pattern: /\b(?:disney(?:-style)?|pixar(?:-style)?|walt disney)\b/i,
    term: 'Disney / Pixar Franchise',
    category: 'Franchise',
    level: 'HIGH',
    reason: 'Protected multinational entertainment studio trademark and animation IP.',
    safeAlternative: 'whimsical 3D stylized animated character design with soft volumetric global illumination'
  },
  {
    pattern: /\b(?:marvel|avengers|mcu|dc comics|justice league)\b/i,
    term: 'Superhero Comic Universe',
    category: 'Franchise',
    level: 'HIGH',
    reason: 'Protected superhero publishing and film franchises.',
    safeAlternative: 'dynamic futuristic guardian in original modular tactical armor'
  },
  {
    pattern: /\b(?:spider-?man|spiderman|peter parker)\b/i,
    term: 'Spider-Man Character',
    category: 'Fictional Character',
    level: 'HIGH',
    reason: 'Copyrighted Marvel / Disney character.',
    safeAlternative: 'acrobatic athletic hero in generic dual-tone aerodynamic athletic suit without insignia'
  },
  {
    pattern: /\b(?:batman|bruce wayne|dark knight|gotham|joker|superman|iron man|captain america|thor|hulk|wolverine|deadpool)\b/i,
    term: 'Comic Superhero / Villain Character',
    category: 'Fictional Character',
    level: 'HIGH',
    reason: 'Copyrighted and trademarked comic character.',
    safeAlternative: 'original heroic champion with futuristic stylized protective tech suit and heroic stance'
  },
  {
    pattern: /\b(?:harry potter|hogwarts|gryffindor|slytherin|voldemort|dumbledore)\b/i,
    term: 'Harry Potter Franchise',
    category: 'Franchise',
    level: 'HIGH',
    reason: 'Registered trademark of Warner Bros Entertainment.',
    safeAlternative: 'young spellcaster scholar in vintage gothic library holding a simple polished wooden wand'
  },
  {
    pattern: /\b(?:star wars|jedi|sith|lightsaber|darth vader|yoda|mandalorian|baby yoda|grogu)\b/i,
    term: 'Star Wars Universe',
    category: 'Franchise',
    level: 'HIGH',
    reason: 'Protected Lucasfilm / Disney intellectual property.',
    safeAlternative: 'space sci-fi wanderer in hooded desert tunic holding a luminous energy staff'
  },
  {
    pattern: /\b(?:pok[eé]mon|pikachu|charizard|pokeball|nintendo|mario|luigi|zelda|link)\b/i,
    term: 'Nintendo / Pokémon Franchise',
    category: 'Franchise',
    level: 'HIGH',
    reason: 'Nintendo / The Pokémon Company protected characters and games.',
    safeAlternative: 'original cute fantasy companion creature with luminous fur and expressive eyes'
  },
  {
    pattern: /\b(?:lego|minifig|minifigure)\b/i,
    term: 'LEGO Toy Brand',
    category: 'Brand',
    level: 'HIGH',
    reason: 'LEGO Group trademarked interlocking bricks and figures.',
    safeAlternative: 'colorful modular interlocking geometric plastic toy construction blocks'
  },
  {
    pattern: /\b(?:barbie|mattel|hot wheels|transformers|optimus prime|hasbro)\b/i,
    term: 'Toy & Character Franchise',
    category: 'Franchise',
    level: 'HIGH',
    reason: 'Protected toy trademark and character design.',
    safeAlternative: 'stylized fashionable doll or modular mechanical transforming robot'
  },

  // --- 8. LIVING ARTISTS & SIGNATURE CREATOR STYLES ---
  {
    pattern: /\b(?:in the style of|style of|art by|painted by|drawn by|inspired by)\s+([a-zA-Z\s]+)\b/i,
    term: 'Artist/Creator Style Reference',
    category: 'Artist Style',
    level: 'HIGH',
    reason: 'Imitating living or signature artist styles violates stock platform IP rules.',
    safeAlternative: 'expressive textured brushwork, organic hand-crafted aesthetic with original color harmonies'
  },
  {
    pattern: /\b(?:greg rutkowski|artgerm|alphonse mucha|banksy|beeple|makoto shinkai|studio ghibli|hayao miyazaki)\b/i,
    term: 'Signature Artist / Animation Studio',
    category: 'Artist Style',
    level: 'HIGH',
    reason: 'Specific artist keyword triggers copyright flags.',
    safeAlternative: 'refined academic digital illustration, highly detailed volumetric lighting and rich atmosphere'
  },

  // --- 9. CELEBRITIES & LIVING PUBLIC FIGURES ---
  {
    pattern: /\b(?:elon musk|steve jobs|bill gates|mark zuckerberg|jeff bezos|tim cook)\b/i,
    term: 'Tech Executive / Public Figure',
    category: 'Celebrity',
    level: 'HIGH',
    reason: 'Living public figure name or likeness without release.',
    safeAlternative: 'visionary tech entrepreneur in casual blazer presenting on modern minimalist stage'
  },
  {
    pattern: /\b(?:taylor swift|beyonc[eé]|rihanna|drake|kanye west|ariana grande|bts)\b/i,
    term: 'Celebrity Musician / Performer',
    category: 'Celebrity',
    level: 'HIGH',
    reason: 'Famous music artist name or likeness.',
    safeAlternative: 'talented acoustic musician performing in warm atmospheric stage lighting'
  },
  {
    pattern: /\b(?:lionel messi|messi|cristiano ronaldo|ronaldo|lebron james|neymar|mbappe)\b/i,
    term: 'Professional Athlete Likeness',
    category: 'Celebrity',
    level: 'HIGH',
    reason: 'Recognizable athlete likeness.',
    safeAlternative: 'elite athlete in generic dual-tone unbranded sports jersey on athletic field'
  },
  {
    pattern: /\b(?:barack obama|donald trump|joe biden|kamala harris|vladimir putin|emmanuel macron)\b/i,
    term: 'Political Figure',
    category: 'Celebrity',
    level: 'HIGH',
    reason: 'Real political figures cannot be depicted in commercial stock without explicit editorial constraints.',
    safeAlternative: 'senior statesman diplomat in tailored navy suit at international conference podium'
  },

  // --- 10. RESTRICTED LANDMARKS & PRIVATE ARCHITECTURAL PROPERTY ---
  {
    pattern: /\b(?:eiffel tower at night|eiffel tower light show|sydney opera house|burj khalifa|hollywood sign|empire state building lighting|disneyland castle|louvre pyramid)\b/i,
    term: 'Restricted Architectural Landmark / Property',
    category: 'Protected Property',
    level: 'HIGH',
    reason: 'Recognizable architectural monuments with protected copyright lighting, trademarks, or property release requirements.',
    safeAlternative: 'modern metropolitan skyline with abstract glowing architectural towers and waterfront reflection'
  },

  // --- 11. OFFICIAL SEALS, CURRENCY & SENSITIVE PROHIBITED TOPICS ---
  {
    pattern: /\b(?:dollar bill|us currency|100 dollar bill|banknote|euro banknote|counterfeit money|real currency)\b/i,
    term: 'Real Currency / Banknote Depiction',
    category: 'Prohibited Content',
    level: 'HIGH',
    reason: 'Accurate reproduction of actual banknotes is illegal and prohibited by stock agencies.',
    safeAlternative: 'abstract conceptual digital currency visual with glowing geometric fintech graphics'
  },
  {
    pattern: /\b(?:fbi badge|cia badge|police badge|military insignia|interpol|official government seal|presidential seal|passport|driver license)\b/i,
    term: 'Official Government Seal / ID / Badge',
    category: 'Prohibited Content',
    level: 'HIGH',
    reason: 'Protected government badges and official identification symbols.',
    safeAlternative: 'generic security access card or abstract digital identity token'
  }
];

export function findIPRisks(text: string) {
  if (!text || typeof text !== 'string') return [];
  
  const matches: Array<{
    term: string;
    category: string;
    level: 'HIGH' | 'MEDIUM';
    reason: string;
    safeAlternative: string;
    rawMatch: string;
  }> = [];

  for (const rule of IP_RULES) {
    const match = rule.pattern.exec(text);
    if (match) {
      matches.push({
        term: rule.term,
        category: rule.category,
        level: rule.level,
        reason: rule.reason,
        safeAlternative: rule.safeAlternative,
        rawMatch: match[0]
      });
    }
  }

  // Also check for generic trademark/logo keywords
  if (/\b(?:logo|trademark|brand logo|branded logo|watermark|emblem|crest|insignia)\b/i.test(text)) {
    if (!matches.some(m => m.term.includes('Logo') || m.term.includes('Trademark') || m.term.includes('Watermark'))) {
      matches.push({
        term: 'Visible Trademark / Logo Keyword',
        category: 'Logo / Trademark',
        level: 'HIGH',
        reason: 'Prompts explicitly requesting logos or branded symbols cause stock rejections.',
        safeAlternative: 'clean unbranded surface with no emblems, typography, or commercial badges',
        rawMatch: 'logo/trademark'
      });
    }
  }

  // Check for face close-ups if not already matched
  if (/\b(?:face|portrait of face|front face|facial features)\b/i.test(text)) {
    if (!matches.some(m => m.category === 'Human Face')) {
      matches.push({
        term: 'Human Face / Facial Features Request',
        category: 'Human Face',
        level: 'HIGH',
        reason: 'Direct human face prompts can cause model release rejections and facial AI distortion. Prefer faceless, rear-view, or silhouette depictions.',
        safeAlternative: 'faceless anonymous lifestyle composition, seen from behind or silhouette, clean negative space',
        rawMatch: 'face/portrait'
      });
    }
  }

  return matches;
}

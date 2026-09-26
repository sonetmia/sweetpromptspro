/**
 * Global Adobe Stock Compliance & Contributor Guidance Rules
 * Centralized configuration used across all SweetPrompts Pro tools.
 */

export const ADOBE_STOCK_RULES = {
  version: '2026.1',
  maxKeywords: 49,
  recommendedTitleLength: 70,
  maxTitleLength: 100,

  prohibitedPromptReferences: [
    'artist names',
    'real living people and public figures',
    'copyrighted characters and franchises',
    'brand names and commercial logos',
    'government seals and currency symbols',
    'third-party intellectual property',
    'unverified real news events',
    '"in the style of [artist]"',
    '"inspired by [brand]"'
  ],

  contentTypes: ['Photo', 'Illustration', 'Vector'] as const,

  copySpaceOptions: ['None', 'Left', 'Right', 'Top', 'Bottom', 'Center'] as const,

  commercialUseCases: [
    'Advertising & Marketing',
    'Website Hero & UI',
    'Social Media Banner',
    'Presentation & Pitch Deck',
    'Packaging & Merchandising',
    'Editorial Concept',
    'Education & E-learning',
    'Corporate & B2B',
    'E-commerce Product Showcase',
    'Minimal Background'
  ] as const,

  checks: {
    metadataChecks: true,
    ipChecks: true,
    similarityChecks: true,
    aiLabelReminder: true,
    releaseReminder: true
  },

  complianceDisclaimer: 
    'Adobe Stock Compliance Check is an automated guidance assistant based on public stock guidelines. It does not predict or guarantee marketplace acceptance and is not legal advice. Always review assets before submission.'
};

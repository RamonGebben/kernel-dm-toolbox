/**
 * Where the rules and tables the catalog leans on are printed, so a summary
 * that says "the Armaments tables" can say where to find them. Page numbers
 * are for the 2024 printings; this is the one place to correct them.
 */

interface RuleSource {
  book: 'DMG' | 'PHB';
  page: number;
  /** A section's first page, where the tables run on over several. */
  isSectionStart?: boolean;
}

export const ruleSources = {
  /** The Arcana, Armaments, Implements and Relics tables, by rarity. */
  'random-magic-items': { book: 'DMG', page: 326, isSectionStart: true },
  /** The Magic Item Crafting Time and Cost table. */
  'crafting-magic-items': { book: 'DMG', page: 220 },
  poisons: { book: 'DMG', page: 90 },
  /** What each kind of Artisan's Tools can make. */
  tools: { book: 'PHB', page: 220, isSectionStart: true },
  /** Crafting nonmagical items: materials at half price, a day per 10 GP. */
  'crafting-equipment': { book: 'PHB', page: 233 },
  'scribing-spell-scrolls': { book: 'PHB', page: 233 },
} as const satisfies Record<string, RuleSource>;

export type RuleSourceKey = keyof typeof ruleSources;

/** "DMG p. 326", or "DMG from p. 326" for a section that runs on. */
export const cite = (key: RuleSourceKey): string => {
  const source: RuleSource = ruleSources[key];

  return `${source.book} ${source.isSectionStart ? 'from p.' : 'p.'} ${source.page}`;
};

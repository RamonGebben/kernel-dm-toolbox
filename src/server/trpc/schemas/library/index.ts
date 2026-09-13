import { z } from 'zod';

/** Free-text filter plus the facets the browser exposes. */
export const listCreaturesInputSchema = z.object({
  search: z.string().max(120).default(''),
  /** `Monsters` / `Animals`; empty means all. Custom creatures have no
   * category, so an active filter here excludes them from the merge. */
  category: z.string().max(60).optional(),
  /** Lowercased creature-type values (`dragon`, `undead`, …); empty means any. */
  types: z.array(z.string().max(60)).default([]),
  minChallengeRating: z.number().min(0).max(30).optional(),
  maxChallengeRating: z.number().min(0).max(30).optional(),
  /** Which table(s) to browse — the library, the DM's own creatures, or both. */
  source: z.enum(['library', 'custom', 'all']).default('all'),
  limit: z.number().int().min(1).max(500).default(500),
});

export type ListCreaturesInput = z.infer<typeof listCreaturesInputSchema>;

export const creatureSlugInputSchema = z.object({
  slug: z.string().min(1).max(200),
});

export type CreatureSlugInput = z.infer<typeof creatureSlugInputSchema>;

/** The spell list, for the quick-lookup tab. */
export const listSpellsInputSchema = z.object({
  search: z.string().max(120).default(''),
  /** Empty means "any level"; 0 is cantrips. */
  levels: z.array(z.number().int().min(0).max(9)).default([]),
  /** Upstream class slugs, e.g. `srd-2024_wizard`. Empty means "any class". */
  classSlugs: z.array(z.string().max(120)).default([]),
  limit: z.number().int().min(1).max(500).default(500),
});

export type ListSpellsInput = z.infer<typeof listSpellsInputSchema>;

export const spellSlugInputSchema = z.object({
  slug: z.string().min(1).max(200),
});

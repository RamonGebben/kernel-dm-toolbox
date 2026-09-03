import { z } from 'zod';

/** Free-text filter plus the facets the browser exposes. */
export const listCreaturesInputSchema = z.object({
  search: z.string().max(120).default(''),
  /** `Monsters` / `Animals`; empty means all. */
  category: z.string().max(60).optional(),
  type: z.string().max(60).optional(),
  minChallengeRating: z.number().min(0).max(30).optional(),
  maxChallengeRating: z.number().min(0).max(30).optional(),
  limit: z.number().int().min(1).max(500).default(500),
});

export type ListCreaturesInput = z.infer<typeof listCreaturesInputSchema>;

export const creatureSlugInputSchema = z.object({
  slug: z.string().min(1).max(200),
});

export type CreatureSlugInput = z.infer<typeof creatureSlugInputSchema>;

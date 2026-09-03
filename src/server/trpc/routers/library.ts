import { and, asc, gte, like, lte, eq, sql } from 'drizzle-orm';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  conditions,
  creatureActions,
  creatureTraits,
  creatures,
  importRuns,
} from '~/server/db/schema';
import {
  creatureSlugInputSchema,
  listCreaturesInputSchema,
} from '~/server/trpc/schemas/library';
import { buildStatblock } from '~/server/trpc/helpers/buildStatblock';
import { formatChallengeRating } from '~/utils/formatChallengeRating';
import { LIBRARY_ATTRIBUTION } from '~/server/library/source';

/**
 * Read-only access to the imported Open5e library.
 *
 * Resolvers here are thin: they query, then hand rows to a pure builder. The
 * derivation lives in `~/server/trpc/helpers/buildStatblock`.
 */
export const libraryRouter = createTRPCRouter({
  /**
   * Whether the library has been imported at all. The browser needs this to
   * tell "no results for your filter" apart from "you have never run the
   * import" (DECISIONS #12).
   */
  status: publicProcedure.query(async ({ ctx }) => {
    const [counts] = await ctx.db
      .select({ creatureCount: sql<number>`count(*)` })
      .from(creatures);

    const [lastRun] = await ctx.db
      .select()
      .from(importRuns)
      .orderBy(sql`${importRuns.startedAt} desc`)
      .limit(1);

    return {
      creatureCount: counts?.creatureCount ?? 0,
      isImported: (counts?.creatureCount ?? 0) > 0,
      lastImportedAt: lastRun?.finishedAt ?? null,
      lastImportRef: lastRun?.gitRef ?? null,
      lastImportError: lastRun?.error ?? null,
      attribution: LIBRARY_ATTRIBUTION,
    };
  }),

  listCreatures: publicProcedure
    .input(listCreaturesInputSchema)
    .query(async ({ ctx, input }) => {
      const filters = [
        input.search
          ? like(creatures.name, `%${input.search.trim()}%`)
          : undefined,
        input.category ? eq(creatures.category, input.category) : undefined,
        input.type ? eq(creatures.type, input.type) : undefined,
        input.minChallengeRating != null
          ? gte(creatures.challengeRating, input.minChallengeRating)
          : undefined,
        input.maxChallengeRating != null
          ? lte(creatures.challengeRating, input.maxChallengeRating)
          : undefined,
      ].filter(filter => filter !== undefined);

      const rows = await ctx.db
        .select({
          slug: creatures.slug,
          name: creatures.name,
          size: creatures.size,
          type: creatures.type,
          category: creatures.category,
          challengeRating: creatures.challengeRating,
          hitPoints: creatures.hitPoints,
          armorClass: creatures.armorClass,
          initiativeBonus: creatures.initiativeBonus,
        })
        .from(creatures)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(asc(creatures.name))
        .limit(input.limit);

      return rows.map(row => ({
        ...row,
        challengeRatingLabel: formatChallengeRating(row.challengeRating),
      }));
    }),

  /** The full statblock for the right-hand panel. */
  getCreature: publicProcedure
    .input(creatureSlugInputSchema)
    .query(async ({ ctx, input }) => {
      const creature = await ctx.db.query.creatures.findFirst({
        where: eq(creatures.slug, input.slug),
      });

      if (!creature) return null;

      const [traits, actions] = await Promise.all([
        ctx.db
          .select()
          .from(creatureTraits)
          .where(eq(creatureTraits.creatureSlug, input.slug))
          .orderBy(asc(creatureTraits.name)),
        ctx.db
          .select()
          .from(creatureActions)
          .where(eq(creatureActions.creatureSlug, input.slug))
          .orderBy(asc(creatureActions.sortOrder)),
      ]);

      return buildStatblock({ creature, traits, actions });
    }),

  /** The fifteen conditions, for the tag picker in a later milestone. */
  listConditions: publicProcedure.query(({ ctx }) =>
    ctx.db.select().from(conditions).orderBy(asc(conditions.name)),
  ),
});

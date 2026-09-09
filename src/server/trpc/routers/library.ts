import { and, asc, gte, inArray, like, lte, or, eq, sql } from 'drizzle-orm';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  conditions,
  creatureActions,
  creatureTraits,
  creatures,
  importRuns,
  spellCastingOptions,
  spells,
} from '~/server/db/schema';
import {
  creatureSlugInputSchema,
  listCreaturesInputSchema,
  listSpellsInputSchema,
  spellSlugInputSchema,
} from '~/server/trpc/schemas/library';
import { buildStatblock } from '~/server/trpc/helpers/buildStatblock';
import { buildSpellDetail } from '~/server/trpc/helpers/buildSpellDetail';
import { buildSpellClassOptions } from '~/server/trpc/helpers/buildSpellClassOptions';
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

    const [spellCounts] = await ctx.db
      .select({ spellCount: sql<number>`count(*)` })
      .from(spells);

    return {
      creatureCount: counts?.creatureCount ?? 0,
      spellCount: spellCounts?.spellCount ?? 0,
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

  /**
   * The classes that actually appear on an imported spell, for the class
   * filter's checkbox list. Derived from the data rather than a hardcoded
   * roster — see `buildSpellClassOptions`.
   */
  listSpellClasses: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select({ classes: spells.classes }).from(spells);
    return buildSpellClassOptions(rows.map(row => row.classes));
  }),

  /**
   * The spell list, summary fields only.
   *
   * `desc` is deliberately absent: it is by far the largest column, and a list
   * of 339 descriptions is a payload nobody reads. `getSpell` fetches the one
   * that is actually opened.
   */
  listSpells: publicProcedure
    .input(listSpellsInputSchema)
    .query(({ ctx, input }) => {
      const filters = [
        input.search
          ? like(spells.name, `%${input.search.trim()}%`)
          : undefined,
        input.levels.length ? inArray(spells.level, input.levels) : undefined,
        // `classes` is a JSON array; SQLite has no array containment operator,
        // so membership is tested with json_each rather than a LIKE over the
        // serialised text, which would match a class whose slug is a prefix of
        // another's. A spell matches if it has any of the selected classes.
        input.classSlugs.length
          ? or(
              ...input.classSlugs.map(
                classSlug =>
                  sql`exists (select 1 from json_each(${spells.classes}) where json_each.value = ${classSlug})`,
              ),
            )
          : undefined,
      ].filter(filter => filter !== undefined);

      return ctx.db
        .select({
          slug: spells.slug,
          name: spells.name,
          level: spells.level,
          school: spells.school,
          castingTime: spells.castingTime,
          rangeText: spells.rangeText,
          duration: spells.duration,
          concentration: spells.concentration,
          ritual: spells.ritual,
          classes: spells.classes,
          shapeType: spells.shapeType,
          shapeSize: spells.shapeSize,
          shapeSizeUnit: spells.shapeSizeUnit,
        })
        .from(spells)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(asc(spells.level), asc(spells.name))
        .limit(input.limit);
    }),

  /** One spell in full, with what changes at a higher slot. */
  getSpell: publicProcedure
    .input(spellSlugInputSchema)
    .query(async ({ ctx, input }) => {
      const spell = await ctx.db.query.spells.findFirst({
        where: eq(spells.slug, input.slug),
      });

      if (!spell) return null;

      const castingOptions = await ctx.db
        .select()
        .from(spellCastingOptions)
        .where(eq(spellCastingOptions.spellSlug, input.slug))
        .orderBy(asc(spellCastingOptions.type));

      return buildSpellDetail({ spell, castingOptions });
    }),
});

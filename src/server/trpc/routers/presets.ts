import { and, asc, eq, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  CURRENT_ENCOUNTER_ID,
  combatants,
  creatures,
  encounterPresetEntries,
  encounterPresets,
} from '~/server/db/schema';
import {
  presetIdInputSchema,
  savePresetInputSchema,
} from '~/server/trpc/schemas/presets';
import { ensureEncounter } from '~/server/encounter/state';
import { addCreaturesToEncounter } from '~/server/encounter/addCreatures';
import { publishEncounterChanged } from '~/server/encounter/events';
import { tombstoneSyncMeta } from '~/server/trpc/helpers/touchSyncMeta';
import { groupCreatureCounts } from '~/utils/groupCreatureCounts';
import { formatChallengeRating } from '~/utils/formatChallengeRating';
import type { Database } from '~/server/db';

const isLivePreset = isNull(encounterPresets.deletedAt);
const isLiveEntry = isNull(encounterPresetEntries.deletedAt);

const loadPreset = async (db: Database, id: string) => {
  const preset = await db.query.encounterPresets.findFirst({
    where: and(eq(encounterPresets.id, id), isLivePreset),
  });

  if (!preset) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That saved encounter no longer exists.',
    });
  }

  return preset;
};

/**
 * Saved encounters: named sets of monsters, ready to drop onto the board.
 *
 * The quick-add half of the Encounters tab. A preset is composition only — no
 * hit points, no initiative, no conditions — so applying one always produces a
 * fresh fight rather than restoring a half-finished one (DECISIONS #21).
 */
export const presetsRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const presets = await ctx.db
      .select()
      .from(encounterPresets)
      .where(isLivePreset)
      .orderBy(asc(encounterPresets.name));

    const entries = await ctx.db
      .select({
        presetId: encounterPresetEntries.presetId,
        creatureSlug: encounterPresetEntries.creatureSlug,
        count: encounterPresetEntries.count,
        sortOrder: encounterPresetEntries.sortOrder,
        name: creatures.name,
        challengeRating: creatures.challengeRating,
      })
      .from(encounterPresetEntries)
      .innerJoin(
        creatures,
        eq(encounterPresetEntries.creatureSlug, creatures.slug),
      )
      .where(isLiveEntry)
      .orderBy(asc(encounterPresetEntries.sortOrder));

    return presets.map(preset => {
      const own = entries.filter(entry => entry.presetId === preset.id);

      return {
        id: preset.id,
        name: preset.name,
        note: preset.note,
        createdAt: preset.createdAt,
        creatureCount: own.reduce((total, entry) => total + entry.count, 0),
        entries: own.map(({ presetId: _presetId, ...entry }) => ({
          ...entry,
          challengeRatingLabel: formatChallengeRating(entry.challengeRating),
        })),
      };
    });
  }),

  /**
   * Saves the monsters currently on the board.
   *
   * Player characters are excluded, not by filtering the input but because
   * `groupCreatureCounts` only counts rows that reference the library. The
   * party is a roster that outlives every fight.
   */
  saveCurrent: publicProcedure
    .input(savePresetInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureEncounter(ctx.db);

      const present = await ctx.db
        .select({ creatureSlug: combatants.creatureSlug })
        .from(combatants)
        .where(
          and(
            eq(combatants.encounterId, CURRENT_ENCOUNTER_ID),
            isNull(combatants.deletedAt),
          ),
        )
        .orderBy(asc(combatants.sortOrder));

      const counts = groupCreatureCounts(present);

      if (!counts.length) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'There are no creatures on the board to save.',
        });
      }

      const [preset] = await ctx.db
        .insert(encounterPresets)
        .values({ name: input.name, note: input.note ?? null })
        .returning();

      await ctx.db.insert(encounterPresetEntries).values(
        counts.map(entry => ({
          presetId: preset.id,
          creatureSlug: entry.creatureSlug,
          count: entry.count,
          sortOrder: entry.sortOrder,
        })),
      );

      return preset;
    }),

  /** Drops the whole set onto the board, on top of whatever is already there. */
  addToEncounter: publicProcedure
    .input(presetIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const preset = await loadPreset(ctx.db, input.id);
      await ensureEncounter(ctx.db);

      const entries = await ctx.db
        .select()
        .from(encounterPresetEntries)
        .where(and(eq(encounterPresetEntries.presetId, preset.id), isLiveEntry))
        .orderBy(asc(encounterPresetEntries.sortOrder));

      // Sequential on purpose: each creature's auto-numbering reads the names
      // already on the board, so adding them in parallel would race for
      // "Goblin 3" and produce duplicates.
      let addedCount = 0;
      for (const entry of entries) {
        const created = await addCreaturesToEncounter(ctx.db, {
          slug: entry.creatureSlug,
          count: entry.count,
        });
        addedCount += created.length;
      }

      publishEncounterChanged();

      return { addedCount };
    }),

  remove: publicProcedure
    .input(presetIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const preset = await loadPreset(ctx.db, input.id);

      await ctx.db
        .update(encounterPresets)
        .set(tombstoneSyncMeta({ version: preset.version, now: new Date() }))
        .where(eq(encounterPresets.id, preset.id));

      return { id: preset.id };
    }),
});

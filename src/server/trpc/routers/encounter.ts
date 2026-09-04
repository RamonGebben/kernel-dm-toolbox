import { and, eq, isNull, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  CURRENT_ENCOUNTER_ID,
  combatants,
  creatures,
  encounters,
  playerCharacters,
} from '~/server/db/schema';
import {
  addCharacterInputSchema,
  addCreatureInputSchema,
  adjustHitPointsInputSchema,
  combatantIdInputSchema,
  updateCombatantInputSchema,
} from '~/server/trpc/schemas/encounter';
import { ensureEncounter, readEncounterState } from '~/server/encounter/state';
import { publishEncounterChanged } from '~/server/encounter/events';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';
import { buildCombatantNames } from '~/utils/buildCombatantNames';
import { rollInitiative } from '~/utils/rollDice';
import {
  applyDamage,
  applyHealing,
  applyTemporaryHitPoints,
} from '~/utils/applyDamage';
import type { Database } from '~/server/db';

const isLive = isNull(combatants.deletedAt);

const inCurrentEncounter = and(
  eq(combatants.encounterId, CURRENT_ENCOUNTER_ID),
  isLive,
);

const loadCombatant = async (db: Database, id: string) => {
  const combatant = await db.query.combatants.findFirst({
    where: and(eq(combatants.id, id), isLive),
  });

  if (!combatant) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That combatant is no longer in the encounter.',
    });
  }

  return combatant;
};

/** Appended below everything currently present, so ties keep insertion order. */
const nextSortOrder = async (db: Database): Promise<number> => {
  const [row] = await db
    .select({ highest: sql<number | null>`max(${combatants.sortOrder})` })
    .from(combatants)
    .where(inCurrentEncounter);

  return (row?.highest ?? -1) + 1;
};

export const encounterRouter = createTRPCRouter({
  get: publicProcedure.query(({ ctx }) => readEncounterState(ctx.db)),

  /**
   * Adds monsters. Each one is its own row with its own initiative roll and
   * its own hit points, auto-numbered so they can be told apart.
   */
  addCreature: publicProcedure
    .input(addCreatureInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureEncounter(ctx.db);

      const creature = await ctx.db.query.creatures.findFirst({
        where: eq(creatures.slug, input.slug),
      });

      if (!creature) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That creature is not in the library.',
        });
      }

      const existing = await ctx.db
        .select({ displayName: combatants.displayName })
        .from(combatants)
        .where(inCurrentEncounter);

      const names = buildCombatantNames({
        baseName: creature.name,
        count: input.count,
        existingNames: existing.map(row => row.displayName),
      });

      const startOrder = await nextSortOrder(ctx.db);

      const created = await ctx.db
        .insert(combatants)
        .values(
          names.map((displayName, index) => ({
            encounterId: CURRENT_ENCOUNTER_ID,
            creatureSlug: creature.slug,
            displayName,
            // Monsters roll for themselves; the book average is the starting
            // hit point total and stays editable.
            initiative: rollInitiative(creature.initiativeBonus),
            currentHitPoints: creature.hitPoints,
            maxHitPoints: creature.hitPoints,
            armorClass: creature.armorClass,
            sortOrder: startOrder + index,
          })),
        )
        .returning();

      publishEncounterChanged();

      return created;
    }),

  /** Adds a party member at the initiative the player rolled. */
  addCharacter: publicProcedure
    .input(addCharacterInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureEncounter(ctx.db);

      const character = await ctx.db.query.playerCharacters.findFirst({
        where: and(
          eq(playerCharacters.id, input.playerCharacterId),
          isNull(playerCharacters.deletedAt),
        ),
      });

      if (!character) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That character is not on the roster.',
        });
      }

      const alreadyPresent = await ctx.db.query.combatants.findFirst({
        where: and(
          eq(combatants.playerCharacterId, character.id),
          eq(combatants.encounterId, CURRENT_ENCOUNTER_ID),
          isLive,
        ),
      });

      if (alreadyPresent) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `${character.name} is already in the encounter.`,
        });
      }

      const [created] = await ctx.db
        .insert(combatants)
        .values({
          encounterId: CURRENT_ENCOUNTER_ID,
          playerCharacterId: character.id,
          displayName: character.name,
          initiative: input.initiative,
          currentHitPoints: character.maxHitPoints,
          maxHitPoints: character.maxHitPoints,
          armorClass: character.armorClass,
          sortOrder: await nextSortOrder(ctx.db),
        })
        .returning();

      publishEncounterChanged();

      return created;
    }),

  update: publicProcedure
    .input(updateCombatantInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadCombatant(ctx.db, input.id);
      const { id, ...changes } = input;

      const [updated] = await ctx.db
        .update(combatants)
        .set({
          ...changes,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(combatants.id, id))
        .returning();

      publishEncounterChanged();

      return updated;
    }),

  damage: publicProcedure
    .input(adjustHitPointsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadCombatant(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(combatants)
        .set({
          ...applyDamage(existing, input.amount),
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(combatants.id, input.id))
        .returning();

      publishEncounterChanged();

      return updated;
    }),

  heal: publicProcedure
    .input(adjustHitPointsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadCombatant(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(combatants)
        .set({
          ...applyHealing(existing, input.amount),
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(combatants.id, input.id))
        .returning();

      publishEncounterChanged();

      return updated;
    }),

  grantTemporaryHitPoints: publicProcedure
    .input(adjustHitPointsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadCombatant(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(combatants)
        .set({
          ...applyTemporaryHitPoints(existing, input.amount),
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(combatants.id, input.id))
        .returning();

      publishEncounterChanged();

      return updated;
    }),

  remove: publicProcedure
    .input(combatantIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadCombatant(ctx.db, input.id);

      await ctx.db
        .update(combatants)
        .set(tombstoneSyncMeta({ version: existing.version, now: new Date() }))
        .where(eq(combatants.id, input.id));

      await clearActiveIfRemoved(ctx.db, input.id);
      publishEncounterChanged();

      return { id: input.id };
    }),

  /**
   * Between fights: the monsters go, the party stays. The single most-used
   * action in the whole tool, and the reason player characters are their own
   * table rather than just more combatants.
   */
  clearNonPlayerCombatants: publicProcedure.mutation(async ({ ctx }) => {
    const doomed = await ctx.db
      .select({ id: combatants.id, version: combatants.version })
      .from(combatants)
      .where(and(inCurrentEncounter, isNull(combatants.playerCharacterId)));

    const now = new Date();

    await Promise.all(
      doomed.map(combatant =>
        ctx.db
          .update(combatants)
          .set(tombstoneSyncMeta({ version: combatant.version, now }))
          .where(eq(combatants.id, combatant.id)),
      ),
    );

    // The fight is over: reset the round and the turn pointer too.
    await ctx.db
      .update(encounters)
      .set({ roundNumber: 0, activeCombatantId: null })
      .where(eq(encounters.id, CURRENT_ENCOUNTER_ID));

    publishEncounterChanged();

    return { removedCount: doomed.length };
  }),
});

/** A removed combatant must not stay the active one. */
const clearActiveIfRemoved = async (db: Database, removedId: string) => {
  await db
    .update(encounters)
    .set({ activeCombatantId: null })
    .where(
      and(
        eq(encounters.id, CURRENT_ENCOUNTER_ID),
        eq(encounters.activeCombatantId, removedId),
      ),
    );
};

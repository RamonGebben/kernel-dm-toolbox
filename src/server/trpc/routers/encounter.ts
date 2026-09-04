import { and, eq, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  CURRENT_ENCOUNTER_ID,
  combatantConditions,
  combatants,
  conditions,
  encounters,
  playerCharacters,
} from '~/server/db/schema';
import {
  addCharacterInputSchema,
  addConditionInputSchema,
  addCreatureInputSchema,
  adjustHitPointsInputSchema,
  combatantIdInputSchema,
  conditionIdInputSchema,
  startEncounterInputSchema,
  updateCombatantInputSchema,
} from '~/server/trpc/schemas/encounter';
import { ensureEncounter, readEncounterState } from '~/server/encounter/state';
import {
  addCreaturesToEncounter,
  nextSortOrder,
} from '~/server/encounter/addCreatures';
import { publishEncounterChanged } from '~/server/encounter/events';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';
import { tickConditions } from '~/utils/tickConditions';
import {
  nextRoundNumber,
  nextTurn,
  previousTurn,
} from '~/utils/sortCombatants';
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

      const created = await addCreaturesToEncounter(ctx.db, input);

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
   * Applies a condition, optionally with a countdown. Re-applying the same
   * condition refreshes its duration rather than stacking a second copy —
   * two Poisoned rows on one creature mean nothing.
   */
  addCondition: publicProcedure
    .input(addConditionInputSchema)
    .mutation(async ({ ctx, input }) => {
      await loadCombatant(ctx.db, input.combatantId);

      const condition = await ctx.db.query.conditions.findFirst({
        where: eq(conditions.slug, input.conditionSlug),
      });

      if (!condition) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That condition is not in the library.',
        });
      }

      const existing = await ctx.db.query.combatantConditions.findFirst({
        where: and(
          eq(combatantConditions.combatantId, input.combatantId),
          eq(combatantConditions.conditionSlug, input.conditionSlug),
          isNull(combatantConditions.deletedAt),
        ),
      });

      if (existing) {
        const [refreshed] = await ctx.db
          .update(combatantConditions)
          .set({
            roundsRemaining: input.roundsRemaining ?? null,
            note: input.note || null,
            ...touchSyncMeta({ version: existing.version, now: new Date() }),
          })
          .where(eq(combatantConditions.id, existing.id))
          .returning();

        publishEncounterChanged();
        return refreshed;
      }

      const [created] = await ctx.db
        .insert(combatantConditions)
        .values({
          combatantId: input.combatantId,
          conditionSlug: input.conditionSlug,
          roundsRemaining: input.roundsRemaining ?? null,
          note: input.note || null,
        })
        .returning();

      publishEncounterChanged();

      return created;
    }),

  removeCondition: publicProcedure
    .input(conditionIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.combatantConditions.findFirst({
        where: and(
          eq(combatantConditions.id, input.id),
          isNull(combatantConditions.deletedAt),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That condition is no longer applied.',
        });
      }

      await ctx.db
        .update(combatantConditions)
        .set(tombstoneSyncMeta({ version: existing.version, now: new Date() }))
        .where(eq(combatantConditions.id, input.id));

      publishEncounterChanged();

      return { id: input.id };
    }),

  /**
   * "Roll for initiative": writes the whole order and opens round one.
   *
   * The initiatives arrive together rather than one at a time because that is
   * how the table settles them — the DM asks each player what they rolled,
   * types it in, and the fight begins. The turn pointer lands on whoever ends
   * up at the top of the resulting order, which is why it is read back after
   * the write rather than computed from the input.
   */
  start: publicProcedure
    .input(startEncounterInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureEncounter(ctx.db);

      const now = new Date();
      const present = await ctx.db
        .select({ id: combatants.id, version: combatants.version })
        .from(combatants)
        .where(inCurrentEncounter);

      if (!present.length) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Add someone to the encounter before starting it.',
        });
      }

      const versions = new Map(present.map(row => [row.id, row.version]));

      await Promise.all(
        input.initiatives
          .filter(entry => versions.has(entry.id))
          .map(entry =>
            ctx.db
              .update(combatants)
              .set({
                initiative: entry.initiative,
                // A fight that is starting has nobody holding their action.
                isDelayed: false,
                ...touchSyncMeta({ version: versions.get(entry.id)!, now }),
              })
              .where(eq(combatants.id, entry.id)),
          ),
      );

      const state = await readEncounterState(ctx.db);
      const { activeId } = nextTurn(state.combatants, null);

      await ctx.db
        .update(encounters)
        .set({ roundNumber: 1, activeCombatantId: activeId })
        .where(eq(encounters.id, CURRENT_ENCOUNTER_ID));

      publishEncounterChanged();

      return { roundNumber: 1, activeCombatantId: activeId };
    }),

  /**
   * The fight is over, but the board stays.
   *
   * Deliberately separate from `clearNonPlayerCombatants`: ending combat is
   * something a DM does the moment the last enemy drops, while the monsters'
   * corpses are still worth looking at for loot and for the XP readout. The
   * two used to be the same action, which meant the only way to stop the round
   * counter was to throw the encounter away.
   */
  end: publicProcedure.mutation(async ({ ctx }) => {
    await ensureEncounter(ctx.db);

    const now = new Date();
    const delayed = await ctx.db
      .select({ id: combatants.id, version: combatants.version })
      .from(combatants)
      .where(and(inCurrentEncounter, eq(combatants.isDelayed, true)));

    // Holding your action means nothing once there is no order to re-enter.
    await Promise.all(
      delayed.map(combatant =>
        ctx.db
          .update(combatants)
          .set({
            isDelayed: false,
            ...touchSyncMeta({ version: combatant.version, now }),
          })
          .where(eq(combatants.id, combatant.id)),
      ),
    );

    await ctx.db
      .update(encounters)
      .set({ roundNumber: 0, activeCombatantId: null })
      .where(eq(encounters.id, CURRENT_ENCOUNTER_ID));

    publishEncounterChanged();

    return { roundNumber: 0, activeCombatantId: null };
  }),

  /** Advance to the next combatant, rolling the round over at the top. */
  nextTurn: publicProcedure.mutation(({ ctx }) =>
    advanceTurn(ctx.db, 'forward'),
  ),

  /** Step back, for when a turn was advanced by mistake. */
  previousTurn: publicProcedure.mutation(({ ctx }) =>
    advanceTurn(ctx.db, 'backward'),
  ),

  /**
   * Delay: the combatant steps out of the order and re-enters wherever the DM
   * puts them. Their initiative is left alone so undoing is free.
   */
  toggleDelay: publicProcedure
    .input(combatantIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadCombatant(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(combatants)
        .set({
          isDelayed: !existing.isDelayed,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(combatants.id, input.id))
        .returning();

      // A delayed combatant is out of the order, so it cannot hold the turn.
      if (updated?.isDelayed) await clearActiveIfRemoved(ctx.db, input.id);

      publishEncounterChanged();

      return updated;
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

/**
 * Moves the turn pointer and keeps the round counter in step.
 *
 * The ordering itself is pure and tested in `~/utils/sortCombatants`; this
 * only reads state, applies it, and writes the result back.
 */
const advanceTurn = async (db: Database, direction: 'forward' | 'backward') => {
  const state = await readEncounterState(db);
  const step = direction === 'forward' ? nextTurn : previousTurn;
  const { activeId, didWrap } = step(state.combatants, state.activeCombatantId);

  const roundNumber = nextRoundNumber({
    roundNumber: state.roundNumber,
    didWrap,
    direction,
  });

  // Durations tick with the round, so only a forward wrap counts one down.
  if (didWrap && direction === 'forward' && state.roundNumber > 0) {
    await tickConditionDurations(db);
  }

  await db
    .update(encounters)
    .set({ activeCombatantId: activeId, roundNumber })
    .where(eq(encounters.id, CURRENT_ENCOUNTER_ID));

  publishEncounterChanged();

  return { activeCombatantId: activeId, roundNumber };
};

/**
 * Counts every live condition down one round, clearing the ones that ran out.
 *
 * The arithmetic itself is pure and tested in `~/utils/tickConditions`; this
 * only reads, applies and writes.
 */
const tickConditionDurations = async (db: Database) => {
  const applied = await db
    .select()
    .from(combatantConditions)
    .where(isNull(combatantConditions.deletedAt));

  const { remaining, expired } = tickConditions(applied);
  const now = new Date();

  await Promise.all([
    ...remaining
      .filter(condition => condition.roundsRemaining !== null)
      .map(condition =>
        db
          .update(combatantConditions)
          .set({
            roundsRemaining: condition.roundsRemaining,
            ...touchSyncMeta({ version: condition.version, now }),
          })
          .where(eq(combatantConditions.id, condition.id)),
      ),
    ...expired.map(condition =>
      db
        .update(combatantConditions)
        .set(tombstoneSyncMeta({ version: condition.version, now }))
        .where(eq(combatantConditions.id, condition.id)),
    ),
  ]);
};

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

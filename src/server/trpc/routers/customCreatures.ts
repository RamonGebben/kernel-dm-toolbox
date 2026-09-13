import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  customCreatureActionAttacks,
  customCreatureActions,
  customCreatureTraits,
  customCreatures,
} from '~/server/db/schema';
import {
  createCustomCreatureInputSchema,
  customCreatureIdInputSchema,
  updateCustomCreatureInputSchema,
} from '~/server/trpc/schemas/customCreatures';
import type {
  CustomCreatureActionInput,
  CustomCreatureTraitInput,
} from '~/server/trpc/schemas/customCreatures';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';
import { toCustomCreatureRow } from '~/server/trpc/helpers/toCustomCreatureRow';
import { toCustomCreatureStatblockSource } from '~/server/trpc/helpers/toCustomCreatureStatblockSource';
import { buildStatblock } from '~/server/trpc/helpers/buildStatblock';
import { formatChallengeRating } from '~/utils/formatChallengeRating';
import type { Database } from '~/server/db';

const isLive = isNull(customCreatures.deletedAt);

const loadLiveCustomCreature = async (db: Database, id: string) => {
  const creature = await db.query.customCreatures.findFirst({
    where: and(eq(customCreatures.id, id), isLive),
  });

  if (!creature) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That custom creature no longer exists.',
    });
  }

  return creature;
};

/**
 * Replaces every trait/action(+attack) row for a custom creature in one go.
 * They are never referenced from anywhere except their parent row, so a full
 * replace on every save is simpler and just as safe as diffing.
 */
const replaceChildRows = async (
  db: Database,
  customCreatureId: string,
  traits: readonly CustomCreatureTraitInput[],
  actions: readonly CustomCreatureActionInput[],
) => {
  await db
    .delete(customCreatureTraits)
    .where(eq(customCreatureTraits.customCreatureId, customCreatureId));
  // Attacks cascade-delete with their parent action at the DB level.
  await db
    .delete(customCreatureActions)
    .where(eq(customCreatureActions.customCreatureId, customCreatureId));

  if (traits.length) {
    await db.insert(customCreatureTraits).values(
      traits.map(trait => ({
        customCreatureId,
        name: trait.name,
        desc: trait.desc,
        type: trait.type ?? null,
      })),
    );
  }

  for (const [index, action] of actions.entries()) {
    const [createdAction] = await db
      .insert(customCreatureActions)
      .values({
        customCreatureId,
        name: action.name,
        desc: action.desc,
        actionType: action.actionType,
        sortOrder: index,
        legendaryActionCost: action.legendaryActionCost ?? null,
      })
      .returning();

    if (action.attack && createdAction) {
      const { attack } = action;

      await db.insert(customCreatureActionAttacks).values({
        customCreatureActionId: createdAction.id,
        name: attack.name,
        attackType: attack.attackType ?? null,
        toHitMod: attack.toHitMod ?? null,
        reach: attack.reach ?? null,
        range: attack.range ?? null,
        longRange: attack.longRange ?? null,
        targetCreatureOnly: attack.targetCreatureOnly,
        damageDieCount: attack.damageDieCount ?? null,
        damageDieType: attack.damageDieType ?? null,
        damageBonus: attack.damageBonus ?? null,
        damageType: attack.damageType ?? null,
        extraDamageDieCount: attack.extraDamageDieCount ?? null,
        extraDamageDieType: attack.extraDamageDieType ?? null,
        extraDamageBonus: attack.extraDamageBonus ?? null,
        extraDamageType: attack.extraDamageType ?? null,
      });
    }
  }
};

/**
 * DM-authored ("homebrew") creatures, alongside the read-only Open5e
 * library. Mirrors `charactersRouter`'s CRUD shape; `get` additionally
 * builds a `Statblock` so `StatblockView` renders a custom creature exactly
 * like a library one.
 */
export const customCreaturesRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: customCreatures.id,
        name: customCreatures.name,
        size: customCreatures.size,
        type: customCreatures.type,
        challengeRating: customCreatures.challengeRating,
        hitPoints: customCreatures.hitPoints,
        armorClass: customCreatures.armorClass,
        initiativeBonus: customCreatures.initiativeBonus,
      })
      .from(customCreatures)
      .where(isLive)
      .orderBy(asc(customCreatures.name));

    return rows.map(row => ({
      ...row,
      challengeRatingLabel: formatChallengeRating(row.challengeRating),
    }));
  }),

  get: publicProcedure
    .input(customCreatureIdInputSchema)
    .query(async ({ ctx, input }) => {
      const customCreature = await ctx.db.query.customCreatures.findFirst({
        where: and(eq(customCreatures.id, input.id), isLive),
      });

      if (!customCreature) return null;

      const [traits, actions] = await Promise.all([
        ctx.db
          .select()
          .from(customCreatureTraits)
          .where(eq(customCreatureTraits.customCreatureId, input.id))
          .orderBy(asc(customCreatureTraits.name)),
        ctx.db
          .select()
          .from(customCreatureActions)
          .where(eq(customCreatureActions.customCreatureId, input.id))
          .orderBy(asc(customCreatureActions.sortOrder)),
      ]);

      const source = toCustomCreatureStatblockSource({
        customCreature,
        traits,
        actions,
      });

      return buildStatblock(source);
    }),

  /**
   * The raw row, traits, and actions+attacks for one custom creature —
   * unlike `get`, nothing here is derived. Feeds both the "New Creature"
   * wizard's copy-from-custom step and the statblock panel's edit flow,
   * neither of which can work from `Statblock`'s display-ready prose.
   */
  getRaw: publicProcedure
    .input(customCreatureIdInputSchema)
    .query(async ({ ctx, input }) => {
      const customCreature = await ctx.db.query.customCreatures.findFirst({
        where: and(eq(customCreatures.id, input.id), isLive),
      });

      if (!customCreature) return null;

      const [traits, actions] = await Promise.all([
        ctx.db
          .select()
          .from(customCreatureTraits)
          .where(eq(customCreatureTraits.customCreatureId, input.id))
          .orderBy(asc(customCreatureTraits.name)),
        ctx.db
          .select()
          .from(customCreatureActions)
          .where(eq(customCreatureActions.customCreatureId, input.id))
          .orderBy(asc(customCreatureActions.sortOrder)),
      ]);

      const attacks = actions.length
        ? await ctx.db
            .select()
            .from(customCreatureActionAttacks)
            .where(
              inArray(
                customCreatureActionAttacks.customCreatureActionId,
                actions.map(action => action.id),
              ),
            )
        : [];

      return {
        customCreature,
        traits,
        actions: actions.map(action => ({
          ...action,
          attack:
            attacks.find(
              attack => attack.customCreatureActionId === action.id,
            ) ?? null,
        })),
      };
    }),

  create: publicProcedure
    .input(createCustomCreatureInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { traits, actions, ...fields } = input;

      const [created] = await ctx.db
        .insert(customCreatures)
        .values(toCustomCreatureRow(fields))
        .returning();

      if (!created) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Could not create that creature.',
        });
      }

      await replaceChildRows(ctx.db, created.id, traits, actions);

      return created;
    }),

  update: publicProcedure
    .input(updateCustomCreatureInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadLiveCustomCreature(ctx.db, input.id);
      const { id, traits, actions, ...fields } = input;

      const [updated] = await ctx.db
        .update(customCreatures)
        .set({
          ...toCustomCreatureRow(fields),
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(customCreatures.id, id))
        .returning();

      await replaceChildRows(ctx.db, id, traits, actions);

      return updated;
    }),

  /** Soft delete. There is no hard delete anywhere in this app. */
  remove: publicProcedure
    .input(customCreatureIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadLiveCustomCreature(ctx.db, input.id);

      await ctx.db
        .update(customCreatures)
        .set(tombstoneSyncMeta({ version: existing.version, now: new Date() }))
        .where(eq(customCreatures.id, input.id));

      return { id: input.id };
    }),
});

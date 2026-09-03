import { and, asc, eq, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import { playerCharacters } from '~/server/db/schema';
import {
  characterIdInputSchema,
  createCharacterInputSchema,
  updateCharacterInputSchema,
} from '~/server/trpc/schemas/characters';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';

/** Live rows only — a tombstoned character is gone as far as the app cares. */
const isLive = isNull(playerCharacters.deletedAt);

export const charactersRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(playerCharacters)
      .where(isLive)
      .orderBy(asc(playerCharacters.name)),
  ),

  create: publicProcedure
    .input(createCharacterInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(playerCharacters)
        .values({
          name: input.name,
          playerName: input.playerName || null,
          armorClass: input.armorClass,
          maxHitPoints: input.maxHitPoints,
          initiativeModifier: input.initiativeModifier,
          level: input.level,
        })
        .returning();

      return created;
    }),

  update: publicProcedure
    .input(updateCharacterInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.playerCharacters.findFirst({
        where: and(eq(playerCharacters.id, input.id), isLive),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That character no longer exists.',
        });
      }

      const [updated] = await ctx.db
        .update(playerCharacters)
        .set({
          name: input.name,
          playerName: input.playerName || null,
          armorClass: input.armorClass,
          maxHitPoints: input.maxHitPoints,
          initiativeModifier: input.initiativeModifier,
          level: input.level,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(playerCharacters.id, input.id))
        .returning();

      return updated;
    }),

  /** Soft delete. There is no hard delete anywhere in this app. */
  remove: publicProcedure
    .input(characterIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.playerCharacters.findFirst({
        where: and(eq(playerCharacters.id, input.id), isLive),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That character no longer exists.',
        });
      }

      await ctx.db
        .update(playerCharacters)
        .set(tombstoneSyncMeta({ version: existing.version, now: new Date() }))
        .where(eq(playerCharacters.id, input.id));

      return { id: input.id };
    }),
});

import { and, asc, eq, isNull } from 'drizzle-orm';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import { bastions, playerCharacters } from '~/server/db/schema';
import {
  characterIdInputSchema,
  createCharacterInputSchema,
  setCharacterActiveInputSchema,
  updateCharacterInputSchema,
} from '~/server/trpc/schemas/characters';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';
import { toCharacterColumns } from '~/server/trpc/helpers/toCharacterColumns';
import { abandonBastion, loadLiveCharacter } from '~/server/bastions/rows';

/** Live rows only — a tombstoned character is gone as far as the app cares. */
const isLive = isNull(playerCharacters.deletedAt);

export const charactersRouter = createTRPCRouter({
  /**
   * Every member, benched ones included — the Party page shows both, and the
   * tracker's pick list filters to `isActive` itself.
   */
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
        .values(toCharacterColumns(input))
        .returning();

      return created;
    }),

  update: publicProcedure
    .input(updateCharacterInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadLiveCharacter(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(playerCharacters)
        .set({
          ...toCharacterColumns(input),
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(playerCharacters.id, input.id))
        .returning();

      return updated;
    }),

  setActive: publicProcedure
    .input(setCharacterActiveInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadLiveCharacter(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(playerCharacters)
        .set({
          isActive: input.isActive,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(playerCharacters.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Soft delete. There is no hard delete anywhere in this app. A character's
   * own bastion goes with them — abandoned, its construction refunded — so it
   * cannot linger ownerless. What they held in the party's bastion stays
   * there; splitting it later hands that to the keeper.
   */
  remove: publicProcedure
    .input(characterIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadLiveCharacter(ctx.db, input.id);
      const now = new Date();

      const ownBastion = await ctx.db.query.bastions.findFirst({
        where: and(
          eq(bastions.ownerCharacterId, existing.id),
          isNull(bastions.deletedAt),
        ),
      });
      if (ownBastion) await abandonBastion(ctx.db, ownBastion, now);

      await ctx.db
        .update(playerCharacters)
        .set(tombstoneSyncMeta({ version: existing.version, now }))
        .where(eq(playerCharacters.id, input.id));

      return { id: input.id };
    }),
});

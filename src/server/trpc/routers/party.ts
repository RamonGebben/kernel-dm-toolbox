import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import { CURRENT_PARTY_ID, parties } from '~/server/db/schema';
import { adjustTreasuryInputSchema } from '~/server/trpc/schemas/party';
import { ensureParty } from '~/server/party/state';
import { touchSyncMeta } from '~/server/trpc/helpers/touchSyncMeta';
import { applyGoldChange } from '~/utils/applyGoldChange';

/**
 * What belongs to the party as a whole. Its members are `characters.*`; this
 * router holds the group's own state — for now, the shared treasury.
 */
export const partyRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    const party = await ensureParty(ctx.db);

    return { treasuryGold: party.treasuryGold };
  }),

  adjustTreasury: publicProcedure
    .input(adjustTreasuryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const party = await ensureParty(ctx.db);
      const change = applyGoldChange(party.treasuryGold, input.delta);

      if (!change.ok) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The treasury does not hold that much gold.',
        });
      }

      const [updated] = await ctx.db
        .update(parties)
        .set({
          treasuryGold: change.balance,
          ...touchSyncMeta({ version: party.version, now: new Date() }),
        })
        .where(eq(parties.id, CURRENT_PARTY_ID))
        .returning();

      return { treasuryGold: updated!.treasuryGold };
    }),
});

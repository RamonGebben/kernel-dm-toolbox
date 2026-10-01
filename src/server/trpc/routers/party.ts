import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import { adjustTreasuryInputSchema } from '~/server/trpc/schemas/party';
import { ensureParty } from '~/server/party/state';
import { changeTreasury } from '~/server/party/treasury';

/**
 * What belongs to the party as a whole. Its members are `characters.*`; this
 * router holds the group's own state — for now, the shared treasury.
 */
export const partyRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    const party = await ensureParty(ctx.db);

    return {
      treasuryGold: party.treasuryGold,
      bastionMode: party.bastionMode,
    };
  }),

  /**
   * A relative, guarded write — never read-then-write an absolute balance,
   * or a turn commit or construction spend landing in between is undone.
   */
  adjustTreasury: publicProcedure
    .input(adjustTreasuryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const treasuryGold = await changeTreasury(ctx.db, input.delta);

      if (treasuryGold === null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The treasury does not hold that much gold.',
        });
      }

      return { treasuryGold };
    }),
});

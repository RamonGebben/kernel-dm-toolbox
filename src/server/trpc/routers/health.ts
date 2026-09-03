import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import { buildPingResult } from '~/server/trpc/helpers/buildPingResult';
import { pingInputSchema } from '~/server/trpc/schemas/health';

/**
 * The reference implementation for every future router: input comes from a
 * named schema, the resolver does I/O and clock access only, and the logic
 * itself lives in a pure helper.
 */
export const healthRouter = createTRPCRouter({
  ping: publicProcedure.input(pingInputSchema).query(({ input, ctx }) =>
    buildPingResult({
      input,
      campaignName: ctx.campaignName,
      now: new Date(),
    }),
  ),
});

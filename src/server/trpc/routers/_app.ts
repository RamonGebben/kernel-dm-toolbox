import { createTRPCRouter } from '~/server/trpc/init';
import { healthRouter } from '~/server/trpc/routers/health';

/**
 * The root router. One domain router per file beside this one; register it
 * here and nowhere else.
 */
export const appRouter = createTRPCRouter({
  health: healthRouter,
});

/**
 * Crosses the server/client boundary as a **type-only** import so no server
 * code is ever pulled into the browser bundle.
 */
export type AppRouter = typeof appRouter;

import { createTRPCRouter } from '~/server/trpc/init';
import { healthRouter } from '~/server/trpc/routers/health';
import { libraryRouter } from '~/server/trpc/routers/library';
import { charactersRouter } from '~/server/trpc/routers/characters';
import { encounterRouter } from '~/server/trpc/routers/encounter';
import { presetsRouter } from '~/server/trpc/routers/presets';

/**
 * The root router. One domain router per file beside this one; register it
 * here and nowhere else.
 */
export const appRouter = createTRPCRouter({
  health: healthRouter,
  library: libraryRouter,
  characters: charactersRouter,
  encounter: encounterRouter,
  presets: presetsRouter,
});

/**
 * Crosses the server/client boundary as a **type-only** import so no server
 * code is ever pulled into the browser bundle.
 */
export type AppRouter = typeof appRouter;

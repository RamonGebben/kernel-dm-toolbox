import 'server-only';

import { sql } from 'drizzle-orm';
import { creatures } from '~/server/db/schema';
import { getDb } from '~/server/db';
import { importLibrary } from '~/server/library/importLibrary';
import { env } from '~/env';

export type SeedOutcome =
  'disabled' | 'already-imported' | 'imported' | 'failed';

/**
 * Fills an empty library on first boot.
 *
 * The library cannot be baked into the image: it lives in the campaign
 * database, and that database is a volume created at `docker run` time. So a
 * fresh container has migrations but no creatures, and `pnpm db:import` is not
 * something a user who only has Docker can reasonably be asked to run inside
 * the container. Boot is the one moment where the volume exists and the app is
 * in charge.
 *
 * Guarded by a row count rather than a marker, so it is idempotent and costs a
 * single `count(*)` on every subsequent boot. The guard is "is it empty", not
 * "is it stale" — refreshing an existing library stays a deliberate
 * `pnpm db:import`. Set `LIBRARY_AUTO_IMPORT=false` for an instance that must
 * not reach the network at startup.
 */
export const seedLibraryIfEmpty = async (): Promise<SeedOutcome> => {
  if (env.LIBRARY_AUTO_IMPORT === 'false') return 'disabled';

  const db = getDb();
  const [row] = await db
    .select({ creatureCount: sql<number>`count(*)` })
    .from(creatures);

  if ((row?.creatureCount ?? 0) > 0) return 'already-imported';

  console.log('[library] empty on this instance — importing from Open5e');

  try {
    const result = await importLibrary({
      db,
      onProgress: message => console.log(`[library] ${message}`),
    });

    console.log(
      `[library] imported ${result.creatureCount} creatures and ${result.conditionCount} conditions`,
    );

    return 'imported';
  } catch (error) {
    // A failed import must not take the server down with it. The creature
    // browser already has an explanatory empty state, and the failure is
    // recorded in `import_runs` for `library.status` to report.
    console.error(
      '[library] import failed; the toolbox will start with an empty library.',
      error,
    );

    return 'failed';
  }
};

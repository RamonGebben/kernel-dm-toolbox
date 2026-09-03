import 'server-only';

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from '~/env';
import * as schema from '~/server/db/schema';

/**
 * The database handle, created on first use rather than at module load.
 *
 * Laziness is not an optimisation here: `next build` imports route modules to
 * collect their config, and a client constructed at module scope would try to
 * open a database during the build — where `SKIP_ENV_VALIDATION=1` means there
 * is no connection string. I/O belongs at the edges, not in module bodies.
 *
 * One instance serves one campaign, so a single long-lived client is correct:
 * no pool to manage, no per-request tenancy to isolate.
 */
const createDatabase = () =>
  drizzle(
    createClient({
      url: env.DATABASE_URL,
      authToken: env.DATABASE_AUTH_TOKEN,
    }),
    { schema },
  );

export type Database = ReturnType<typeof createDatabase>;

let instance: Database | undefined;

export const getDb = (): Database => {
  instance ??= createDatabase();
  return instance;
};

export { schema };

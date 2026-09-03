import 'server-only';

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from '~/env';
import * as schema from '~/server/db/schema';

/**
 * The database handle. One instance serves one campaign, so a single
 * long-lived client is correct — there is no connection pool to manage and no
 * per-request tenancy to isolate.
 *
 * Row types come from `schema.ts` via drizzle's inference; there are no
 * hand-written row interfaces anywhere in the codebase.
 */
const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
export { schema };

import 'server-only';

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { env } from '~/env';

/** `file:` URLs point at a path that may not exist yet on a fresh volume. */
const ensureDirectoryExists = async (url: string): Promise<void> => {
  if (!url.startsWith('file:')) return;

  await mkdir(dirname(url.slice('file:'.length)), { recursive: true });
};

/**
 * Applies every pending migration. Idempotent: drizzle records what it has
 * already run, so booting an up-to-date instance is a no-op.
 */
export const runMigrations = async (): Promise<void> => {
  await ensureDirectoryExists(env.DATABASE_URL);

  const client = createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });

  await migrate(drizzle(client), {
    migrationsFolder: 'src/server/db/migrations',
  });

  client.close();
};

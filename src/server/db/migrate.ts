import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Applies every pending SQL migration. This is the CLI entry point, used by
 * `pnpm db:migrate` for local development.
 *
 * The running server does the same thing on boot via `src/instrumentation.ts` →
 * `runMigrations.ts`. The two are deliberately separate: this one runs outside
 * the app's module graph, so it cannot import `server-only` or `~/env`. Keep
 * their behaviour in step.
 *
 * This is a CLI script, not app code, so it reads `process.env` directly rather
 * than going through `src/env.ts` — the app's env schema is not loaded here.
 */
const databaseUrl =
  process.env.DATABASE_URL ?? 'file:.data/kernel-dm-toolbox.db';

const ensureDirectoryExists = async (url: string): Promise<void> => {
  if (!url.startsWith('file:')) return;

  const filePath = url.slice('file:'.length);
  await mkdir(dirname(filePath), { recursive: true });
};

const run = async (): Promise<void> => {
  await ensureDirectoryExists(databaseUrl);

  const client = createClient({
    url: databaseUrl,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  await migrate(drizzle(client), {
    migrationsFolder: 'src/server/db/migrations',
  });

  client.close();
  console.log(`Migrations applied to ${databaseUrl}`);
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

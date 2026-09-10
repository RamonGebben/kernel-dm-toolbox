import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '~/server/db/schema';
import { importLibrary } from '~/server/library/importLibrary';
import { LIBRARY_GIT_REF } from '~/server/library/source';
import type { Database } from '~/server/db';

/**
 * `pnpm db:import` — pulls the Open5e library into the local database.
 *
 * A CLI script, so it reads `process.env` directly rather than through
 * `src/env.ts`, for the same reason `migrate.ts` does: it runs outside the
 * app's module graph.
 */
const databaseUrl =
  process.env.DATABASE_URL ?? 'file:.data/kernel-dm-toolbox.db';
const gitRef = process.argv[2] ?? LIBRARY_GIT_REF;
const effectsStorageDir = process.env.EFFECTS_STORAGE_DIR ?? '.data/effects';

const run = async (): Promise<void> => {
  const client = createClient({
    url: databaseUrl,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema }) as Database;

  console.log(`Importing Open5e library from ${gitRef} into ${databaseUrl}`);

  const result = await importLibrary({
    db,
    gitRef,
    effectsStorageDir,
    onProgress: message => console.log(`  ${message}`),
  });

  client.close();

  console.log('');
  console.log(`  creatures  ${result.creatureCount}`);
  console.log(`  actions    ${result.actionCount}`);
  console.log(`  attacks    ${result.attackCount}`);
  console.log(`  traits     ${result.traitCount}`);
  console.log(`  conditions ${result.conditionCount}`);
  console.log(`  spells     ${result.spellCount}`);
  console.log(`  options    ${result.castingOptionCount}`);
  console.log(`  effects    ${result.effectCount}`);

  const orphaned =
    result.orphanedActions +
    result.orphanedAttacks +
    result.orphanedTraits +
    result.orphanedCastingOptions;
  if (orphaned > 0) {
    console.log('');
    console.log(
      `  ${orphaned} row(s) referenced a parent outside this document and were skipped.`,
    );
  }
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

/**
 * Runs once when a server instance boots, before it accepts requests.
 *
 * Applying pending migrations here — rather than from a container entrypoint —
 * means the database driver is part of the app's module graph, so Next.js
 * output tracing includes it in the standalone build. A fresh Docker volume
 * becomes a working database with no manual step.
 */
export const register = async (): Promise<void> => {
  // The edge runtime has no filesystem and no SQLite driver.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // The build's prerender pass also boots a server; it must not touch a
  // database that does not exist yet.
  if (process.env.SKIP_ENV_VALIDATION === '1') return;

  const { runMigrations } = await import('~/server/db/runMigrations');
  await runMigrations();
};

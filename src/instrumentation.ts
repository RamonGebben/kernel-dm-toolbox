/**
 * Runs once when a server instance boots, before it accepts requests.
 *
 * Applying pending migrations here — rather than from a container entrypoint —
 * means the database driver is part of the app's module graph, so Next.js
 * output tracing includes it in the standalone build. A fresh Docker volume
 * becomes a working database with no manual step, and on first boot it also
 * fills itself with the creature library.
 */
export const register = async (): Promise<void> => {
  // The edge runtime has no filesystem and no SQLite driver.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // The build's prerender pass also boots a server; it must not touch a
  // database that does not exist yet.
  if (process.env.SKIP_ENV_VALIDATION === '1') return;

  const { runMigrations } = await import('~/server/db/runMigrations');
  await runMigrations();

  // Awaited rather than fired and forgotten, so a boot that finishes has a
  // library and a failure is reported here rather than as an unhandled
  // rejection later. Next.js may already be serving while this runs, so the
  // creature browser can briefly show its empty state on a first boot. Every
  // boot after the first is a single `count(*)`.
  const { seedLibraryIfEmpty } = await import('~/server/db/seedLibrary');
  await seedLibraryIfEmpty();
};

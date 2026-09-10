import { spawn } from 'node:child_process';
import { cp, mkdir } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

/**
 * Starts the standalone production server the way Docker does.
 *
 * Two things this handles that `next start` cannot:
 *
 * 1. `output: 'standalone'` does not copy `public/` or `.next/static/`, so
 *    they are placed alongside the traced server here.
 * 2. The generated `server.js` calls `process.chdir(__dirname)`. A relative
 *    `file:` DATABASE_URL, or a relative MAPS_STORAGE_DIR, would therefore
 *    resolve inside `.next/standalone` rather than the project — a silently
 *    empty database, or maps written where nothing will ever serve them.
 *    Relative paths are made absolute against the project root before the
 *    server ever sees them.
 */

const STANDALONE_DIR = resolve('.next/standalone');

/** `file:.data/x.db` → `file:/abs/project/.data/x.db`; other URLs untouched. */
export const toAbsoluteFileUrl = (databaseUrl, projectRoot) => {
  if (!databaseUrl?.startsWith('file:')) return databaseUrl;

  const path = databaseUrl.slice('file:'.length);
  if (path.startsWith(':') || isAbsolute(path)) return databaseUrl;

  return `file:${resolve(projectRoot, path)}`;
};

/** `.data/maps` → `/abs/project/.data/maps`; an already-absolute path is untouched. */
export const toAbsolutePath = (path, projectRoot) => {
  if (!path || isAbsolute(path)) return path;
  return resolve(projectRoot, path);
};

const copyStaticAssets = async () => {
  await mkdir(`${STANDALONE_DIR}/.next/static`, { recursive: true });
  await cp('.next/static', `${STANDALONE_DIR}/.next/static`, {
    recursive: true,
  });
  await cp('public', `${STANDALONE_DIR}/public`, {
    recursive: true,
    force: true,
  });
};

await copyStaticAssets();

const databaseUrl = toAbsoluteFileUrl(
  process.env.DATABASE_URL ?? 'file:.data/kernel-dm-toolbox.db',
  process.cwd(),
);

const mapsStorageDir = toAbsolutePath(
  process.env.MAPS_STORAGE_DIR ?? '.data/maps',
  process.cwd(),
);

const effectsStorageDir = toAbsolutePath(
  process.env.EFFECTS_STORAGE_DIR ?? '.data/effects',
  process.cwd(),
);

const server = spawn('node', [`${STANDALONE_DIR}/server.js`], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    MAPS_STORAGE_DIR: mapsStorageDir,
    EFFECTS_STORAGE_DIR: effectsStorageDir,
  },
});

server.on('exit', code => process.exit(code ?? 0));

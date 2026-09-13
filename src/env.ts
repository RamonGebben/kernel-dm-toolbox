import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * The only place in the codebase allowed to read `process.env`. Everything else
 * imports `env` from here and gets a parsed, typed value — a missing or
 * malformed variable fails loudly at startup instead of surfacing as
 * `undefined` three layers deep.
 *
 * `SKIP_ENV_VALIDATION=1` bypasses parsing for lint, typecheck, Storybook and
 * Docker image builds, where the real values are not present.
 */

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),

    /** libSQL connection string. `file:` for the local/Docker SQLite file. */
    DATABASE_URL: z.string().min(1).default('file:.data/kernel-dm-toolbox.db'),

    /** Only set when pointing at a remote libSQL server rather than a file. */
    DATABASE_AUTH_TOKEN: z.string().min(1).optional(),

    /** Shown in the app chrome. One container per campaign, so one name. */
    CAMPAIGN_NAME: z.string().min(1).default('Untitled Campaign'),

    /**
     * Whether an empty library imports itself on boot.
     *
     * Not a feature gate, and deliberately the other way round: unset means
     * **on**, because a container started with nothing but `docker run` has no
     * other way to get a creature library. Set it to `"false"` for an instance
     * that must not reach the network at startup.
     */
    LIBRARY_AUTO_IMPORT: z.enum(['true', 'false']).default('true'),

    /**
     * Where uploaded map images/videos live on disk. Same relative-path
     * gotcha as `DATABASE_URL`: `pnpm start` absolutises it against the
     * project root, and Docker passes `/data/maps` — the same volume the
     * database file already lives on.
     */
    MAPS_STORAGE_DIR: z.string().min(1).default('.data/maps'),

    /** Upload size cap in bytes, enforced before a file is written to disk. */
    MAPS_MAX_UPLOAD_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(50 * 1024 * 1024),

    /**
     * Where animated spell-effect clips fetched from
     * `jackkerouac/animated-spell-effects` (GPL-3.0) are stored. Same
     * relative-path gotcha as `MAPS_STORAGE_DIR`.
     */
    EFFECTS_STORAGE_DIR: z.string().min(1).default('.data/effects'),
  },

  client: {
    /**
     * Absolute origin used to build tRPC URLs during a server render. Unset in
     * the browser-only path, where a relative URL is used instead.
     */
    NEXT_PUBLIC_APP_URL: z.url().optional(),
  },

  /**
   * Next.js only statically analyses client-side `process.env`, so client vars
   * must be destructured by hand. Server vars are read straight off
   * `process.env` at runtime.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  skipValidation: process.env.SKIP_ENV_VALIDATION === '1',
  emptyStringAsUndefined: true,
});

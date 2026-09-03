import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

/**
 * `server-only`'s no-op entry is reachable only through the `react-server`
 * export condition, so it is resolved by path from the package root rather
 * than as a subpath import.
 */
const serverOnlyNoop = join(
  dirname(require.resolve('server-only')),
  'empty.js',
);

/**
 * DB-backed tests: tRPC routers driven through a real caller against a real
 * SQLite database. Kept in a separate config, and out of `pnpm test`, so the
 * default unit run never needs a database.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      /**
       * `server-only` throws on import unless resolved under React's
       * `react-server` condition, which only Next.js sets. The package ships a
       * no-op entry for exactly that condition — point at it directly rather
       * than turning the condition on globally, which would also change how
       * React itself resolves.
       */
      'server-only': serverOnlyNoop,
    },
  },
  test: {
    name: 'integration',
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    // Migrations touch a single file-backed database; running files in
    // parallel would have them fight over it.
    fileParallelism: false,
    env: {
      DATABASE_URL: 'file:.data/integration.db',
      SKIP_ENV_VALIDATION: '1',
    },
  },
});

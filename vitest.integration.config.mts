import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * DB-backed tRPC tests. Kept in a separate config, and out of `pnpm test`, so
 * the default unit run never needs a database.
 *
 * Run against a scratch SQLite file: `pnpm test:integration`.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: 'integration',
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    // Migrations touch a single file-backed database; running files in
    // parallel would have them fight over it.
    fileParallelism: false,
    env: {
      DATABASE_URL: 'file:.data/integration.db',
      SKIP_ENV_VALIDATION: '0',
    },
  },
});

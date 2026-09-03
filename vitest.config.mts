import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { fileURLToPath } from 'node:url';

const dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Two projects, run by two different scripts and two different CI jobs.
 *
 * - `unit`    — node, no DOM, fast. `pnpm test` runs only this.
 * - `storybook` — every story rendered in headless chromium, with play
 *   functions acting as the component tests. `pnpm test:storybook`.
 *
 * The `~/*` alias is resolved from tsconfig by `vite-tsconfig-paths`, so paths
 * are declared in exactly one place.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        plugins: [tsconfigPaths()],
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.integration.test.ts'],
        },
      },
      {
        plugins: [
          tsconfigPaths(),
          storybookTest({ configDir: `${dirname}.storybook` }),
        ],
        test: {
          name: 'storybook',
          // Preview annotations (decorators, parameters) are applied
          // automatically by @storybook/addon-vitest since Storybook 10.3.
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});

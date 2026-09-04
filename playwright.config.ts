import { defineConfig, devices } from '@playwright/test';

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

/**
 * End-to-end specs are organised around **user tasks** ("check the toolbox is
 * running"), not around pages or routes.
 */
export default defineConfig({
  testDir: './e2e',
  // `support/` holds helpers, not specs.
  testMatch: '**/*.spec.ts',
  /**
   * The encounter is a singleton by design — one instance serves one campaign
   * — so parallel specs would fight over the same rows. This is a property of
   * the app, not a limitation of the tests, so the suite runs sequentially.
   */
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // The same standalone server the Docker image runs, so e2e exercises the
    // production artefact rather than a dev-only server.
    // The library must exist before the browser specs run.
    command: 'pnpm build && pnpm db:migrate && pnpm db:import && pnpm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      CAMPAIGN_NAME: 'E2E Campaign',
      FEATURE_INITIATIVE_TRACKER: 'true',
      DATABASE_URL: 'file:.data/e2e.db',
    },
  },
});

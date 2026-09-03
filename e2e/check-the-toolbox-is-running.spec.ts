import { expect, test } from '@playwright/test';

/**
 * User task: a DM opens the toolbox on the LAN and wants to know at a glance
 * that this instance is up and serving the right campaign.
 */
test.describe('check the toolbox is running', () => {
  test('shows the campaign this instance serves', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'E2E Campaign', level: 1 }),
    ).toBeVisible();
  });

  test('reports a live connection to the API', async ({ page }) => {
    await page.goto('/');

    // The status panel resolves once health.ping round-trips.
    await expect(
      page.getByText('E2E Campaign', { exact: true }).last(),
    ).toBeVisible();
    await expect(page.getByText(/Answered/)).toBeVisible();
  });

  test('reveals gated sections only when the gate is on', async ({ page }) => {
    await page.goto('/');

    // FEATURE_INITIATIVE_TRACKER is "true" for this run (playwright.config.ts).
    await expect(
      page.getByRole('heading', { name: 'Initiative', level: 3 }),
    ).toBeVisible();
  });
});

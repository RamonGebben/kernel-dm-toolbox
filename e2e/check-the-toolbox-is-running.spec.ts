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

  test('lays out the three working panels', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Add Combatants' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Combatants by Initiative' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Selected Combatant' }),
    ).toBeVisible();
  });

  test('credits the source data, as the licence requires', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'CC BY 4.0' })).toBeVisible();
  });
});

import { expect, test } from '@playwright/test';

/**
 * User task: a DM opens the toolbox on the LAN and wants to know at a glance
 * that this instance is up and serving the right campaign.
 */
test.describe('check the toolbox is running', () => {
  test('serves the campaign this instance was started for', async ({
    page,
  }) => {
    await page.goto('/');

    // The campaign name lives in the tab title rather than in a page header —
    // one container serves one campaign, so a banner repeating it every time
    // the DM looks at the screen was chrome, not information.
    await expect(page).toHaveTitle('E2E Campaign');
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

  test('offers the tool rail, with every built tool one click away', async ({
    page,
  }) => {
    await page.goto('/');

    const rail = page.getByRole('navigation', { name: 'Tools' });

    await expect(
      rail.getByRole('link', { name: 'Initiative tracker' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      rail.getByRole('link', { name: 'Battle maps and the second screen' }),
    ).toHaveAttribute('href', '/maps');
    await expect(
      rail.getByRole('link', { name: 'Quick spell lookup' }),
    ).toHaveAttribute('href', '/spells');
  });
});

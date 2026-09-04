import { expect, test } from '@playwright/test';
import { clearEncounter } from './support/reset';

/**
 * User task: know whether the fight you have just built is going to be a
 * pushover or a party wipe, before you run it.
 */
test.describe.configure({ mode: 'serial' });

const uniqueName = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;

test.describe('rate the encounter', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await clearEncounter(request, baseURL!);
  });

  test('says there is nothing to measure against without a party', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('young black dragon');
    await page
      .getByRole('button', { name: 'Add Young Black Dragon to the encounter' })
      .click();

    await expect(
      page.getByText('Add the party to rate this fight'),
    ).toBeVisible();
  });

  test('rates a CR 7 dragon as moderate for four level fives', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Characters' }).click();

    for (let index = 0; index < 4; index += 1) {
      const name = uniqueName(`PC${index}`);
      await page.getByRole('button', { name: 'Add character' }).click();
      await page.getByLabel('Name', { exact: true }).fill(name);
      await page.getByLabel('Level', { exact: true }).fill('5');
      await page.getByRole('button', { name: 'Add character' }).click();
      await page
        .getByRole('button', { name: `Add ${name} to the encounter` })
        .click();
    }

    await page.getByRole('tab', { name: 'Creatures' }).click();
    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('young black dragon');
    await page
      .getByRole('button', { name: 'Add Young Black Dragon to the encounter' })
      .click();

    // 2,900 XP against a 3,000 moderate budget.
    await expect(page.getByText('2,900 XP')).toBeVisible();
    await expect(page.getByText('Moderate')).toBeVisible();
  });

  test('climbs to deadly as the fight grows', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Characters' }).click();
    const name = uniqueName('Solo');
    await page.getByRole('button', { name: 'Add character' }).click();
    await page.getByLabel('Name', { exact: true }).fill(name);
    await page.getByLabel('Level', { exact: true }).fill('5');
    await page.getByRole('button', { name: 'Add character' }).click();
    await page
      .getByRole('button', { name: `Add ${name} to the encounter` })
      .click();

    await page.getByRole('tab', { name: 'Creatures' }).click();
    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('young black dragon');
    await page
      .getByRole('button', { name: 'Add Young Black Dragon to the encounter' })
      .click();

    await expect(page.getByText('Deadly')).toBeVisible();
  });
});

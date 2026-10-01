import { expect, test } from '@playwright/test';
import { createCharacter, uniqueName } from './support/party';
import { clearEncounter } from './support/reset';
import { srdYoungBlackDragon } from './support/library';

/**
 * User task: know whether the fight you have just built is going to be a
 * pushover or a party wipe, before you run it.
 */
test.describe.configure({ mode: 'serial' });

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
    await srdYoungBlackDragon(page)
      .getByRole('button', { name: 'Add Young Black Dragon to the encounter' })
      .click();

    await expect(
      page.getByText('Add the party to rate this fight'),
    ).toBeVisible();
  });

  test('rates a CR 7 dragon as moderate for four level fives', async ({
    page,
    request,
    baseURL,
  }) => {
    const names = [0, 1, 2, 3].map(index => uniqueName(`PC${index}`));
    for (const name of names) {
      await createCharacter(request, baseURL!, { name, level: 5 });
    }

    await page.goto('/');
    await page.getByRole('tab', { name: 'Characters' }).click();

    for (const name of names) {
      await page
        .getByRole('button', { name: `Add ${name} to the encounter` })
        .click();
    }

    await page.getByRole('tab', { name: 'Creatures' }).click();
    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('young black dragon');
    await srdYoungBlackDragon(page)
      .getByRole('button', { name: 'Add Young Black Dragon to the encounter' })
      .click();

    // 2,900 XP against a 3,000 moderate budget.
    await expect(page.getByText('2,900 XP')).toBeVisible();
    await expect(page.getByText('Moderate')).toBeVisible();
  });

  test('climbs to deadly as the fight grows', async ({
    page,
    request,
    baseURL,
  }) => {
    const name = uniqueName('Solo');
    await createCharacter(request, baseURL!, { name, level: 5 });
    await page.goto('/');
    await page.getByRole('tab', { name: 'Characters' }).click();
    await page
      .getByRole('button', { name: `Add ${name} to the encounter` })
      .click();

    await page.getByRole('tab', { name: 'Creatures' }).click();
    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('young black dragon');
    await srdYoungBlackDragon(page)
      .getByRole('button', { name: 'Add Young Black Dragon to the encounter' })
      .click();

    await expect(page.getByText('Deadly')).toBeVisible();
  });
});

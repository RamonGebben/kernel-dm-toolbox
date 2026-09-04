import { expect, test } from '@playwright/test';

/**
 * User task: build the fight — drop monsters and the party into the order,
 * then wipe the monsters when it is over and keep the party.
 *
 * These specs share one database and run in parallel, so each works inside its
 * own uniquely named character and clears the board first.
 */
const uniqueName = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random()}`;

test.describe.configure({ mode: 'serial' });

test.describe('build an encounter', () => {
  /**
   * Reset through the API rather than the UI. Clicking "Clear monsters" races
   * the encounter query: the button is disabled until the count loads, so a
   * check made too early silently skips the reset and leaves the previous
   * spec's monsters in the order.
   */
  test.beforeEach(async ({ request, baseURL }) => {
    await request.post(
      `${baseURL}/api/trpc/encounter.clearNonPlayerCombatants`,
      { data: {} },
    );
  });
  test('adds a single monster at a rolled initiative', async ({ page }) => {
    await page.goto('/');

    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('young black dragon');
    await page
      .getByRole('button', { name: 'Add Young Black Dragon to the encounter' })
      .click();

    const row = page
      .getByRole('region', { name: 'Combatants by Initiative' })
      .locator('li')
      .filter({ hasText: 'Young Black Dragon' });
    await expect(row).toBeVisible();
    // The book average, which the DM can then edit.
    await expect(row.getByText('127/127')).toBeVisible();
  });

  test('adds four of a kind as four separately numbered rows', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('goblin warrior');
    await page.getByLabel('How many to add', { exact: true }).fill('4');
    await page
      .getByRole('button', { name: 'Add Goblin Warrior to the encounter' })
      .click();

    for (const number of [1, 2, 3, 4]) {
      await expect(
        page.getByRole('button', { name: `Select Goblin Warrior ${number}` }),
      ).toBeVisible();
    }
  });

  test('shows a combatant statblock when its row is selected', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('young black dragon');
    await page
      .getByRole('button', { name: 'Add Young Black Dragon to the encounter' })
      .click();

    await page
      .getByRole('button', { name: 'Select Young Black Dragon' })
      .click();

    await expect(page.getByText('127 (15d10 + 45)')).toBeVisible();
  });

  test('clears the monsters and keeps the party', async ({ page }) => {
    const name = uniqueName('Sigrid');
    await page.goto('/');

    // A character on the roster, added to the fight.
    await page.getByRole('tab', { name: 'Characters' }).click();
    await page.getByRole('button', { name: 'Add character' }).click();
    await page.getByLabel('Name', { exact: true }).fill(name);
    await page.getByRole('button', { name: 'Add character' }).click();
    await page
      .getByRole('button', { name: `Add ${name} to the encounter` })
      .click();
    await expect(
      page.getByRole('button', { name: `Select ${name}` }),
    ).toBeVisible();

    // A monster alongside them.
    await page.getByRole('tab', { name: 'Creatures' }).click();
    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('goblin warrior');
    await page
      .getByRole('button', { name: 'Add Goblin Warrior to the encounter' })
      .click();
    await expect(
      page.getByRole('button', { name: 'Select Goblin Warrior' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Clear monsters' }).click();

    await expect(
      page.getByRole('button', { name: 'Select Goblin Warrior' }),
    ).toBeHidden();
    await expect(
      page.getByRole('button', { name: `Select ${name}` }),
    ).toBeVisible();
  });

  test('will not add the same character twice', async ({ page }) => {
    const name = uniqueName('Hammie');
    await page.goto('/');
    await page.getByRole('tab', { name: 'Characters' }).click();
    await page.getByRole('button', { name: 'Add character' }).click();
    await page.getByLabel('Name', { exact: true }).fill(name);
    await page.getByRole('button', { name: 'Add character' }).click();

    const addButton = page.getByRole('button', {
      name: `Add ${name} to the encounter`,
    });
    await addButton.click();

    await expect(addButton).toBeDisabled();
  });

  test('removes a single combatant from the order', async ({ page }) => {
    await page.goto('/');

    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('goblin warrior');
    await page
      .getByRole('button', { name: 'Add Goblin Warrior to the encounter' })
      .click();
    await expect(
      page.getByRole('button', { name: 'Select Goblin Warrior' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Remove Goblin Warrior' }).click();

    // Party members added by an earlier spec legitimately remain in the order,
    // so assert on the goblin rather than on the encounter being empty.
    await expect(
      page.getByRole('button', { name: 'Select Goblin Warrior' }),
    ).toBeHidden();
  });
});

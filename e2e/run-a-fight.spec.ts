import { expect, test } from '@playwright/test';

/**
 * User task: actually run the combat — step through turns, count rounds, apply
 * damage, and let someone hold their action.
 */
test.describe.configure({ mode: 'serial' });

test.describe('run a fight', () => {
  test.beforeEach(async ({ request, baseURL, page }) => {
    await request.post(
      `${baseURL}/api/trpc/encounter.clearNonPlayerCombatants`,
      { data: {} },
    );
    await page.goto('/');
    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('goblin warrior');
    await page.getByLabel('How many to add', { exact: true }).fill('3');
    await page
      .getByRole('button', { name: 'Add Goblin Warrior to the encounter' })
      .click();
    await expect(
      page.getByRole('button', { name: 'Select Goblin Warrior 3' }),
    ).toBeVisible();
  });

  test('starts the fight at round one', async ({ page }) => {
    await expect(page.getByText('Not started')).toBeVisible();

    await page.getByRole('button', { name: 'Start fight' }).click();

    await expect(page.getByText('Round 1')).toBeVisible();
    // Exact: "turn" also appears inside the "Next turn" button.
    await expect(page.getByText('turn', { exact: true })).toBeVisible();
  });

  test('counts a new round once the order wraps', async ({ page }) => {
    await page.getByRole('button', { name: 'Start fight' }).click();
    await expect(page.getByText('Round 1')).toBeVisible();

    // Three goblins plus whatever the party left behind; step past all of them.
    const rowCount = await page.getByRole('listitem').count();
    for (let turn = 0; turn < rowCount; turn += 1) {
      await page.getByRole('button', { name: 'Next turn' }).click();
    }

    await expect(page.getByText('Round 2')).toBeVisible();
  });

  test('steps back a turn', async ({ page }) => {
    await page.getByRole('button', { name: 'Start fight' }).click();
    await page.getByRole('button', { name: 'Next turn' }).click();

    await page.getByRole('button', { name: 'Back' }).click();

    await expect(page.getByText('Round 1')).toBeVisible();
  });

  test('applies damage to the selected combatant', async ({ page }) => {
    await page.getByRole('button', { name: 'Select Goblin Warrior 1' }).click();

    await page.getByLabel('Amount', { exact: true }).fill('4');
    await page.getByRole('button', { name: 'Damage' }).click();

    const row = page
      .getByRole('region', { name: 'Combatants by Initiative' })
      .locator('li')
      .filter({ hasText: 'Goblin Warrior 1' });
    await expect(row.getByText('6/10')).toBeVisible();
  });

  test('heals back but never above the maximum', async ({ page }) => {
    await page.getByRole('button', { name: 'Select Goblin Warrior 1' }).click();
    await page.getByLabel('Amount', { exact: true }).fill('4');
    await page.getByRole('button', { name: 'Damage' }).click();

    await page.getByLabel('Amount', { exact: true }).fill('99');
    await page.getByRole('button', { name: 'Heal' }).click();

    const row = page
      .getByRole('region', { name: 'Combatants by Initiative' })
      .locator('li')
      .filter({ hasText: 'Goblin Warrior 1' });
    await expect(row.getByText('10/10')).toBeVisible();
  });

  test('drops a delayed combatant out of the turn order', async ({ page }) => {
    await page.getByRole('button', { name: 'Delay Goblin Warrior 1' }).click();

    const row = page
      .getByRole('region', { name: 'Combatants by Initiative' })
      .locator('li')
      .filter({ hasText: 'Goblin Warrior 1' });
    await expect(row.getByText('delayed')).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Return Goblin Warrior 1 to the order',
      }),
    ).toBeVisible();
  });

  test('hides a combatant from the player view', async ({ page }) => {
    await page.getByRole('button', { name: 'Select Goblin Warrior 1' }).click();

    await page.getByRole('button', { name: 'Hide from players' }).click();

    const row = page
      .getByRole('region', { name: 'Combatants by Initiative' })
      .locator('li')
      .filter({ hasText: 'Goblin Warrior 1' });
    await expect(row.getByText('hidden')).toBeVisible();
  });
});

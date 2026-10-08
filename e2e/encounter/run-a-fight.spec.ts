import { expect, test } from '@playwright/test';
import { startFight, stepThroughRound } from '../support/combat';
import { addMonsters } from '../support/library';

/**
 * User task: actually run the combat — step through turns, count rounds, apply
 * damage, and let someone hold their action.
 */
test.describe.configure({ mode: 'serial' });

const order = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'Combatants by Initiative' });

/**
 * Hit points are changed in a dialog opened from the HP readout on the
 * combatant's own row, not from the statblock panel.
 */
const openHitPoints = async (
  page: import('@playwright/test').Page,
  name: string,
) => {
  await page
    .getByRole('button', { name: `Edit hit points for ${name}`, exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: `Hit points: ${name}` });
  await expect(dialog).toBeVisible();
  return dialog;
};

test.describe('run a fight', () => {
  test.beforeEach(async ({ request, baseURL, page }) => {
    await request.post(
      `${baseURL}/api/trpc/encounter.clearNonPlayerCombatants`,
      { data: {} },
    );
    await addMonsters(request, baseURL!, 'srd-2024_goblin-warrior', 3);
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Select Goblin Warrior 3' }),
    ).toBeVisible();
  });

  test('starts the fight at round one', async ({ page }) => {
    await expect(page.getByText('Not started')).toBeVisible();

    await startFight(page);

    await expect(page.getByText('Round 1')).toBeVisible();
    // Exact: "turn" also appears inside the "Next turn" button.
    await expect(page.getByText('turn', { exact: true })).toBeVisible();
  });

  test('counts a new round once the order wraps', async ({ page }) => {
    await startFight(page);
    await expect(page.getByText('Round 1')).toBeVisible();

    await stepThroughRound(page);

    await expect(page.getByText('Round 2')).toBeVisible();
  });

  test('steps back a turn', async ({ page }) => {
    await startFight(page);
    await page.getByRole('button', { name: 'Next turn' }).click();

    // Exact: the library lists a "Backup Holler Spider" too.
    await page.getByRole('button', { name: 'Back', exact: true }).click();

    await expect(page.getByText('Round 1')).toBeVisible();
  });

  test('applies damage from the combatant row', async ({ page }) => {
    const dialog = await openHitPoints(page, 'Goblin Warrior 1');

    await dialog.getByLabel('Amount', { exact: true }).fill('4');
    await dialog.getByRole('button', { name: 'Damage' }).click();

    const row = order(page)
      .locator('li')
      .filter({ hasText: 'Goblin Warrior 1' });
    await expect(row.getByText('6/10')).toBeVisible();
  });

  test('heals back but never above the maximum', async ({ page }) => {
    const dialog = await openHitPoints(page, 'Goblin Warrior 1');
    await dialog.getByLabel('Amount', { exact: true }).fill('4');
    await dialog.getByRole('button', { name: 'Damage' }).click();
    await expect(
      order(page).locator('li').filter({ hasText: 'Goblin Warrior 1' }),
    ).toContainText('6/10');

    await dialog.getByLabel('Amount', { exact: true }).fill('99');
    await dialog.getByRole('button', { name: 'Heal' }).click();

    const row = order(page)
      .locator('li')
      .filter({ hasText: 'Goblin Warrior 1' });
    await expect(row.getByText('10/10')).toBeVisible();
  });

  test('drops a delayed combatant out of the turn order', async ({ page }) => {
    await page.getByRole('button', { name: 'Delay Goblin Warrior 1' }).click();

    const row = order(page)
      .locator('li')
      .filter({ hasText: 'Goblin Warrior 1' });
    await expect(row.getByText('delayed')).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Return Goblin Warrior 1 to the order',
      }),
    ).toBeVisible();
  });

  test('ends the fight without clearing the board', async ({ page }) => {
    await startFight(page);
    await expect(page.getByText('Round 1')).toBeVisible();

    await page.getByRole('button', { name: 'End combat' }).click();

    await expect(page.getByText('Not started')).toBeVisible();
    // Ending is not clearing: the goblins are still there to loot.
    await expect(
      page.getByRole('button', { name: 'Select Goblin Warrior 3' }),
    ).toBeVisible();
  });

  test('hides a combatant from the player view', async ({ page }) => {
    await page.getByRole('button', { name: 'Select Goblin Warrior 1' }).click();

    await page.getByRole('button', { name: 'Hide from players' }).click();

    const row = order(page)
      .locator('li')
      .filter({ hasText: 'Goblin Warrior 1' });
    await expect(row.getByText('hidden')).toBeVisible();
  });
});

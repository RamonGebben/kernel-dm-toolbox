import { expect, test } from '@playwright/test';
import { startFight } from './support/combat';

/**
 * User task: mark that a creature is poisoned for three rounds and have the
 * tracker remember, count it down, and clear it without being asked.
 */
test.describe.configure({ mode: 'serial' });

const order = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'Combatants by Initiative' });

test.describe('track conditions', () => {
  test.beforeEach(async ({ request, baseURL, page }) => {
    await request.post(
      `${baseURL}/api/trpc/encounter.clearNonPlayerCombatants`,
      { data: {} },
    );
    await page.goto('/');
    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('goblin warrior');
    await page
      .getByRole('button', { name: 'Add Goblin Warrior to the encounter' })
      .click();
    await page.getByRole('button', { name: 'Select Goblin Warrior' }).click();
  });

  test('applies a condition with a duration', async ({ page }) => {
    await page
      .getByLabel('Condition', { exact: true })
      .selectOption({ label: 'Poisoned' });
    await page.getByLabel('Rounds', { exact: true }).fill('3');
    await page.getByRole('button', { name: 'Apply' }).click();

    const row = order(page).locator('li').filter({ hasText: 'Goblin Warrior' });
    await expect(row.getByText('Poisoned')).toBeVisible();
    await expect(row.getByText('3', { exact: true })).toBeVisible();
  });

  test('applies an indefinite condition when no duration is given', async ({
    page,
  }) => {
    await page
      .getByLabel('Condition', { exact: true })
      .selectOption({ label: 'Prone' });
    await page.getByRole('button', { name: 'Apply' }).click();

    const row = order(page).locator('li').filter({ hasText: 'Goblin Warrior' });
    await expect(row.getByText('Prone')).toBeVisible();
  });

  test('counts the duration down as rounds pass', async ({ page }) => {
    await page
      .getByLabel('Condition', { exact: true })
      .selectOption({ label: 'Poisoned' });
    await page.getByLabel('Rounds', { exact: true }).fill('3');
    await page.getByRole('button', { name: 'Apply' }).click();

    await startFight(page);
    await expect(page.getByText('Round 1')).toBeVisible();

    const rowCount = await order(page).getByRole('listitem').count();
    for (let turn = 0; turn < rowCount; turn += 1) {
      await page.getByRole('button', { name: 'Next turn' }).click();
    }
    await expect(page.getByText('Round 2')).toBeVisible();

    const row = order(page).locator('li').filter({ hasText: 'Goblin Warrior' });
    await expect(row.getByText('2', { exact: true })).toBeVisible();
  });

  test('clears the condition itself once it runs out', async ({ page }) => {
    await page
      .getByLabel('Condition', { exact: true })
      .selectOption({ label: 'Stunned' });
    await page.getByLabel('Rounds', { exact: true }).fill('1');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Scoped to the order: the name also appears in the picker's own dropdown
    // and on the badge inside the controls panel.
    const row = order(page).locator('li').filter({ hasText: 'Goblin Warrior' });
    await expect(row.getByText('Stunned')).toBeVisible();

    await startFight(page);
    const rowCount = await order(page).getByRole('listitem').count();
    for (let turn = 0; turn < rowCount; turn += 1) {
      await page.getByRole('button', { name: 'Next turn' }).click();
    }
    await expect(page.getByText('Round 2')).toBeVisible();

    await expect(row.getByText('Stunned')).toBeHidden();
  });

  test('removes a condition on request', async ({ page }) => {
    await page
      .getByLabel('Condition', { exact: true })
      .selectOption({ label: 'Prone' });
    await page.getByRole('button', { name: 'Apply' }).click();
    const row = order(page).locator('li').filter({ hasText: 'Goblin Warrior' });
    await expect(row.getByText('Prone')).toBeVisible();

    await page.getByRole('button', { name: 'Remove Prone' }).click();

    await expect(row.getByText('Prone')).toBeHidden();
  });
});

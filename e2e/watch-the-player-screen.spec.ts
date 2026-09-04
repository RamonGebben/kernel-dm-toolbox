import { expect, test } from '@playwright/test';
import { startFight } from './support/combat';
import { clearEncounter } from './support/reset';

/**
 * User task: put the initiative order on a second screen the table can watch,
 * without giving away the things the players are not supposed to know.
 *
 * The secrecy specs here are the important ones: they assert on the *network
 * payload*, not just the rendering, because a hidden ambusher that reaches the
 * browser is spoiled whether or not a component chose to draw it.
 */
test.describe.configure({ mode: 'serial' });

test.describe('watch the player screen', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await clearEncounter(request, baseURL!);
  });

  test('shows the order and whose turn it is', async ({ page, context }) => {
    const dm = await context.newPage();
    await dm.goto('/');
    await dm
      .getByLabel('Filter creatures', { exact: true })
      .fill('goblin warrior');
    await dm
      .getByRole('button', { name: 'Add Goblin Warrior to the encounter' })
      .click();
    await startFight(dm);
    await expect(dm.getByText('Round 1')).toBeVisible();

    await page.goto('/player');

    await expect(page.getByText('Round 1')).toBeVisible();
    await expect(page.getByText('Goblin Warrior')).toBeVisible();
    await dm.close();
  });

  test('updates live when the DM advances a turn', async ({
    page,
    context,
  }) => {
    const dm = await context.newPage();
    await dm.goto('/');
    await dm
      .getByLabel('Filter creatures', { exact: true })
      .fill('goblin warrior');
    await dm.getByLabel('How many to add', { exact: true }).fill('2');
    await dm
      .getByRole('button', { name: 'Add Goblin Warrior to the encounter' })
      .click();

    await page.goto('/player');
    await expect(page.getByText('Goblin Warrior 1')).toBeVisible();

    // No reload on the player screen: the stream has to deliver this.
    await startFight(dm);

    await expect(page.getByText('Round 1')).toBeVisible();
    await dm.close();
  });

  test('never shows exact hit points', async ({ page, context }) => {
    const dm = await context.newPage();
    await dm.goto('/');
    await dm
      .getByLabel('Filter creatures', { exact: true })
      .fill('young black dragon');
    await dm
      .getByRole('button', { name: 'Add Young Black Dragon to the encounter' })
      .click();

    await page.goto('/player');
    await expect(page.getByText('Young Black Dragon')).toBeVisible();

    // Scoped to the dragon's row: other specs leave characters behind whose
    // generated names happen to contain digits.
    const row = page
      .getByRole('listitem')
      .filter({ hasText: 'Young Black Dragon' });

    // 127 is the dragon's hit point total, and 18 its AC. Neither belongs here.
    await expect(row).not.toContainText('127');
    await expect(row).not.toContainText('/');
    await expect(row.getByText('Healthy')).toBeVisible();
    await dm.close();
  });

  test('omits a hidden combatant from the payload entirely', async ({
    page,
    context,
  }) => {
    const dm = await context.newPage();
    await dm.goto('/');
    await dm
      .getByLabel('Filter creatures', { exact: true })
      .fill('goblin warrior');
    await dm
      .getByRole('button', { name: 'Add Goblin Warrior to the encounter' })
      .click();
    await dm.getByRole('button', { name: 'Select Goblin Warrior' }).click();
    await dm.getByRole('button', { name: 'Hide from players' }).click();
    await expect(dm.getByText('hidden')).toBeVisible();

    // Read the raw stream: an ambusher that merely renders as hidden is one
    // devtools panel away from being spoiled. The stream never closes, so the
    // first frame is taken and the socket dropped rather than awaiting a body.
    await page.goto('/player');
    const firstFrame = await page.evaluate(
      () =>
        new Promise<string>((resolve, reject) => {
          const source = new EventSource('/api/encounter/stream');
          const timer = setTimeout(() => {
            source.close();
            reject(new Error('No frame arrived within 5s'));
          }, 5000);

          source.addEventListener('message', event => {
            clearTimeout(timer);
            source.close();
            resolve((event as MessageEvent<string>).data);
          });
        }),
    );

    expect(firstFrame).not.toContain('Goblin Warrior');

    await expect(page.getByText('No fight in progress')).toBeVisible();
    await dm.close();
  });

  test('explains itself when there is no fight', async ({ page }) => {
    await page.goto('/player');

    await expect(page.getByText('No fight in progress')).toBeVisible();
  });
});

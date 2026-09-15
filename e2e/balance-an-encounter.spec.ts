import { expect, test } from '@playwright/test';

/**
 * User task: build a scenario in the encounter simulator, add a party member
 * and a monster, and run the fight once to see how it plays out — the
 * simulator's core happy path (issue #5).
 *
 * Shares the roster and library with every other spec, so this one creates
 * its own uniquely named character and scenario rather than assuming a clean
 * slate.
 */
const uniqueName = (prefix: string) => `${prefix}-${Date.now()}`;

test.describe('balance an encounter', () => {
  test('builds a scenario and runs a battle to a result', async ({ page }) => {
    // The default 30s test timeout is tight once real SSE playback (even at
    // 4x) is added on top of the usual setup steps.
    test.setTimeout(90000);

    const characterName = uniqueName('Hale');
    const scenarioName = uniqueName('Bridge ambush');

    // Create a party member on the roster first — the scenario builder's
    // party picker reads from the same `characters.list` the tracker uses.
    await page.goto('/');
    await page.getByRole('tab', { name: 'Characters' }).click();
    await page.getByRole('button', { name: 'Add character' }).click();
    await page.getByLabel('Name', { exact: true }).fill(characterName);
    await page.getByLabel('Level', { exact: true }).fill('1');
    await page.getByLabel('AC', { exact: true }).fill('15');
    await page.getByLabel('Max HP', { exact: true }).fill('20');
    await page.getByLabel('Init', { exact: true }).fill('2');
    await page.getByRole('button', { name: 'Add character' }).click();
    await expect(
      page
        .getByRole('region', { name: 'Add Combatants' })
        .locator('li')
        .filter({ hasText: characterName }),
    ).toBeVisible();

    await page.goto('/simulator');

    // Create the scenario — creating one selects it automatically.
    await page.getByLabel('Name for the new scenario').fill(scenarioName);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(
      page.getByRole('region', { name: 'Scenario' }).getByText(scenarioName),
    ).toBeVisible();

    // Add the party member.
    const partySelect = page.getByLabel('Add a character to the party');
    const partyOptionValue = await partySelect
      .locator('option')
      .filter({ hasText: characterName })
      .first()
      .getAttribute('value');
    await partySelect.selectOption(partyOptionValue!);
    await page
      .locator('form')
      .filter({ has: partySelect })
      .getByRole('button', { name: 'Add' })
      .click();
    await expect(
      page.getByRole('button', {
        name: `Remove ${characterName} from the party`,
      }),
    ).toBeVisible();

    // Add a monster.
    await page.getByLabel('Search creatures to add').fill('goblin warrior');
    const monsterSelect = page.getByLabel(
      'Add a creature to the monster group',
    );
    await expect(
      monsterSelect.locator('option').filter({ hasText: 'Goblin Warrior' }),
    ).not.toHaveCount(0);
    const monsterOptionValue = await monsterSelect
      .locator('option')
      .filter({ hasText: 'Goblin Warrior' })
      .first()
      .getAttribute('value');
    await monsterSelect.selectOption(monsterOptionValue!);
    await page
      .locator('form')
      .filter({ has: monsterSelect })
      .getByRole('button', { name: 'Add' })
      .click();
    await expect(
      page.getByRole('button', {
        name: 'Remove Goblin Warrior from the scenario',
      }),
    ).toBeVisible();

    // Run the fight and watch it play to a result.
    await page.getByRole('tab', { name: 'Battle' }).click();
    await page.getByRole('button', { name: 'Run battle' }).click();
    await expect(page.getByText(/^Seed \d+/)).toBeVisible();

    await page.getByRole('button', { name: '4x' }).click();
    await page.getByRole('button', { name: 'Play' }).click();

    // "The party wins!" (singular subject) / "The monsters win!" (plural) /
    // "It's a draw." — see `winnerLabel` in `BattleViewerView`.
    await expect(page.getByText(/wins?!$|draw\.$/)).toBeVisible({
      timeout: 60000,
    });

    const log = page.getByRole('log', { name: 'Turn log' });
    await expect(log.locator('p').first()).toBeVisible();
  });
});

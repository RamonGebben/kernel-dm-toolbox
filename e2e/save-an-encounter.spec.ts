import { expect, test } from '@playwright/test';
import { clearEncounter, clearSavedEncounters } from './support/reset';

/**
 * User task: the DM has built a fight they will run again — the same ambush in
 * two different sessions — and wants it back with one click rather than by
 * searching the library a second time.
 */
test.describe.configure({ mode: 'serial' });

const library = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'Add Combatants' });

const order = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'Combatants by Initiative' });

/** Presets outlive an encounter, so both have to be cleared to isolate a spec. */
const openEncountersTab = async (page: import('@playwright/test').Page) => {
  await library(page).getByRole('tab', { name: 'Encounters' }).click();
  await expect(page.getByLabel('Loading saved encounters')).toBeHidden();
};

const addTwoGoblins = async (page: import('@playwright/test').Page) => {
  await page
    .getByLabel('Filter creatures', { exact: true })
    .fill('goblin warrior');
  await page.getByLabel('How many to add', { exact: true }).fill('2');
  await page
    .getByRole('button', { name: 'Add Goblin Warrior to the encounter' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Select Goblin Warrior 2' }),
  ).toBeVisible();
};

test.describe('save an encounter', () => {
  test.beforeEach(async ({ request, baseURL, page }) => {
    await clearEncounter(request, baseURL!);
    await clearSavedEncounters(request, baseURL!);
    await page.goto('/');
  });

  test('explains itself before anything has been saved', async ({ page }) => {
    await openEncountersTab(page);

    await expect(page.getByText('No saved encounters')).toBeVisible();
  });

  test('saves the monsters on the board and adds them back later', async ({
    page,
  }) => {
    await addTwoGoblins(page);

    await openEncountersTab(page);
    await page.getByLabel('Name for the saved encounter').fill('Goblin patrol');
    await page.getByRole('button', { name: 'Save current' }).click();

    const card = page
      .getByRole('listitem')
      .filter({ hasText: 'Goblin patrol' });
    await expect(card.getByText('2 × Goblin Warrior')).toBeVisible();

    await page.getByRole('button', { name: 'Clear monsters' }).click();
    await expect(
      page.getByRole('button', { name: 'Select Goblin Warrior 1' }),
    ).toBeHidden();

    await page
      .getByRole('button', { name: 'Add Goblin patrol to the encounter' })
      .click();

    await expect(order(page).getByRole('listitem')).toHaveCount(2);
  });

  test('leaves the party out — a preset is the opposition', async ({
    page,
  }) => {
    await library(page).getByRole('tab', { name: 'Characters' }).click();
    await page.getByRole('button', { name: 'Add character' }).click();
    await page.getByLabel('Name', { exact: true }).fill('Sigrid');
    await page.getByRole('button', { name: 'Add character' }).click();
    await page
      .getByRole('button', { name: 'Add Sigrid to the encounter' })
      .click();

    await library(page).getByRole('tab', { name: 'Creatures' }).click();
    await addTwoGoblins(page);

    await openEncountersTab(page);
    await page.getByLabel('Name for the saved encounter').fill('Just goblins');
    await page.getByRole('button', { name: 'Save current' }).click();

    const card = page.getByRole('listitem').filter({ hasText: 'Just goblins' });
    await expect(card).toContainText('2 creatures');
    await expect(card).not.toContainText('Sigrid');
  });

  test('deletes a saved encounter', async ({ page }) => {
    await addTwoGoblins(page);
    await openEncountersTab(page);
    await page.getByLabel('Name for the saved encounter').fill('Goblin patrol');
    await page.getByRole('button', { name: 'Save current' }).click();
    await expect(
      page.getByRole('button', { name: 'Delete Goblin patrol' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Delete Goblin patrol' }).click();

    await expect(page.getByText('No saved encounters')).toBeVisible();
  });
});

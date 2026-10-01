import { expect, test } from '@playwright/test';
import { createCharacter, uniqueName } from './support/party';
import { clearEncounter, clearSavedEncounters } from './support/reset';
import { addMonsters } from './support/library';

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

const addTwoGoblins = async (
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
  baseURL: string,
) => {
  await addMonsters(request, baseURL, 'srd-2024_goblin-warrior', 2);
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
    request,
    baseURL,
  }) => {
    await addTwoGoblins(page, request, baseURL!);

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
    request,
    baseURL,
  }) => {
    const name = uniqueName('Sigrid');
    await createCharacter(request, baseURL!, { name });
    // Created after the page loaded, so the roster has to be refetched.
    await page.reload();
    await library(page).getByRole('tab', { name: 'Characters' }).click();
    await page
      .getByRole('button', { name: `Add ${name} to the encounter` })
      .click();

    await library(page).getByRole('tab', { name: 'Creatures' }).click();
    await addTwoGoblins(page, request, baseURL!);

    await openEncountersTab(page);
    await page.getByLabel('Name for the saved encounter').fill('Just goblins');
    await page.getByRole('button', { name: 'Save current' }).click();

    const card = page.getByRole('listitem').filter({ hasText: 'Just goblins' });
    await expect(card).toContainText('2 creatures');
    await expect(card).not.toContainText(name);
  });

  test('deletes a saved encounter', async ({ page, request, baseURL }) => {
    await addTwoGoblins(page, request, baseURL!);
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

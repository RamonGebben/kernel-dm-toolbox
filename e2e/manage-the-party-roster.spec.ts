import { expect, test } from '@playwright/test';

/**
 * User task: record the party once so they can be dropped into every fight.
 *
 * Each test creates its own uniquely named character, because the roster is
 * persistent by design and the specs share one database.
 */
const uniqueName = (prefix: string) => `${prefix}-${Date.now()}`;

test.describe('manage the party roster', () => {
  test('adds a character and shows them on the roster', async ({ page }) => {
    const name = uniqueName('Sigrid');
    await page.goto('/');
    await page.getByRole('tab', { name: 'Characters' }).click();

    await page.getByRole('button', { name: 'Add character' }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Player').fill('Anna');
    await page.getByLabel('Level').fill('5');
    await page.getByLabel('AC').fill('20');
    await page.getByLabel('Max HP').fill('45');
    await page.getByLabel('Init').fill('2');
    await page.getByRole('button', { name: 'Add character' }).click();

    await expect(page.getByText(name)).toBeVisible();
    await expect(
      page.getByText(/Anna · Level 5 · AC 20 · 45 HP · init \+2/),
    ).toBeVisible();
  });

  test('keeps a character across a reload — the roster is persistent', async ({
    page,
  }) => {
    const name = uniqueName('Hammie');
    await page.goto('/');
    await page.getByRole('tab', { name: 'Characters' }).click();
    await page.getByRole('button', { name: 'Add character' }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Add character' }).click();
    await expect(page.getByText(name)).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: 'Characters' }).click();

    await expect(page.getByText(name)).toBeVisible();
  });

  test('edits a character in place', async ({ page }) => {
    const name = uniqueName('Meat');
    await page.goto('/');
    await page.getByRole('tab', { name: 'Characters' }).click();
    await page.getByRole('button', { name: 'Add character' }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Max HP').fill('52');
    await page.getByRole('button', { name: 'Add character' }).click();
    await expect(page.getByText(name)).toBeVisible();

    await page
      .locator('li')
      .filter({ hasText: name })
      .getByRole('button', { name: 'Edit' })
      .click();
    await page.getByLabel('Max HP').fill('60');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(
      page.locator('li').filter({ hasText: name }).getByText(/60 HP/),
    ).toBeVisible();
  });

  test('removes a character from the roster', async ({ page }) => {
    const name = uniqueName('Doomed');
    await page.goto('/');
    await page.getByRole('tab', { name: 'Characters' }).click();
    await page.getByRole('button', { name: 'Add character' }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Add character' }).click();
    await expect(page.getByText(name)).toBeVisible();

    await page.getByRole('button', { name: `Remove ${name}` }).click();

    await expect(page.getByText(name)).toBeHidden();
  });

  test('switches back to the creature library', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Characters' }).click();
    await expect(page.getByLabel('Filter creatures')).toBeHidden();

    await page.getByRole('tab', { name: 'Creatures' }).click();

    await expect(page.getByLabel('Filter creatures')).toBeVisible();
  });
});

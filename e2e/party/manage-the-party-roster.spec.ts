import { expect, test, type Page } from '@playwright/test';
import { clearEncounter } from '../support/reset';
import { createCharacter, uniqueName } from '../support/party';

/**
 * User task: keep the party on the Party page, and pick from it in the
 * tracker on the night.
 *
 * Each test creates its own uniquely named character, because the roster is
 * persistent by design and the specs share one database.
 */
const card = (page: Page, name: string) =>
  page.getByRole('article', { name, exact: true });

const editor = (page: Page) => page.getByRole('dialog');

/** Scoped to the tracker's left panel: a character may also be in the fight. */
const pickList = (page: Page) =>
  page.getByRole('region', { name: 'Add Combatants' });

const openTrackerCharacters = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Characters' }).click();
};

test.describe('manage the party', () => {
  test('adds a character on the Party page', async ({ page }) => {
    const name = uniqueName('Sigrid');
    await page.goto('/party');

    await page.getByRole('button', { name: 'Add character' }).click();
    await expect(editor(page)).toBeVisible();
    await page.getByLabel('Name', { exact: true }).fill(name);
    await page.getByLabel('Player', { exact: true }).fill('Anna');
    await page.getByLabel('Class', { exact: true }).selectOption('Paladin');
    await page.getByLabel('Species', { exact: true }).fill('Goliath');
    await page.getByLabel('Level', { exact: true }).fill('5');
    await page.getByLabel('AC', { exact: true }).fill('20');
    await page.getByLabel('Max HP', { exact: true }).fill('45');
    await editor(page).getByRole('button', { name: 'Add character' }).click();

    await expect(editor(page)).toBeHidden();
    await expect(
      card(page, name).getByText('Level 5 Goliath Paladin · played by Anna'),
    ).toBeVisible();
  });

  test('keeps a character across a reload — the roster is persistent', async ({
    page,
    request,
    baseURL,
  }) => {
    const name = uniqueName('Hammie');
    await createCharacter(request, baseURL!, { name });

    await page.goto('/party');
    await expect(card(page, name)).toBeVisible();

    await page.reload();
    await expect(card(page, name)).toBeVisible();
  });

  test('edits a character in a modal that the URL can reopen', async ({
    page,
    request,
    baseURL,
  }) => {
    const name = uniqueName('Meat');
    await createCharacter(request, baseURL!, { name, maxHitPoints: 52 });
    await page.goto('/party');

    await card(page, name)
      .getByRole('button', { name: `Edit ${name}` })
      .click();
    await expect(page).toHaveURL(/\/party\?edit=/);

    // A reload lands back in the same editor.
    await page.reload();
    await expect(editor(page)).toBeVisible();

    await page.getByLabel('Max HP', { exact: true }).fill('60');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(editor(page)).toBeHidden();
    await expect(page).toHaveURL(/\/party$/);
    await expect(
      card(page, name).getByText('60', { exact: true }),
    ).toBeVisible();
  });

  test('removes a character only after confirming', async ({
    page,
    request,
    baseURL,
  }) => {
    const name = uniqueName('Doomed');
    await createCharacter(request, baseURL!, { name });
    await page.goto('/party');

    await card(page, name)
      .getByRole('button', { name: `Edit ${name}` })
      .click();
    await page.getByRole('button', { name: 'Remove from party…' }).click();
    await page.getByRole('button', { name: `Remove ${name}` }).click();

    await expect(card(page, name)).toBeHidden();
  });

  test('benches a member out of the tracker without removing them', async ({
    page,
    request,
    baseURL,
  }) => {
    const name = uniqueName('Retired');
    await createCharacter(request, baseURL!, { name });
    await page.goto('/party');

    await page.getByRole('button', { name: `Bench ${name}` }).click();
    await expect(
      page.getByRole('list', { name: 'Benched members' }).getByText(name),
    ).toBeVisible();

    await openTrackerCharacters(page);
    await expect(pickList(page).getByText('Add all active')).toBeVisible();
    await expect(pickList(page).getByText(name)).toBeHidden();
  });

  test('moves the treasury up and down', async ({ page }) => {
    await page.goto('/party');
    const balance = page.getByLabel('Treasury balance');
    const before = Number((await balance.innerText()).replace(/[^0-9]/g, ''));

    await page.getByLabel('Amount (gp)').fill('300');
    await page.getByRole('button', { name: 'Deposit' }).click();
    await expect(balance).toHaveText(
      `${(before + 300).toLocaleString('en-US')} gp`,
    );

    await page.getByLabel('Amount (gp)').fill('100');
    await page.getByRole('button', { name: 'Withdraw' }).click();
    await expect(balance).toHaveText(
      `${(before + 200).toLocaleString('en-US')} gp`,
    );
  });
});

test.describe('pick the party in the tracker', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await clearEncounter(request, baseURL!);
  });

  test('has no way to create a character, only to pick one', async ({
    page,
  }) => {
    await openTrackerCharacters(page);

    await expect(
      pickList(page).getByRole('button', { name: 'Add character' }),
    ).toBeHidden();
    await expect(
      pickList(page).getByRole('link', { name: 'Manage the party →' }),
    ).toBeVisible();
  });

  test("edit jumps to that character's editor on the Party page", async ({
    page,
    request,
    baseURL,
  }) => {
    const name = uniqueName('Linked');
    await createCharacter(request, baseURL!, { name });
    await openTrackerCharacters(page);

    await pickList(page)
      .getByRole('link', { name: `Edit ${name}` })
      .click();

    await expect(page).toHaveURL(/\/party\?edit=/);
    await expect(
      page.getByRole('dialog', { name: `Edit ${name}` }),
    ).toBeVisible();
  });

  test('adds every active member at once', async ({
    page,
    request,
    baseURL,
  }) => {
    const first = uniqueName('First');
    const second = uniqueName('Second');
    await createCharacter(request, baseURL!, { name: first });
    await createCharacter(request, baseURL!, { name: second });
    await openTrackerCharacters(page);

    await page.getByRole('button', { name: 'Add all active' }).click();

    await expect(
      page.getByRole('button', { name: `Select ${first}` }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: `Select ${second}` }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add all active' }),
    ).toBeDisabled();
  });

  test('switches back to the creature library', async ({ page }) => {
    await openTrackerCharacters(page);
    await expect(page.getByLabel('Filter creatures')).toBeHidden();

    await page.getByRole('tab', { name: 'Creatures' }).click();

    await expect(page.getByLabel('Filter creatures')).toBeVisible();
  });
});

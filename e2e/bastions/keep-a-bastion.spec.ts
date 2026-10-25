import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import { uniqueName } from '../support/party';
import { resetBastions } from '../support/reset';

/**
 * User task: give a character a bastion and build it up — special
 * facilities by the rules, construction paid from the party treasury.
 *
 * Each test founds a bastion for its own new character, because owners get
 * one bastion each and the specs share one database.
 */
const trpc = (
  request: APIRequestContext,
  baseURL: string,
  path: string,
  json: unknown,
) => request.post(`${baseURL}/api/trpc/${path}`, { data: { json } });

const createOwner = async (
  request: APIRequestContext,
  baseURL: string,
  name: string,
) => {
  const response = await trpc(request, baseURL, 'characters.create', {
    name,
    armorClass: 18,
    maxHitPoints: 60,
    level: 9,
    className: 'Paladin',
  });
  expect(response.ok()).toBe(true);
};

const foundBastion = async (page: Page, owner: string, name: string) => {
  await page.goto('/bastions');
  await page.getByRole('button', { name: 'Found a bastion' }).click();
  await page.getByLabel('Owner').selectOption({ label: `${owner} (level 9)` });
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Found bastion' }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
};

test.describe.configure({ mode: 'serial' });

test.describe('keep a bastion', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetBastions(request, baseURL!, 'per-character');
  });

  test('founds a bastion with its two free rooms', async ({
    page,
    request,
    baseURL,
  }) => {
    const owner = uniqueName('Sigrid');
    const bastion = uniqueName('Highwatch');
    await createOwner(request, baseURL!, owner);

    await foundBastion(page, owner, bastion);

    const rooms = page.getByRole('region', { name: 'Basic facilities' });
    await expect(
      rooms.getByRole('listitem').filter({ hasText: 'Bedroom' }),
    ).toBeVisible();
    await expect(
      rooms.getByRole('listitem').filter({ hasText: 'Kitchen' }),
    ).toBeVisible();
    await expect(page.getByText(/Special facilities · 0 of 4/)).toBeVisible();
  });

  test('adds special facilities the owner qualifies for', async ({
    page,
    request,
    baseURL,
  }) => {
    const owner = uniqueName('Sigrid');
    await createOwner(request, baseURL!, owner);
    await foundBastion(page, owner, uniqueName('Highwatch'));

    await page.getByRole('button', { name: 'Add special facility' }).click();
    const picker = page.getByRole('dialog', { name: 'Add a special facility' });
    // A Paladin has no Arcane Focus.
    await expect(
      picker.getByRole('button', { name: 'Add Arcane Study' }),
    ).toBeDisabled();
    await picker.getByRole('button', { name: 'Add Sanctuary' }).click();

    await expect(picker).toBeHidden();
    await expect(
      page.getByRole('article', { name: 'Sanctuary' }),
    ).toBeVisible();
    await expect(page.getByText(/Special facilities · 1 of 4/)).toBeVisible();
  });

  test('builds a room with treasury gold, then finishes it', async ({
    page,
    request,
    baseURL,
  }) => {
    const owner = uniqueName('Sigrid');
    await createOwner(request, baseURL!, owner);
    await trpc(request, baseURL!, 'party.adjustTreasury', { delta: 1000 });
    await foundBastion(page, owner, uniqueName('Highwatch'));

    const rooms = page.getByRole('region', { name: 'Basic facilities' });
    await rooms.getByLabel('Room', { exact: true }).selectOption('parlor');
    await rooms
      .getByRole('button', { name: 'Build (500 gp, 20 days)' })
      .click();

    const construction = page.getByRole('region', { name: 'Construction' });
    await expect(
      construction.getByText('Build a Cramped Parlor'),
    ).toBeVisible();

    await construction
      .getByRole('button', { name: 'Finish now: Build a Cramped Parlor' })
      .click();

    await expect(
      construction.getByText('Nothing under construction.'),
    ).toBeVisible();
    await expect(
      rooms.getByRole('listitem').filter({ hasText: 'Parlor' }),
    ).toBeVisible();
  });
});

test.describe('share one bastion as a party', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetBastions(request, baseURL!, 'per-character');
  });

  test.afterAll(async ({ request, baseURL }) => {
    await resetBastions(request, baseURL!, 'per-character');
  });

  test('founds one bastion that each member fills with their own facilities', async ({
    page,
    request,
    baseURL,
  }) => {
    const paladin = uniqueName('Sigrid');
    const wizard = uniqueName('Wren');
    await createOwner(request, baseURL!, paladin);
    const response = await trpc(request, baseURL!, 'characters.create', {
      name: wizard,
      armorClass: 12,
      maxHitPoints: 30,
      level: 5,
      className: 'Wizard',
    });
    expect(response.ok()).toBe(true);

    await page.goto('/bastions');
    await page
      .getByRole('button', { name: 'Switch to one for the whole party' })
      .click();
    await page.getByRole('button', { name: 'Switch', exact: true }).click();
    await expect(
      page.getByText('One for the whole party', { exact: true }),
    ).toBeVisible();

    const hall = uniqueName('The Hall');
    await page.getByRole('button', { name: 'Found the party bastion' }).click();
    await page.getByLabel('Name').fill(hall);
    await page.getByRole('button', { name: 'Found bastion' }).click();
    await expect(
      page.getByRole('heading', { name: hall, exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/Shared by the party/)).toBeVisible();

    // The wizard takes an Arcane Study; the paladin could not have.
    await page.getByRole('button', { name: 'Add special facility' }).click();
    const picker = page.getByRole('dialog', { name: 'Add a special facility' });
    await picker
      .getByLabel('For')
      .selectOption({ label: `${wizard} (level 5)` });
    await picker.getByRole('button', { name: 'Add Arcane Study' }).click();

    await expect(
      page
        .getByRole('article', { name: 'Arcane Study' })
        .getByText(`Held by ${wizard}`),
    ).toBeVisible();
    await expect(
      page
        .getByRole('list', { name: 'Facilities per member' })
        .getByText(new RegExp(`${wizard} 1/`)),
    ).toBeVisible();
  });
});

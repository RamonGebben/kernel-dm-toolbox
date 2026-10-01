import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import { uniqueName } from './support/party';

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

test.describe('keep a bastion', () => {
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

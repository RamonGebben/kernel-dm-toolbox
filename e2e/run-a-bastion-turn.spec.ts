import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import { uniqueName } from './support/party';
import { resetBastions } from './support/reset';

/**
 * User task: run a bastion turn with the guided wizard — ask who is home,
 * take their orders, roll the events, commit.
 *
 * The turn covers every bastion in the campaign, so each test starts from a
 * board with only its own.
 */
const trpc = async (
  request: APIRequestContext,
  baseURL: string,
  path: string,
  json: unknown,
) => {
  const response = await request.post(`${baseURL}/api/trpc/${path}`, {
    data: { json },
  });
  expect(response.ok()).toBe(true);
  return (
    (await response.json()) as { result: { data: { json: { id: string } } } }
  ).result.data.json;
};

const setUpTower = async (request: APIRequestContext, baseURL: string) => {
  const wren = await trpc(request, baseURL, 'characters.create', {
    name: uniqueName('Wren'),
    armorClass: 12,
    maxHitPoints: 30,
    level: 5,
    className: 'Wizard',
  });
  const tower = await trpc(request, baseURL, 'bastions.found', {
    mode: 'per-character',
    ownerCharacterId: wren.id,
    name: uniqueName('Tower'),
    crampedBasicType: 'bedroom',
    roomyBasicType: 'kitchen',
  });
  await trpc(request, baseURL, 'bastions.addSpecialFacility', {
    bastionId: tower.id,
    facilityKey: 'arcane-study',
  });
  await trpc(request, baseURL, 'party.adjustTreasury', { delta: 100 });
};

const wizard = (page: Page) =>
  page.getByRole('dialog', { name: /Bastion turn/ });
const next = (page: Page) =>
  wizard(page).getByRole('button', { name: /^Next/ }).click();

test.describe.configure({ mode: 'serial' });

test.describe('run a bastion turn', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetBastions(request, baseURL!, 'per-character');
    await setUpTower(request, baseURL!);
  });

  test.afterAll(async ({ request, baseURL }) => {
    await resetBastions(request, baseURL!, 'per-character');
  });

  test('gives an order, commits it, and lists it in the history', async ({
    page,
  }) => {
    await page.goto('/bastions');
    await page.getByRole('button', { name: 'Start bastion turn' }).click();

    await expect(wizard(page).getByText('1. Since last turn')).toHaveAttribute(
      'aria-current',
      'step',
    );
    await next(page);
    // Home and giving orders is the default.
    await next(page);
    await wizard(page)
      .getByLabel('Order for the Arcane Study')
      .selectOption('book');
    await next(page);
    await expect(
      wizard(page).getByText(/no Bastion Events to roll/),
    ).toBeVisible();
    await next(page);

    await expect(
      wizard(page).getByText(/Arcane Study — Blank book \(10 gp\)/),
    ).toBeVisible();
    await wizard(page)
      .getByRole('button', { name: /Commit turn/ })
      .click();

    await expect(wizard(page).getByText(/Turn \d+ is done/)).toBeVisible();
    await wizard(page).getByText('Close', { exact: true }).click();

    await expect(
      page
        .getByRole('article', { name: 'Arcane Study' })
        .getByText(/Working on Blank book/),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Past turns' }).click();
    await expect(
      page
        .getByRole('dialog', { name: 'Past bastion turns' })
        .getByText(/Blank book \(10 gp\)/)
        .first(),
    ).toBeVisible();
  });

  test('an absent owner maintains and rolls a Bastion Event', async ({
    page,
  }) => {
    await page.goto('/bastions');
    await page.getByRole('button', { name: 'Start bastion turn' }).click();
    await next(page);
    await wizard(page).getByLabel(/Away/).check();
    await next(page);
    await next(page);

    await expect(
      wizard(page).getByRole('button', { name: 'Next: Review' }),
    ).toBeDisabled();
    await wizard(page)
      .getByLabel(/roll for the Bastion Event/)
      .fill('12');
    await expect(wizard(page).getByText('All Is Well')).toBeVisible();
    await next(page);

    await expect(
      wizard(page).getByText(/rolled 12: All Is Well/),
    ).toBeVisible();
    await wizard(page)
      .getByRole('button', { name: /Commit turn/ })
      .click();
    await expect(wizard(page).getByText(/Turn \d+ is done/)).toBeVisible();
  });

  test('picks up a turn after a reload', async ({ page }) => {
    await page.goto('/bastions');
    await page.getByRole('button', { name: 'Start bastion turn' }).click();
    // Moving on saves the draft; reload only once that save has landed.
    const saved = page.waitForResponse(response =>
      response.url().includes('bastionTurns.saveDraft'),
    );
    await next(page);
    await saved;
    await expect(wizard(page).getByText("2. Who's home")).toHaveAttribute(
      'aria-current',
      'step',
    );

    await page.reload();
    await page.getByRole('button', { name: /Resume turn/ }).click();

    await expect(wizard(page).getByText("2. Who's home")).toHaveAttribute(
      'aria-current',
      'step',
    );
  });
});

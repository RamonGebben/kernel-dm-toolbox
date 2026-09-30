import type { APIRequestContext, Locator, Page } from '@playwright/test';

/**
 * Puts `count` of one library monster on the board in a single write, so they
 * come out numbered "Goblin Warrior 1".."Goblin Warrior N" — the same path a
 * saved encounter takes.
 *
 * For specs where the monsters are setup rather than the thing under test. The
 * library panel only adds one at a time, and one-at-a-time adds number
 * differently (a bare "Goblin Warrior", then "2", "3"), which is covered by
 * `build-an-encounter` itself.
 */
export const addMonsters = async (
  request: APIRequestContext,
  baseURL: string,
  slug: string,
  count: number,
): Promise<void> => {
  await request.post(`${baseURL}/api/trpc/encounter.addCreature`, {
    data: { json: { source: 'library', slug, count } },
  });
};

/**
 * A library entry picked by name *and* CR.
 *
 * The library merges several Open5e sources, so a name alone is not unique:
 * A5E's Young Black Dragon (CR 9) sits beside the SRD's (CR 7).
 */
export const libraryEntry = (page: Page, name: string, cr: string): Locator =>
  page
    .getByRole('region', { name: 'Add Combatants' })
    .getByRole('listitem')
    .filter({ hasText: name })
    .filter({ hasText: new RegExp(`CR ${cr}(?!\\d)`) });

/** The SRD Young Black Dragon — the CR 7 one every statblock assertion expects. */
export const srdYoungBlackDragon = (page: Page): Locator =>
  libraryEntry(page, 'Young Black Dragon', '7');

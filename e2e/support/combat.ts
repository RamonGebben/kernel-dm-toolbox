import { expect, type Page } from '@playwright/test';

const dialog = (page: Page) =>
  page.getByRole('dialog', { name: 'Roll for initiative' });

/**
 * Starts the fight the way a DM does: open "Roll for initiative", accept the
 * monsters' automatic rolls, and confirm.
 *
 * A helper rather than three lines repeated in every spec, because the flow is
 * incidental to what most of them are actually testing.
 */
export const startFight = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: 'Roll for initiative' }).click();
  await expect(dialog(page)).toBeVisible();

  await page.getByRole('button', { name: 'Start combat' }).click();
  await expect(dialog(page)).toBeHidden();
};

/**
 * Clicks "Next turn" once per combatant, so the order wraps into the next
 * round.
 *
 * Counts rows by their "Select …" button rather than by `listitem`: a row's
 * condition badges are a nested list, so a poisoned goblin would count twice
 * and the loop would overshoot into the round after.
 */
export const stepThroughRound = async (page: Page): Promise<void> => {
  const combatants = await page
    .getByRole('region', { name: 'Combatants by Initiative' })
    .getByRole('button', { name: /^Select / })
    .count();

  for (let turn = 0; turn < combatants; turn += 1) {
    await page.getByRole('button', { name: 'Next turn' }).click();
  }
};

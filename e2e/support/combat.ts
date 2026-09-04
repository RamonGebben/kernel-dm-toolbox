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

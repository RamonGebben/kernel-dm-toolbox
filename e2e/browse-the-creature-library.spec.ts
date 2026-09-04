import { expect, test } from '@playwright/test';

/**
 * User task: find a monster in the library and read its statblock.
 *
 * Runs against a database the e2e setup imports once, so this also proves the
 * import pipeline and the query layer agree with each other.
 */
test.describe('browse the creature library', () => {
  test('filters the library down to a creature and shows its statblock', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('young black dragon');

    const result = page.getByRole('button', {
      name: 'Show the Young Black Dragon statblock',
    });
    await expect(result).toBeVisible();
    await result.click();

    // The headline numbers a DM actually reads off the panel.
    await expect(
      page.getByRole('heading', { name: 'Young Black Dragon' }),
    ).toBeVisible();
    await expect(page.getByText('Large Dragon, chaotic evil')).toBeVisible();
    await expect(page.getByText('18 (natural armor)')).toBeVisible();
    await expect(page.getByText('127 (15d10 + 45)')).toBeVisible();
    await expect(page.getByText(/7 \(2,900 XP\)/)).toBeVisible();
  });

  test('explains an empty result instead of showing a blank list', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .getByLabel('Filter creatures', { exact: true })
      .fill('nothing matches this');

    await expect(page.getByText('No matches')).toBeVisible();
  });

  test('starts with nothing selected rather than a spinner', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByText('Nothing selected')).toBeVisible();
  });
});

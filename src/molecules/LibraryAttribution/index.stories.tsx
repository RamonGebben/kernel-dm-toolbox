import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { LibraryAttribution } from '~/molecules/LibraryAttribution';

const meta = {
  title: 'Molecules/LibraryAttribution',
  component: LibraryAttribution,
  args: {
    title: 'System Reference Document 5.2',
    publisher: 'Wizards of the Coast',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://github.com/open5e/open5e-api',
  },
} satisfies Meta<typeof LibraryAttribution>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The licence requires both the credit and a link to the licence itself.
    await expect(
      canvas.getByRole('link', { name: 'System Reference Document 5.2' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'CC BY 4.0' }),
    ).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
  },
};

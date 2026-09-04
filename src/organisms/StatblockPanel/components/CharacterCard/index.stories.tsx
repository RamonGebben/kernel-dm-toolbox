import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { CharacterCard } from '~/organisms/StatblockPanel/components/CharacterCard';

const meta = {
  title: 'Organisms/StatblockPanel/CharacterCard',
  component: CharacterCard,
  args: {
    displayName: 'Sigrid',
    currentHitPoints: 45,
    maxHitPoints: 45,
    armorClass: 20,
  },
} satisfies Meta<typeof CharacterCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('45/45')).toBeVisible();
    await expect(canvas.getByText('Player Character')).toBeVisible();
  },
};

export const Wounded: Story = {
  args: { currentHitPoints: 12 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('12/45')).toBeVisible();
  },
};

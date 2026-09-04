import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { DifficultyReadout } from '~/molecules/DifficultyReadout';

const meta = {
  title: 'Molecules/DifficultyReadout',
  component: DifficultyReadout,
  args: {
    difficulty: 'moderate',
    totalExperience: 2900,
    hasParty: true,
  },
  argTypes: {
    difficulty: {
      control: 'radio',
      options: ['trivial', 'low', 'moderate', 'high', 'deadly'],
    },
  },
} satisfies Meta<typeof DifficultyReadout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Moderate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Moderate')).toBeVisible();
    // Thousands separator: the number is read at a glance, not parsed.
    await expect(canvas.getByText('2,900 XP')).toBeVisible();
  },
};

export const Deadly: Story = {
  args: { difficulty: 'deadly', totalExperience: 25000 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('25,000 XP')).toBeVisible();
  },
};

export const Trivial: Story = {
  args: { difficulty: 'trivial', totalExperience: 0 },
};

/** Nothing to measure against until the party is in the fight. */
export const NoParty: Story = {
  args: { hasParty: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('Add the party to rate this fight'),
    ).toBeVisible();
    await expect(canvas.queryByText('Moderate')).not.toBeInTheDocument();
  },
};

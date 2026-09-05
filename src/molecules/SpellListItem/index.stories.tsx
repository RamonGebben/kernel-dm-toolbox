import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SpellListItem } from '~/molecules/SpellListItem';

const meta = {
  title: 'Molecules/SpellListItem',
  component: SpellListItem,
  args: {
    name: 'Fireball',
    levelLabel: '3rd-level',
    school: 'Evocation',
    isSelected: false,
    onSelect: fn(),
  },
  argTypes: {
    isSelected: { control: 'boolean' },
    name: { control: 'text' },
  },
} satisfies Meta<typeof SpellListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Show the Fireball description' }),
    );

    await expect(args.onSelect).toHaveBeenCalledOnce();
  },
};

export const Selected: Story = {
  args: { isSelected: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Show the Fireball description' }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

export const Cantrip: Story = {
  args: { name: 'Guidance', levelLabel: 'Cantrip', school: 'Divination' },
};

export const LongName: Story = {
  args: { name: "Mordenkainen's Magnificent Mansion" },
};

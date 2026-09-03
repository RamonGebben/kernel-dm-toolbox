import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CharacterRow } from '~/molecules/CharacterRow';

const meta = {
  title: 'Molecules/CharacterRow',
  component: CharacterRow,
  args: {
    name: 'Sigrid',
    playerName: 'Anna',
    level: 5,
    armorClass: 20,
    maxHitPoints: 45,
    initiativeModifier: 2,
    onEdit: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof CharacterRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Anna · Level 5 · AC 20/)).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    await expect(args.onEdit).toHaveBeenCalledOnce();
  },
};

export const WithoutPlayerName: Story = {
  args: { playerName: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/^Level 1|^Level 5/)).toBeVisible();
  },
};

export const NegativeInitiative: Story = {
  args: { name: 'Meat', initiativeModifier: -1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/init -1/)).toBeVisible();
  },
};

export const Removing: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Sigrid' }),
    );

    await expect(args.onRemove).toHaveBeenCalledOnce();
  },
};

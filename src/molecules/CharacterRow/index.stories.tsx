import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CharacterRow } from '~/molecules/CharacterRow';

const meta = {
  title: 'Molecules/CharacterRow',
  component: CharacterRow,
  args: {
    name: 'Sigrid',
    playerName: 'Anna',
    classLabel: null,
    level: 5,
    armorClass: 20,
    maxHitPoints: 45,
    initiativeModifier: 2,
    isInEncounter: false,
    onAddToEncounter: fn(),
    onOpenClass: fn(),
    onEdit: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof CharacterRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(/Level 5 · no class · Anna · AC 20/),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    await expect(args.onEdit).toHaveBeenCalledOnce();
  },
};

export const WithClass: Story = {
  args: { classLabel: 'Barbarian 5' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Barbarian 5 · Anna/)).toBeVisible();
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

/** Already in the fight: the action is disabled rather than erroring. */
export const AlreadyInEncounter: Story = {
  args: { isInEncounter: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Add Sigrid to the encounter' }),
    ).toBeDisabled();
  },
};

export const AddingToEncounter: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Add Sigrid to the encounter' }),
    );

    await expect(args.onAddToEncounter).toHaveBeenCalledOnce();
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

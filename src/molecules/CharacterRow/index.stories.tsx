import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CharacterRow } from '~/molecules/CharacterRow';

const meta = {
  title: 'Molecules/CharacterRow',
  component: CharacterRow,
  args: {
    id: 'sigrid-id',
    name: 'Sigrid',
    playerName: 'Anna',
    level: 5,
    className: 'Paladin',
    subclass: null,
    species: 'Goliath',
    armorClass: 20,
    maxHitPoints: 45,
    initiativeModifier: 2,
    isInEncounter: false,
    onAddToEncounter: fn(),
  },
} satisfies Meta<typeof CharacterRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('Level 5 Goliath Paladin · Anna'),
    ).toBeVisible();
    await expect(canvas.getByText(/AC 20 · 45 HP/)).toBeVisible();
  },
};

/** Editing happens on the Party page: the button is a link into its editor. */
export const EditLinksToTheParty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('link', { name: 'Edit Sigrid' }),
    ).toHaveAttribute('href', '/party?edit=sigrid-id');
  },
};

export const NumbersOnly: Story = {
  args: { playerName: null, className: null, species: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Level 5')).toBeVisible();
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

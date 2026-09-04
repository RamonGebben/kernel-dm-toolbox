import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  InitiativeRollForm,
  type InitiativeRollRow,
} from '~/molecules/InitiativeRollForm';

const rows: InitiativeRollRow[] = [
  {
    id: 'goblin-1',
    displayName: 'Goblin Warrior 1',
    isPlayerCharacter: false,
    initiative: 17,
    initiativeBonus: 2,
  },
  {
    id: 'goblin-2',
    displayName: 'Goblin Warrior 2',
    isPlayerCharacter: false,
    initiative: 8,
    initiativeBonus: 2,
  },
  {
    id: 'cleric',
    displayName: 'Sister Garaele',
    isPlayerCharacter: true,
    initiative: 1,
    initiativeBonus: null,
  },
];

const meta = {
  title: 'Molecules/InitiativeRollForm',
  component: InitiativeRollForm,
  args: { rows, isSaving: false, onSubmit: fn(), onCancel: fn() },
  argTypes: { isSaving: { control: 'boolean' } },
} satisfies Meta<typeof InitiativeRollForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Monsters come prefilled; the player row is waiting for a real die. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText(/Goblin Warrior 1/)).toHaveValue(17);
    await expect(canvas.getByLabelText(/Sister Garaele/)).toHaveValue(null);
  },
};

export const SubmitsWhatTheDmTyped: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/Sister Garaele/), '19');
    await userEvent.click(canvas.getByRole('button', { name: 'Start combat' }));

    await expect(args.onSubmit).toHaveBeenCalledWith([
      { id: 'goblin-1', initiative: 17 },
      { id: 'goblin-2', initiative: 8 },
      { id: 'cleric', initiative: 19 },
    ]);
  },
};

export const Saving: Story = {
  args: { isSaving: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Start combat' }),
    ).toBeDisabled();
  },
};

export const NobodyInTheFight: Story = {
  args: { rows: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Start combat' }),
    ).toBeDisabled();
  },
};

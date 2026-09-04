import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  SavedEncountersView,
  type SavedEncounterSummary,
} from '~/organisms/SavedEncounters/components/SavedEncountersView';

const presets: SavedEncounterSummary[] = [
  {
    id: 'bridge',
    name: 'Ambush at the bridge',
    note: null,
    creatureCount: 5,
    entries: [
      {
        creatureSlug: 'srd-2024_goblin-warrior',
        name: 'Goblin Warrior',
        count: 4,
        challengeRatingLabel: '1/4',
      },
      {
        creatureSlug: 'srd-2024_hobgoblin-warrior',
        name: 'Hobgoblin Warrior',
        count: 1,
        challengeRatingLabel: '1/2',
      },
    ],
  },
  {
    id: 'lair',
    name: 'The dragon’s lair',
    note: null,
    creatureCount: 1,
    entries: [
      {
        creatureSlug: 'srd-2024_young-black-dragon',
        name: 'Young Black Dragon',
        count: 1,
        challengeRatingLabel: '7',
      },
    ],
  },
];

const meta = {
  title: 'Organisms/SavedEncounters/SavedEncountersView',
  component: SavedEncountersView,
  args: {
    isPending: false,
    isSaving: false,
    presets,
    canSaveCurrent: true,
    onSave: fn(),
    onApply: fn(),
    onRemove: fn(),
  },
  argTypes: {
    isPending: { control: 'boolean' },
    canSaveCurrent: { control: 'boolean' },
  },
} satisfies Meta<typeof SavedEncountersView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('4 × Goblin Warrior')).toBeVisible();

    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Add Ambush at the bridge to the encounter',
      }),
    );
    await expect(args.onApply).toHaveBeenCalledWith('bridge');
  },
};

export const SavesTheCurrentBoard: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText('Name for the saved encounter'),
      'Goblin patrol',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Save current' }));

    await expect(args.onSave).toHaveBeenCalledWith('Goblin patrol');
  },
};

/** Only the party is on the board, so there is no opposition to save. */
export const NothingToSave: Story = {
  args: { canSaveCurrent: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Save current' }),
    ).toBeDisabled();
  },
};

export const Empty: Story = {
  args: { presets: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No saved encounters')).toBeVisible();
  },
};

export const Pending: Story = {
  args: { isPending: true, presets: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByLabelText('Loading saved encounters'),
    ).toBeVisible();
  },
};

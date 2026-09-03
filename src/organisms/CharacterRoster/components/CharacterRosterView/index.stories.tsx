import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CharacterRosterView } from '~/organisms/CharacterRoster/components/CharacterRosterView';

const sigrid = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Sigrid',
  playerName: 'Anna',
  level: 5,
  armorClass: 20,
  maxHitPoints: 45,
  initiativeModifier: 2,
};

const hammie = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Hammie',
  playerName: null,
  level: 5,
  armorClass: 19,
  maxHitPoints: 37,
  initiativeModifier: 1,
};

const meta = {
  title: 'Organisms/CharacterRoster/CharacterRosterView',
  component: CharacterRosterView,
  args: {
    isPending: false,
    isSaving: false,
    characters: [hammie, sigrid],
    editing: null,
    onStartCreate: fn(),
    onStartEdit: fn(),
    onCancelEdit: fn(),
    onSubmit: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof CharacterRosterView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Sigrid' }),
    );

    await expect(args.onRemove).toHaveBeenCalledWith(sigrid.id);
  },
};

export const Pending: Story = {
  args: { isPending: true, characters: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Loading characters')).toBeVisible();
  },
};

export const Empty: Story = {
  args: { characters: [] },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No characters yet')).toBeVisible();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Add character' }),
    );
    await expect(args.onStartCreate).toHaveBeenCalledOnce();
  },
};

export const AddingCharacter: Story = {
  args: { editing: 'new' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Name')).toHaveValue('');
  },
};

/** The form is seeded with the character being edited, not left blank. */
export const EditingCharacter: Story = {
  args: { editing: sigrid },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Name')).toHaveValue('Sigrid');
    await expect(
      canvas.getByRole('button', { name: 'Save changes' }),
    ).toBeVisible();
  },
};

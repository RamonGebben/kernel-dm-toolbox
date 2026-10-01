import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent } from 'storybook/test';
import { CharacterEditor } from '~/organisms/PartyRoster/components/PartyRosterView/components/CharacterEditor';
import { emptyCharacterForm } from '~/molecules/CharacterForm';

const meta = {
  title: 'Organisms/PartyRoster/PartyRosterView/CharacterEditor',
  component: CharacterEditor,
  args: {
    editing: null,
    isOpen: true,
    isSaving: false,
    isRemoving: false,
    onSubmit: fn(),
    onRemove: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof CharacterEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

const editingSigrid = {
  id: 'sigrid',
  name: 'Sigrid',
  values: { ...emptyCharacterForm, name: 'Sigrid', level: 5 },
};

/** A new character has nothing to remove. */
export const Creating: Story = {
  play: async () => {
    await expect(
      screen.getByRole('dialog', { name: 'New character' }),
    ).toBeVisible();
    await expect(
      screen.queryByRole('button', { name: 'Remove from party…' }),
    ).not.toBeInTheDocument();
  },
};

export const Editing: Story = {
  args: { editing: editingSigrid },
  play: async () => {
    await expect(
      screen.getByRole('dialog', { name: 'Edit Sigrid' }),
    ).toBeVisible();
    await expect(screen.getByLabelText('Name')).toHaveValue('Sigrid');
  },
};

/** The first click only asks; the second removes. */
export const Removing: Story = {
  args: { editing: editingSigrid },
  play: async ({ args }) => {
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove from party…' }),
    );
    await expect(args.onRemove).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Sigrid' }),
    );
    await expect(args.onRemove).toHaveBeenCalledWith('sigrid');
  },
};

export const ChangingYourMind: Story = {
  args: { editing: editingSigrid },
  play: async ({ args }) => {
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove from party…' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Keep' }));

    await expect(
      screen.getByRole('button', { name: 'Remove from party…' }),
    ).toBeVisible();
    await expect(args.onRemove).not.toHaveBeenCalled();
  },
};

export const Closed: Story = {
  args: { isOpen: false },
  play: async () => {
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

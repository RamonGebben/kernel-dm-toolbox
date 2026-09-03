import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CharacterForm } from '~/molecules/CharacterForm';

const meta = {
  title: 'Molecules/CharacterForm',
  component: CharacterForm,
  args: {
    isSaving: false,
    submitLabel: 'Add character',
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof CharacterForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Blank: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Name'), 'Hammie');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Add character' }),
    );

    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Hammie', level: 1, armorClass: 10 }),
    );
  },
};

export const Editing: Story = {
  args: {
    submitLabel: 'Save changes',
    initialValues: {
      name: 'Sigrid',
      playerName: 'Anna',
      armorClass: 20,
      maxHitPoints: 45,
      initiativeModifier: 2,
      level: 5,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Name')).toHaveValue('Sigrid');
    await expect(canvas.getByLabelText('Max HP')).toHaveValue(45);
  },
};

export const Saving: Story = {
  args: { isSaving: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Saving…' }),
    ).toBeDisabled();
  },
};

export const Cancelling: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));

    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

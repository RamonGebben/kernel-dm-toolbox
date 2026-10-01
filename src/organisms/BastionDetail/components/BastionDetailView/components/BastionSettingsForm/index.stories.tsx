import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { BastionSettingsForm } from '~/organisms/BastionDetail/components/BastionDetailView/components/BastionSettingsForm';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/BastionSettingsForm',
  component: BastionSettingsForm,
  args: {
    initialValues: {
      name: 'Highwatch',
      notes: '',
      defenderCount: 6,
      wallSquares: 0,
      isFullyEnclosed: false,
    },
    isSaving: false,
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof BastionSettingsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Correcting: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.clear(canvas.getByLabelText('Wall squares'));
    await userEvent.type(canvas.getByLabelText('Wall squares'), '40');
    await userEvent.click(
      canvas.getByLabelText('Walls fully enclose the bastion'),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));

    await expect(args.onSubmit).toHaveBeenCalledWith({
      name: 'Highwatch',
      notes: '',
      defenderCount: 6,
      wallSquares: 40,
      isFullyEnclosed: true,
    });
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

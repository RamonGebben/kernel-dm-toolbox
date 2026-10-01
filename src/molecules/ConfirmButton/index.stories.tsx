import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ConfirmButton } from '~/molecules/ConfirmButton';

const meta = {
  title: 'Molecules/ConfirmButton',
  component: ConfirmButton,
  args: {
    label: 'Remove',
    confirmLabel: 'Remove Barrack',
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Confirming: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Remove' }));
    await expect(args.onConfirm).not.toHaveBeenCalled();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Barrack' }),
    );
    await expect(args.onConfirm).toHaveBeenCalledOnce();
  },
};

export const Keeping: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Remove' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Keep' }));

    await expect(canvas.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: 'Remove' })).toBeDisabled();
  },
};

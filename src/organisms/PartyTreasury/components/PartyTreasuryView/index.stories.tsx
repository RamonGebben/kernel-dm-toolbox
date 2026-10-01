import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PartyTreasuryView } from '~/organisms/PartyTreasury/components/PartyTreasuryView';

const meta = {
  title: 'Organisms/PartyTreasury/PartyTreasuryView',
  component: PartyTreasuryView,
  args: {
    isPending: false,
    balance: 1250,
    isSaving: false,
    onMove: fn(),
  },
} satisfies Meta<typeof PartyTreasuryView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Treasury balance')).toHaveTextContent(
      '1,250 gp',
    );
    // Nothing typed yet: nothing to move.
    await expect(
      canvas.getByRole('button', { name: 'Deposit' }),
    ).toBeDisabled();
  },
};

export const Pending: Story = {
  args: { isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('status', { name: 'Loading the treasury' }),
    ).toBeVisible();
  },
};

export const Depositing: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Amount (gp)'), '300');
    await userEvent.click(canvas.getByRole('button', { name: 'Deposit' }));

    await expect(args.onMove).toHaveBeenCalledWith(300, 'deposit');
    await expect(canvas.getByLabelText('Amount (gp)')).toHaveValue(null);
  },
};

export const Withdrawing: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Amount (gp)'), '250');
    await userEvent.click(canvas.getByRole('button', { name: 'Withdraw' }));

    await expect(args.onMove).toHaveBeenCalledWith(250, 'withdraw');
  },
};

/** More than the treasury holds: withdraw is off, deposit still works. */
export const Overdrawing: Story = {
  args: { balance: 100 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Amount (gp)'), '101');

    await expect(
      canvas.getByRole('button', { name: 'Withdraw' }),
    ).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Deposit' })).toBeEnabled();
  },
};

export const Saving: Story = {
  args: { isSaving: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Amount (gp)'), '10');

    await expect(
      canvas.getByRole('button', { name: 'Deposit' }),
    ).toBeDisabled();
  },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ConnectionStatusView } from '~/organisms/ConnectionStatus/components/ConnectionStatusView';

const meta = {
  title: 'Organisms/ConnectionStatus/ConnectionStatusView',
  component: ConnectionStatusView,
  args: {
    onRetry: fn(),
  },
} satisfies Meta<typeof ConnectionStatusView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  args: { status: { state: 'pending' } },
};

export const Errored: Story = {
  args: {
    status: { state: 'error', reason: 'Failed to fetch' },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));

    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
};

export const Connected: Story = {
  args: {
    status: {
      state: 'connected',
      message: 'ping',
      campaignName: 'Curse of Strahd',
      checkedAt: new Date('2026-01-01T12:00:00.000Z'),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Curse of Strahd')).toBeInTheDocument();
  },
};

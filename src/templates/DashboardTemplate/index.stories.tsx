import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { DashboardTemplate } from '~/templates/DashboardTemplate';
import { ConnectionStatusView } from '~/organisms/ConnectionStatus/components/ConnectionStatusView';

/**
 * The template is driven entirely by props, including the connected panel,
 * which arrives as a slot. That is why it can be story-driven at all.
 */
const meta = {
  title: 'Templates/DashboardTemplate',
  component: DashboardTemplate,
  args: {
    campaignName: 'Curse of Strahd',
    isInitiativeTrackerEnabled: false,
    statusSlot: (
      <ConnectionStatusView
        status={{
          state: 'connected',
          message: 'ping',
          campaignName: 'Curse of Strahd',
          checkedAt: new Date('2026-01-01T12:00:00.000Z'),
        }}
        onRetry={() => {}}
      />
    ),
  },
  argTypes: {
    isInitiativeTrackerEnabled: { control: 'boolean' },
    campaignName: { control: 'text' },
  },
} satisfies Meta<typeof DashboardTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GateOff: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText('Initiative')).not.toBeInTheDocument();
  },
};

export const GateOn: Story = {
  args: { isInitiativeTrackerEnabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Initiative')).toBeInTheDocument();
  },
};

export const Connecting: Story = {
  args: {
    statusSlot: (
      <ConnectionStatusView status={{ state: 'pending' }} onRetry={() => {}} />
    ),
  },
};

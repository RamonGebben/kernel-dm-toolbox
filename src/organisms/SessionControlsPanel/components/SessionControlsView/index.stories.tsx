import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SessionControlsView } from '~/organisms/SessionControlsPanel/components/SessionControlsView';

const meta = {
  title: 'Organisms/SessionControlsPanel/SessionControlsView',
  component: SessionControlsView,
  args: {
    hasActiveMap: true,
    mode: 'map',
    onModeChange: fn(),
    orientation: 'auto',
    onOrientationChange: fn(),
  },
} satisfies Meta<typeof SessionControlsView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MapMode: Story = {};

export const TrackerMode: Story = {
  args: { mode: 'tracker' },
};

export const BothMode: Story = {
  args: { mode: 'both' },
};

export const LandscapeOverride: Story = {
  args: { orientation: 'landscape' },
};

export const PortraitOverride: Story = {
  args: { orientation: 'portrait' },
};

export const SwitchingOrientation: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('tab', { name: 'Portrait' }));

    await expect(args.onOrientationChange).toHaveBeenCalledWith('portrait');
  },
};

export const NoActiveMap: Story = {
  args: { hasActiveMap: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No map is live yet')).toBeVisible();
  },
};

export const SwitchingMode: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('tab', { name: 'Tracker' }));

    await expect(args.onModeChange).toHaveBeenCalledWith('tracker');
  },
};

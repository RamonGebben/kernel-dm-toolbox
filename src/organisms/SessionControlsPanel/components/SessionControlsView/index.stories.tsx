import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, spyOn, userEvent, within } from 'storybook/test';
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
    trackerOpacity: 0.9,
    onTrackerOpacityChange: fn(),
    trackerScale: 1,
    onTrackerScaleChange: fn(),
    trackerShowInitiative: true,
    onTrackerShowInitiativeChange: fn(),
    trackerShowName: true,
    onTrackerShowNameChange: fn(),
    trackerShowHealth: true,
    onTrackerShowHealthChange: fn(),
    trackerShowConditions: false,
    onTrackerShowConditionsChange: fn(),
  },
} satisfies Meta<typeof SessionControlsView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MapMode: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const openSpy = spyOn(window, 'open').mockImplementation(() => null);

    await userEvent.click(canvas.getByText('Open the player screen ↗'));

    await expect(openSpy).toHaveBeenCalledWith(
      '/player',
      'kernel-dm-toolbox-player-screen',
      expect.stringContaining('popup'),
    );

    openSpy.mockRestore();
  },
};

export const TrackerMode: Story = {
  args: { mode: 'tracker' },
};

export const BothMode: Story = {
  args: { mode: 'both' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Tracker overlay')).toBeVisible();
  },
};

/** The tracker overlay block is inert outside `'both'` mode, so it's hidden
 * rather than shown disabled. */
export const MapModeHidesTrackerOverlayBlock: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText('Tracker overlay')).not.toBeInTheDocument();
  },
};

export const BothModeAtOverlayExtremes: Story = {
  args: {
    mode: 'both',
    trackerOpacity: 0,
    trackerScale: 2,
    trackerShowInitiative: false,
    trackerShowName: false,
    trackerShowHealth: false,
    trackerShowConditions: true,
  },
};

export const SwitchingShowConditions: Story = {
  args: { mode: 'both' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByLabelText('Show conditions'));

    await expect(args.onTrackerShowConditionsChange).toHaveBeenCalledWith(true);
  },
};

export const SwitchingTrackerFieldToggle: Story = {
  args: { mode: 'both' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByLabelText('Show initiative'));

    await expect(args.onTrackerShowInitiativeChange).toHaveBeenCalledWith(
      false,
    );
  },
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

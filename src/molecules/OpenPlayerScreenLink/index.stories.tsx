import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, spyOn, userEvent, within } from 'storybook/test';
import { OpenPlayerScreenLink } from '~/molecules/OpenPlayerScreenLink';

const meta = {
  title: 'Molecules/OpenPlayerScreenLink',
  component: OpenPlayerScreenLink,
} satisfies Meta<typeof OpenPlayerScreenLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // `window.open`, not navigation — a named window that a second click
    // refocuses rather than reopening.
    const openSpy = spyOn(window, 'open').mockImplementation(() => null);

    await userEvent.click(canvas.getByText('Open the player screen ↗'));

    // The window-features string (size/position/chrome) is a tuning knob
    // that changes independently of this behaviour, so it's matched loosely
    // rather than pinned to exact numbers.
    await expect(openSpy).toHaveBeenCalledWith(
      '/player',
      'kernel-dm-toolbox-player-screen',
      expect.stringContaining('popup'),
    );

    openSpy.mockRestore();
  },
};

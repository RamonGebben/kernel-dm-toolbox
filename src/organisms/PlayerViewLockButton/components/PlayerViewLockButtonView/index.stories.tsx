import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PlayerViewLockButtonView } from '~/organisms/PlayerViewLockButton/components/PlayerViewLockButtonView';

const meta = {
  title: 'Organisms/PlayerViewLockButton/PlayerViewLockButtonView',
  component: PlayerViewLockButtonView,
  args: { isLocked: false, onToggle: fn() },
} satisfies Meta<typeof PlayerViewLockButtonView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unlocked: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Lock player view')).toBeVisible();
  },
};

export const Locked: Story = {
  args: { isLocked: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Unlock player view')).toBeVisible();
  },
};

export const Toggling: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByLabelText('Lock player view'));

    await expect(args.onToggle).toHaveBeenCalled();
  },
};

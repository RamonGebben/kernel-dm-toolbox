import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TrackerOverlay } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/TrackerOverlay';

const meta = {
  title: 'Organisms/PlayerScreen/PlayerScreenView/TrackerOverlay',
  component: TrackerOverlay,
  args: {
    $top: 0,
    $left: 0,
    $width: 1,
    $height: 1,
    $opacity: 1,
    children: 'Tracker Overlay',
  },
} satisfies Meta<typeof TrackerOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

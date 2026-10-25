import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Round } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Round';

const meta = {
  title: 'Organisms/TrackerOverlayBoard/TrackerOverlayBoardView/Round',
  component: Round,
  args: {
    children: 'Round',
  },
} satisfies Meta<typeof Round>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

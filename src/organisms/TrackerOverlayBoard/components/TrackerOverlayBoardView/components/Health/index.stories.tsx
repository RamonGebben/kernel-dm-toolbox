import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Health } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Health';

const meta = {
  title: 'Organisms/TrackerOverlayBoard/TrackerOverlayBoardView/Health',
  component: Health,
  args: {
    $status: 'healthy',
    children: 'Health',
  },
} satisfies Meta<typeof Health>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

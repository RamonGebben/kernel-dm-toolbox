import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Initiative } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Initiative';

const meta = {
  title: 'Organisms/TrackerOverlayBoard/TrackerOverlayBoardView/Initiative',
  component: Initiative,
  args: {
    children: 'Initiative',
  },
} satisfies Meta<typeof Initiative>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

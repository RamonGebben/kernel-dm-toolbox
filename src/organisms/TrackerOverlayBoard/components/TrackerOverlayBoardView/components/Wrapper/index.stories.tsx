import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Wrapper } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Wrapper';

const meta = {
  title: 'Organisms/TrackerOverlayBoard/TrackerOverlayBoardView/Wrapper',
  component: Wrapper,
  args: {
    children: 'Wrapper',
  },
} satisfies Meta<typeof Wrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Conditions } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Conditions';

const meta = {
  title: 'Organisms/TrackerOverlayBoard/TrackerOverlayBoardView/Conditions',
  component: Conditions,
  args: {
    children: 'Conditions',
  },
} satisfies Meta<typeof Conditions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

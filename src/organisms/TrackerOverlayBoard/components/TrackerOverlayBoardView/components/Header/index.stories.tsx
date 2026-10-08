import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Header } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Header';

const meta = {
  title: 'Organisms/TrackerOverlayBoard/TrackerOverlayBoardView/Header',
  component: Header,
  args: {
    children: 'Header',
  },
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

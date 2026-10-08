import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EmptyOverlay } from '~/organisms/MapCanvas/components/MapCanvasView/components/EmptyOverlay';

const meta = {
  title: 'Organisms/MapCanvas/MapCanvasView/EmptyOverlay',
  component: EmptyOverlay,
  args: {
    children: 'Empty Overlay',
  },
} satisfies Meta<typeof EmptyOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

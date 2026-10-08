import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Canvas } from '~/organisms/MapCanvas/components/MapCanvasView/components/Canvas';

const meta = {
  title: 'Organisms/MapCanvas/MapCanvasView/Canvas',
  component: Canvas,
  args: {
    'aria-label': 'Canvas',
  },
} satisfies Meta<typeof Canvas>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

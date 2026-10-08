import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CanvasArea } from '~/templates/MapsTemplate/components/CanvasArea';

const meta = {
  title: 'Templates/MapsTemplate/CanvasArea',
  component: CanvasArea,
  args: {
    children: 'Canvas Area',
  },
} satisfies Meta<typeof CanvasArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

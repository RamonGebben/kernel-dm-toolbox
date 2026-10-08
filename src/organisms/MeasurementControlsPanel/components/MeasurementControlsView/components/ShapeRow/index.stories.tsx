import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ShapeRow } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/ShapeRow';

const meta = {
  title: 'Organisms/MeasurementControlsPanel/MeasurementControlsView/ShapeRow',
  component: ShapeRow,
  args: {
    $isSelected: false,
    children: 'Shape Row',
  },
} satisfies Meta<typeof ShapeRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

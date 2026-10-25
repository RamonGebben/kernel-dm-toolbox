import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ShapeRowLabel } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/ShapeRowLabel';

const meta = {
  title:
    'Organisms/MeasurementControlsPanel/MeasurementControlsView/ShapeRowLabel',
  component: ShapeRowLabel,
  args: {
    children: 'Shape Row Label',
  },
} satisfies Meta<typeof ShapeRowLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

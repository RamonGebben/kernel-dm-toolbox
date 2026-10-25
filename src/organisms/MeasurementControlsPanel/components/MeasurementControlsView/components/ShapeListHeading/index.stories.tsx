import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ShapeListHeading } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/ShapeListHeading';

const meta = {
  title:
    'Organisms/MeasurementControlsPanel/MeasurementControlsView/ShapeListHeading',
  component: ShapeListHeading,
  args: {
    children: 'Shape List Heading',
  },
} satisfies Meta<typeof ShapeListHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

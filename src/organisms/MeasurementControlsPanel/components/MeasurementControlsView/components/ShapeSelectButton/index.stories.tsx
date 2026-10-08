import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ShapeSelectButton } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/ShapeSelectButton';

const meta = {
  title:
    'Organisms/MeasurementControlsPanel/MeasurementControlsView/ShapeSelectButton',
  component: ShapeSelectButton,
  args: {
    children: 'Shape Select Button',
  },
} satisfies Meta<typeof ShapeSelectButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

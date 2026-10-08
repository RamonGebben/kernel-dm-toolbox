import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ShapeSwatch } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/ShapeSwatch';

const meta = {
  title:
    'Organisms/MeasurementControlsPanel/MeasurementControlsView/ShapeSwatch',
  component: ShapeSwatch,
  args: {
    $color: '#e0904a',
  },
} satisfies Meta<typeof ShapeSwatch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

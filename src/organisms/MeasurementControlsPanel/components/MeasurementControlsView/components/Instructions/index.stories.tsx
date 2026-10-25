import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Instructions } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/Instructions';

const meta = {
  title:
    'Organisms/MeasurementControlsPanel/MeasurementControlsView/Instructions',
  component: Instructions,
  args: {
    children: 'Instructions',
  },
} satisfies Meta<typeof Instructions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

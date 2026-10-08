import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PresetRow } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/PresetRow';

const meta = {
  title: 'Organisms/MeasurementControlsPanel/MeasurementControlsView/PresetRow',
  component: PresetRow,
  args: {
    children: 'Preset Row',
  },
} satisfies Meta<typeof PresetRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

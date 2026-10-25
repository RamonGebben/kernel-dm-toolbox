import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PresetButton } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/PresetButton';

const meta = {
  title:
    'Organisms/MeasurementControlsPanel/MeasurementControlsView/PresetButton',
  component: PresetButton,
  args: {
    $isActive: false,
    children: 'Preset Button',
  },
} satisfies Meta<typeof PresetButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

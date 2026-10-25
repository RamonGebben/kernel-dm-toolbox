import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SpellOptionHeader } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/SpellOptionHeader';

const meta = {
  title:
    'Organisms/MeasurementControlsPanel/MeasurementControlsView/SpellOptionHeader',
  component: SpellOptionHeader,
  args: {
    children: 'Spell Option Header',
  },
} satisfies Meta<typeof SpellOptionHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

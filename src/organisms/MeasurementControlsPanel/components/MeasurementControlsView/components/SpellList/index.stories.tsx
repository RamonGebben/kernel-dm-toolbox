import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SpellList } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/SpellList';

const meta = {
  title: 'Organisms/MeasurementControlsPanel/MeasurementControlsView/SpellList',
  component: SpellList,
  args: {
    children: 'Spell List',
  },
} satisfies Meta<typeof SpellList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

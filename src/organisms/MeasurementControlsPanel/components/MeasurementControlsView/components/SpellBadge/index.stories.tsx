import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SpellBadge } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/SpellBadge';

const meta = {
  title:
    'Organisms/MeasurementControlsPanel/MeasurementControlsView/SpellBadge',
  component: SpellBadge,
  args: {
    children: 'Spell Badge',
  },
} satisfies Meta<typeof SpellBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

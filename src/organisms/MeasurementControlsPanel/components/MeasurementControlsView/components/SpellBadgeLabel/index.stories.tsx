import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SpellBadgeLabel } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/SpellBadgeLabel';

const meta = {
  title:
    'Organisms/MeasurementControlsPanel/MeasurementControlsView/SpellBadgeLabel',
  component: SpellBadgeLabel,
  args: {
    children: 'Spell Badge Label',
  },
} satisfies Meta<typeof SpellBadgeLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

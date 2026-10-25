import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SpellOption } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/SpellOption';

const meta = {
  title:
    'Organisms/MeasurementControlsPanel/MeasurementControlsView/SpellOption',
  component: SpellOption,
  args: {
    children: 'Spell Option',
  },
} satisfies Meta<typeof SpellOption>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

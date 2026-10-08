import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Initiative } from '~/molecules/CombatantRow/components/Initiative';

const meta = {
  title: 'Molecules/CombatantRow/Initiative',
  component: Initiative,
  args: {
    children: 'Initiative',
  },
} satisfies Meta<typeof Initiative>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

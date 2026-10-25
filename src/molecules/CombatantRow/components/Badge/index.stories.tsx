import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from '~/molecules/CombatantRow/components/Badge';

const meta = {
  title: 'Molecules/CombatantRow/Badge',
  component: Badge,
  args: {
    $tone: 'active',
    children: 'Badge',
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

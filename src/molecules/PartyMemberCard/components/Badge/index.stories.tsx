import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from '~/molecules/PartyMemberCard/components/Badge';

const meta = {
  title: 'Molecules/PartyMemberCard/Badge',
  component: Badge,
  args: {
    children: 'Badge',
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card } from '~/molecules/PartyMemberCard/components/Card';

const meta = {
  title: 'Molecules/PartyMemberCard/Card',
  component: Card,
  args: {
    $isActive: false,
    children: 'Card',
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

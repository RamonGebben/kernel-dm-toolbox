import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Balance } from '~/organisms/PartyTreasury/components/PartyTreasuryView/components/Balance';

const meta = {
  title: 'Organisms/PartyTreasury/PartyTreasuryView/Balance',
  component: Balance,
  args: {
    children: 'Balance',
  },
} satisfies Meta<typeof Balance>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

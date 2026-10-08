import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Count } from '~/organisms/BastionDetail/components/BastionDetailView/components/DefensesSection/components/Count';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/DefensesSection/Count',
  component: Count,
  args: {
    children: 'Count',
  },
} satisfies Meta<typeof Count>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Line } from '~/organisms/BastionDetail/components/BastionDetailView/components/DefensesSection/components/Line';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/DefensesSection/Line',
  component: Line,
  args: {
    children: 'Line',
  },
} satisfies Meta<typeof Line>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

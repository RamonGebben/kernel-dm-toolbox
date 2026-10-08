import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Allowances } from '~/organisms/BastionDetail/components/BastionDetailView/components/Allowances';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/Allowances',
  component: Allowances,
  args: {
    children: <li>Item</li>,
  },
} satisfies Meta<typeof Allowances>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

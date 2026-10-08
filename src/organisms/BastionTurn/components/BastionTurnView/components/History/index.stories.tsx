import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { History } from '~/organisms/BastionTurn/components/BastionTurnView/components/History';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/History',
  component: History,
  args: {
    children: <li>Item</li>,
  },
} satisfies Meta<typeof History>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
